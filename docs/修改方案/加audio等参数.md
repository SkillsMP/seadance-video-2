# Video Generate Audio 等参数方案

> 最终口径：**control 层参数化一次做对；pricing / output / provider 层不提前扩张。**
>
> 这不是只给 `generate_audio` 加白名单的临时补丁，也不是提前造一套 pricing / output 大框架。目标是在最小入侵范围内，把最容易变成硬编码堆叠的 control 层做成稳定接口。

---

## 一句话结论

本次做：

- `ControlOption` 增加可选 UI 元数据：`label` / `ui` / `order`。
- video controls 从 `entry.controls[scene]` 自动枚举。
- boolean control 通用渲染为 `Switch`。
- Seedance 2.0 的 `generate_audio` 作为普通 boolean control 接入，默认 `false`。
- 移除当前 `enforced.generate_audio = false`。
- 在 `src/config/ai/models.ts` 的 `validateControls()` 里轻量校验 UI metadata。

本次不做：

- 不改 pricing。
- 不改 output 结构。
- 不改 KIE adapter。
- 不改 `/api/ai/generate`。
- 不改数据库。
- 不加 `pricingModifiers`。
- 不加 `quantityControl`。
- 不加 `usageMeteredControls`。
- 不提前写 `output_number` / `web_search`。
- 不拆 family / SKU。
- 不新增 Registry / Resolver / Builder 之类的大抽象。

---

## 设计原则

网络资料只用于判断参数语义、是否计费、计费单位，不照抄平台参数到项目架构里。

项目内部保持四层分工：

| 层 | 职责 | 本次是否扩展 |
|---|---|---|
| `controls` | 用户可选生成参数、类型、默认值、可选值、轻量 UI 元数据 | 是 |
| `pricing` | 哪些参数影响扣费，以及如何扣费 | 否 |
| `adapter` | 项目参数如何映射到 provider 参数 | 否 |
| `output handling` | 哪些参数影响返回结果数量、展示、存储、下载 | 否 |

这次只处理 control 层。`pricing` / `adapter` / `output` 都保持现状。

---

## 为什么不是只加白名单

当前 `video-controls.ts` 的写法仍然偏硬编码：

```ts
const VIDEO_BASE_CONTROL_NAMES = ['duration', 'aspect_ratio'] as const;
const VIDEO_RESOLUTION_CONTROL_NAME = 'resolution';
```

并且 label / option 格式化也靠函数特例：

```ts
getControlLabel('duration') => 'Duration'
getControlLabel('aspect_ratio') => 'Aspect ratio'
getControlLabel('resolution') => 'Resolution'
```

如果只把 `generate_audio` 加进去，后面每来一个参数都要继续改：

- `VIDEO_BASE_CONTROL_NAMES`
- `getControlLabel()`
- `formatControlOption()`
- `video.tsx` 渲染分支
- 可能还有 pricing 特例

这会慢慢变成硬编码堆叠。

更好的平衡点是：**把 control 声明做参数化，但不把 billing 和 output 逻辑塞进 control。**

---

## 为什么不做 pricing 大框架

`generate_audio`、`output_number`、`web_search` 三类参数性质不同：

| 参数 | control | 影响计费 | 影响输出数量 | 当前处理 |
|---|---:|---:|---:|---|
| `duration` | 是 | 是 | 否 | 已有 |
| `resolution` | 是 | 是 | 否 | 已有 |
| `aspect_ratio` | 是 | 否 | 否 | 已有 |
| `generate_audio` | 是 | 当前暂不 | 否 | 本次做 |
| `output_number` | 是 | 是 | 是 | 以后单独做 |
| `web_search` | 是 | 可能 | 否 | 以后谨慎做 |

Seedance 2.0 的 `generate_audio` 当前更适合视为普通生成参数：它是可关闭的同步音频能力，现有公开资料没有显示 Seedance 2.0 按音频开关单独计费；EvoLink 还明确说明 audio generation included at no extra charge。

所以这次不应该为了 `generate_audio` 提前实现：

- `pricing.modifiers`
- `pricing.quantityControl`
- `pricing.usageMeteredControls`
- `byGenerateAudio`

这些会让代码变重，而且当前没有实际计费需求支撑。

---

## 默认值：为什么是 `false`

当前项目在 `src/config/ai/models.ts` 中已经强制：

```ts
enforced: {
  [scene]: {
    generate_audio: false,
  },
}
```

这意味着当前线上行为等价于：默认静音，且用户无法覆盖。

本次新增开关后，默认仍应保持 `false`：

- 不改变老用户默认输出。
- 不把 provider 默认值当成产品默认值。
- 用户主动打开才生成音频。

如果以后产品决定默认带音频，应单独改 `default`，这是产品策略变化，不和本次能力接入混在一起。

---

## 最终实现方案

### 执行时必须守住的边界

这三条是实现时的硬约束：

1. `VIDEO_CONTROL_ORDER` 只做排序兜底，不能变成新的展示白名单。

   control 展示来源必须始终是：

   ```ts
   entry.controls?.[scene]
   ```

   不能改回：

   ```ts
   VIDEO_CONTROL_ORDER.map(...)
   ```

   否则就会从 registry 驱动退回白名单模式。

2. `generate_audio` 必须同时在 `controls` 和 `defaults` 中声明。

   ```ts
   controls.generate_audio.default = false
   defaults.generate_audio = false
   ```

   这样未传参数时，`finalOptions.generate_audio` 稳定为 `false`，不会依赖 provider 默认值，也不会改变当前线上静音行为。

3. validator 的落点是 `src/config/ai/models.ts` 的 `validateControls()`。

   不要主要修改 `scripts/validate-ai-models.ts`。该脚本只是入口，真正需要增强的是 registry 自身校验逻辑。

### 1. `models.ts`：扩展 `ControlOption`

在 `src/config/ai/models.ts` 中把 `ControlOption` 扩展为：

```ts
export interface ControlOption<T extends ControlValue = ControlValue> {
  type: 'string' | 'number' | 'boolean';
  default: T;
  options: T[];

  /**
   * Optional UI metadata for generator controls.
   * Keep billing out of controls. Pricing decides whether a control affects cost.
   */
  label?: string;
  ui?: 'select' | 'switch';
  order?: number;
}
```

注意：

- `label` 可选，不要求每个 control 都写。
- `ui` 可选，是 override，不是必填。
- `order` 可选，用于排序，不写则走默认排序兜底。
- 不在 `ControlOption` 里放计费语义。

### 2. `models.ts`：接入 `generate_audio`

在 Seedance 2.0 的 controls 中增加：

```ts
generate_audio: {
  type: 'boolean',
  default: false,
  options: [false, true],
  label: 'Generate Audio',
  ui: 'switch',
  order: 40,
}
```

在 defaults 中增加：

```ts
generate_audio: false
```

移除当前：

```ts
enforced: {
  [scene]: {
    generate_audio: false,
  },
}
```

说明：

- `generate_audio` 不再是 enforced，否则用户开关没有意义。
- 默认值仍为 `false`，保持兼容。
- 不新增 audio pricing。
- 不改 `credits` / `byResolution` / `duration` 的计费逻辑。

### 3. `models.ts`：轻量校验 UI metadata

validator 不主要改 `scripts/validate-ai-models.ts`。该脚本只是入口，真正的 registry 校验逻辑在 `src/config/ai/models.ts`。

应在 `validateControls()` 中增加轻校验：

- `label` 如果存在，必须是非空 string。
- `ui` 如果存在，只能是 `select` 或 `switch`。
- `order` 如果存在，必须是有限 number。

不要加更重的规则：

- 不要求每个 control 必须有 `label`。
- 不要求每个 control 必须有 `ui`。
- 不要求每个 control 必须有 `order`。

这样能防止 registry 写错导致前端静默异常，同时不把配置规则变重。

### 4. `video-controls.ts`：从 registry 自动枚举 controls

当前不要继续维护展示白名单。应从：

```ts
entry.controls?.[scene]
```

自动生成 control entries。

推荐形态：

```ts
const VIDEO_CONTROL_ORDER: Record<string, number> = {
  duration: 10,
  aspect_ratio: 20,
  resolution: 30,
  generate_audio: 40,
};

export function getVideoControlEntries({
  entry,
  scene,
  allowResolutionControl,
}: {
  entry?: ModelEntry;
  scene: string;
  allowResolutionControl: boolean;
}): VideoControlEntry[] {
  const controls = entry?.controls?.[scene] ?? {};

  return Object.entries(controls)
    .filter(([name]) => allowResolutionControl || name !== 'resolution')
    .sort(compareVideoControls);
}
```

排序规则：

```ts
const leftOrder = leftControl.order ?? VIDEO_CONTROL_ORDER[leftName] ?? 999;
const rightOrder = rightControl.order ?? VIDEO_CONTROL_ORDER[rightName] ?? 999;
```

如果 order 相同，再按 name 排序，保证稳定输出。

注意：`VIDEO_CONTROL_ORDER` 只放当前真实支持的参数，不提前写 `output_number` / `web_search`。未来参数真接入时，在 registry 里写 `order` 即可。

### 5. `video-controls.ts`：label 和 option 格式化通用化

`getControlLabel()` 优先用 registry：

```ts
export function getControlLabel(name: string, control?: ControlOption): string {
  return control?.label ?? fallbackLabel(name);
}
```

fallback 只服务现有参数：

```ts
duration => Duration
aspect_ratio => Aspect ratio
resolution => Resolution
generate_audio => Generate Audio
```

`formatControlOption()` 不要只认 `generate_audio`，而应按类型处理 boolean：

```ts
if (control.type === 'boolean') {
  return value ? 'On' : 'Off';
}
```

这样 boolean control 是一等公民，不是 audio 特例。

### 6. `video.tsx`：boolean control 通用 Switch 渲染

不要写：

```tsx
if (name === 'generate_audio') {
  return <Switch />;
}
```

应写成：

```tsx
if (control.ui === 'switch' || control.type === 'boolean') {
  return <Switch />;
}
```

非 boolean control 继续走现有 Select。

这样做的收益：

- `generate_audio` 用正确的开关 UI。
- 未来普通 boolean control 可以复用。
- 不新增组件文件，不引入大抽象。
- 不把 provider 参数硬编码在 UI 层。

### 7. 后端和 provider 保持现状

不改：

- `src/app/api/ai/generate/route.ts`
- `src/config/ai/generation-pricing.ts`
- `src/config/ai/credit-costs.ts`
- `src/extensions/ai/kie.ts`
- 数据库 schema
- `/api/ai/providers`

原因：

- `resolveFinalOptions()` 已经通过 registry controls 做白名单过滤。
- KIE adapter 已经能透传 `options.generate_audio`。
- 当前 `generate_audio` 不影响计费。
- `ai_task.options` 已经能保存最终参数。

---

## Output Number 后续怎么接

本次不实现 `output_number`，也不在代码里提前写它。

它不是普通无成本 control，因为它至少影响：

1. 计费：通常要乘以输出数量。
2. 返回结构：一次任务可能返回多个视频或图片。
3. UI：要展示多个结果、批量下载或逐个下载。
4. 限制：要限制最大数量，避免用户一次生成过多。

以后接入时，推荐方向是：

```ts
pricing: {
  mode: 'perSecond',
  byResolution: { ... },
  quantityControl: 'output_number',
}
```

计费：

```ts
credits = duration * creditsPerSecond * output_number
```

但这属于单独任务，不混进本次 audio。

---

## Web Search 后续怎么接

本次不实现 `web_search`，也不在代码里提前写它。

`web_search` 更特殊，因为成本可能不是固定的：

- 用户开启搜索。
- provider 可能实际搜索 0 次、1 次或多次。
- 最终成本可能取决于实际触发次数。

当前系统是在创建任务前计算并扣除 `costCredits`，更适合生成前可确定成本的参数。

以后有三种策略：

| 方案 | 稳定性 | 建议 |
|---|---:|---|
| 暂不开放 | 高 | 最稳 |
| 开启后按固定预估价收费 | 中 | 可能和实际成本不一致 |
| provider 返回实际 search 次数后补扣/结算 | 中偏复杂 | 单独设计 |

---

## 测试与验收

建议覆盖：

- `generate_audio=true` 能进入 `resolveFinalOptions()` 的 finalOptions。
- 未传 `generate_audio` 时，finalOptions 默认 `false`。
- `generate_audio` 不影响当前 `calculateModelCredits()` 结果。
- 未声明 `generate_audio` 的模型不会接受该字段。
- `validateControls()` 能发现错误 UI metadata：
  - 空 `label`
  - 非法 `ui`
  - 非 number 的 `order`
- 现有 duration / aspect ratio / resolution controls 行为不变。

建议改动测试文件：

- `scripts/test-resolve-final-options.ts`
- `scripts/test-calculate-model-credits.ts`
- 如需专门覆盖 validator，可在现有 `validateModels()` 相关测试或脚本中补最小断言。

验证命令：

```bash
pnpm ai:validate-models
```

如果执行实现，还应检查一次真实或半真实链路：

- 前端 `options`
- `/api/ai/generate` finalOptions
- `ai_task.options`
- KIE request payload

---

## 最终改动范围

建议改：

- `src/config/ai/models.ts`
- `src/shared/blocks/generator/video-controls.ts`
- `src/shared/blocks/generator/video.tsx`
- `scripts/test-resolve-final-options.ts`
- `scripts/test-calculate-model-credits.ts`

不建议改：

- `src/extensions/ai/kie.ts`
- `src/app/api/ai/generate/route.ts`
- `src/config/ai/credit-costs.ts`
- `src/config/ai/generation-pricing.ts`
- 数据库 schema
- provider fallback 策略

---

## 为什么这是最佳平衡

这版不是“过度保守的最小实现”，也不是“提前造框架”。

它的收益：

- `generate_audio` 作为真实生成参数接入，语义正确。
- control 层不再靠白名单和 label if/else 堆叠，后续参数更好接。
- pricing 仍保持独立，不把计费逻辑塞进 control。
- 默认 `false`，兼容当前线上无音频行为。
- provider 层已有支持，不重复改。
- 未来 `output_number` / `web_search` 有清晰方向，但不假预留、不提前实现。

它避免的风险：

- 不把网络平台所有参数搬进代码。
- 不提前实现复杂 pricing DSL。
- 不让 UI 层知道 provider-specific 参数映射。
- 不顺手重构 video generator。
- 不扩大到 generate route、provider fallback、数据库等无关流程。

最终原则：

```txt
1. family 继续表示稳定模型产品，不因为 audio 轻易拆脏。
2. controls 表示模型可选生成参数，未来参数都从 registry 声明。
3. ControlOption 只负责参数合法性和 UI 元数据，不负责计费。
4. pricing 独立决定哪些参数影响钱，当前仍只支持 duration + resolution。
5. generate_audio 当前只作为普通 control，默认 false。
6. output_number / web_search 预留设计方向，但不在本次实现。
```

一句话：**不要为 audio 做大计费框架，但要趁这次把 control 接口做成参数化，不再继续硬编码。**

---

## 参考资料

- KIE Seedance 2.0 Fast API 文档：`https://docs.kie.ai/market/bytedance/seedance-2-fast`
- Replicate Seedance 2.0：`https://replicate.com/bytedance/seedance-2.0`
- EvoLink Seedance 2.0：`https://evolink.ai/seedance-2-0`
- WaveSpeed Seedance 2.0：`https://wavespeed.ai/models/bytedance/seedance-2.0/image-to-video`
