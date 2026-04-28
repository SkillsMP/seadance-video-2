# Image 生成器改造方案

> 本文只保留一个最终方案。
> 旧的“直接展示 provider 对应模型项”的做法已废弃，不再作为候选方案。

---

## 一句话结论

用户只选择**模型家族**，不选择 provider。

provider 只作为系统内部的兜底链路存在：前端根据当前场景和已配置 key 生成候选列表，后端按顺序尝试，哪个先成功就用哪个，并把实际使用的 `provider + model` 落库。

这比旧方案更符合真实业务目标：

- 用户不需要理解 provider
- 不会再出现两个 `Nano Banana Pro`
- 可以自然支持 `kie` 失败后自动切到 `replicate`

---

## 为什么不再采用旧方案

旧方案的问题不只是“下拉重复”。

更本质的问题是：它把用户选择对象定义成了“某个 provider 上的某个模型项”，而不是“用户理解中的模型”。

这会带来三个问题：

- **交互错误**：当 `kie` 和 `replicate` 同时可用时，下拉里会出现两个 `Nano Banana Pro`
- **心智错误**：用户被迫间接感知 provider，但 provider 本来只是后台实现细节
- **架构错误**：如果真正目标是“主 provider 失败时自动兜底”，那兜底逻辑应该体现在提交链路，而不是暴露成多个可见选项让用户自己猜

所以这次不再讨论“给重复项加后缀”。

加后缀本质上只是把 provider 换个形式重新暴露给用户，仍然没有解决问题。

---

## 最终方案

### 核心思想

把当前 `MODEL_OPTIONS` 中的每一条，从“用户可见模型项”降级为“系统内部候选项”。

真正给用户看的选项是去重后的**模型家族**：

- `Nano Banana Pro`
- `Seedream 4`
- `Z-Image Turbo`
- `Flux 2 Flex`
- `Gemini 3 Pro Image Preview`

用户选中一个模型家族后，系统内部再根据：

- 当前场景（`text-to-image` / `image-to-image`）
- 当前可用 provider（是否配了 key）
- 预设优先级

计算出一条候选链路，例如：

```ts
[
  { provider: 'kie', model: 'nano-banana-pro' },
  { provider: 'replicate', model: 'google/nano-banana-pro' },
  { provider: 'fal', model: 'fal-ai/nano-banana-pro' },
]
```

后端按顺序尝试，谁先成功创建任务就用谁。

---

## 改造原则

1. **用户选择模型，不选择 provider**

2. **模型家族才是 UI 层单一真相**

3. **provider 是执行策略，不是 UI 状态**

4. **fallback 只做在“创建任务”阶段**

5. **优先级先用数组顺序表达，不新增 `priority` 字段**

6. **不引入额外抽象层，不搞 Registry / Resolver / Builder**

---

## 现状问题

当前 `src/shared/blocks/generator/image.tsx` 中的 `MODEL_OPTIONS`，实际表达的是“provider 上的具体部署项”：

```ts
const MODEL_OPTIONS = [
  { value: 'nano-banana-pro', label: 'Nano Banana Pro', provider: 'kie', scenes: ['text-to-image', 'image-to-image'] },
  { value: 'google/nano-banana-pro', label: 'Nano Banana Pro', provider: 'replicate', scenes: ['text-to-image', 'image-to-image'] },
  { value: 'bytedance/seedream-4', label: 'Seedream 4', provider: 'replicate', scenes: ['text-to-image', 'image-to-image'] },
  { value: 'fal-ai/nano-banana-pro', label: 'Nano Banana Pro', provider: 'fal', scenes: ['text-to-image'] },
  { value: 'fal-ai/nano-banana-pro/edit', label: 'Nano Banana Pro', provider: 'fal', scenes: ['image-to-image'] },
  { value: 'fal-ai/bytedance/seedream/v4/edit', label: 'Seedream 4', provider: 'fal', scenes: ['image-to-image'] },
  { value: 'fal-ai/z-image/turbo', label: 'Z-Image Turbo', provider: 'fal', scenes: ['text-to-image'] },
  { value: 'fal-ai/flux-2-flex', label: 'Flux 2 Flex', provider: 'fal', scenes: ['text-to-image'] },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image Preview', provider: 'gemini', scenes: ['text-to-image', 'image-to-image'] },
];
```

这份结构对系统执行是够用的，但对 UI 不够。

因为它缺少一个真正的业务概念：

- `Nano Banana Pro` 这个“模型家族”

如果没有这个概念，前端只能直接把 provider-specific 项展示出来，于是重复项不可避免。

---

## 唯一值得新增的字段

本次建议新增一个字段：`family`

```ts
const MODEL_OPTIONS = [
  {
    family: 'nano-banana-pro',
    value: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'kie',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    family: 'nano-banana-pro',
    value: 'google/nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'replicate',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    family: 'seedream-4',
    value: 'bytedance/seedream-4',
    label: 'Seedream 4',
    provider: 'replicate',
    scenes: ['text-to-image', 'image-to-image'],
  },
  // ...
];
```

这个字段是本次改造的关键。

之前“不新增 `familyKey`”的判断不再成立，因为现在已经确认：**“模型家族”不是冗余抽象，而是缺失的真实业务实体。**

---

## 优先级怎么定

### 当前结论

先不加 `priority` 字段。

**同一 `family` 下的数组顺序，就是 fallback 优先级。**

例如：

```ts
[
  { family: 'nano-banana-pro', provider: 'kie', ... },
  { family: 'nano-banana-pro', provider: 'replicate', ... },
  { family: 'nano-banana-pro', provider: 'fal', ... },
]
```

表示：

1. 先试 `kie`
2. 再试 `replicate`
3. 最后试 `fal`

### 为什么这样做

- 当前模型项数量很少
- 优先级只在少数同族模型之间有意义
- 数组顺序足够直观
- 后续真要调整，直接调换顺序即可

只有当未来出现以下情况时，才值得升级为显式 `priority` 字段：

- 模型条目明显膨胀
- 不同环境需要不同优先级
- 优先级需要被后台配置

在当前阶段，加 `priority` 是过度设计。

---

## 前端方案

### 1. 状态收口

不再维护独立的 `provider` state。

不再维护“provider + model 双状态同步”。

只保留一个用户选择状态：

```ts
const [selectedFamily, setSelectedFamily] = useState('');
```

然后从 `selectedFamily + activeTab + availableProviders` 派生出：

- `availableFamilyOptions`
- `selectedCandidates`
- 实际提交候选链路

这样做之后，UI 层不再有 provider 同步问题。

原有这几部分在新方案里都不再承担业务职责：

- `PROVIDER_OPTIONS`
- `handleProviderChange`
- 独立 `provider` state

如果希望保守改动，可以先**注释**，不着急删除。

### 2. 下拉展示去重后的模型家族

前端根据当前场景和可用 provider，先筛出可选候选项，再按 `family` 去重，得到真正展示给用户的列表。

用户看到的永远是：

- 一个 `Nano Banana Pro`
- 一个 `Seedream 4`

而不是多个同名 provider-specific 项。

这里不要只关注 `availableProviders` 是否为空。

真正应该关注的是：**在当前 scene 下，是否还有合法的可用模型家族，以及当前选中的 family 是否还有合法候选项。**

推荐的派生关系是：

```ts
const availableModelOptions = MODEL_OPTIONS.filter(
  (option) =>
    option.scenes.includes(activeTab) &&
    availableProviders.includes(option.provider)
);

const availableFamilyOptions = dedupeByFamily(availableModelOptions);

const selectedCandidates = availableModelOptions.filter(
  (option) => option.family === selectedFamily
);

const hasAvailableFamilies = availableFamilyOptions.length > 0;
const canGenerateForModelSelection =
  !isLoadingProviders &&
  hasAvailableFamilies &&
  selectedCandidates.length > 0;
```

这里的 `canGenerateForModelSelection` 只是**模型配置层面的可生成条件**，用于判断“当前是否存在合法模型可选、模型下拉和按钮是否应进入禁用态”。

它**不是**页面最终的生成按钮可用条件。

真正的按钮是否可点击，仍然需要继续叠加现有业务校验，例如：

- 用户是否已登录
- 是否正在生成中
- 提示词是否为空
- 积分是否足够
- 图生图时参考图是否已上传

这意味着有三种情况需要区分：

- `availableProviders` 为空：当前系统没有任何已配置的相关 provider
- `availableProviders` 不为空，但当前 scene 下没有任何可用 family：当前场景无可用模型
- 当前 `selectedFamily` 没有合法 candidates，但仍有其他 family 可用：应自动回退到第一个合法 family，而不是直接卡死

### 2.1 无可用模型时的 UI 行为

如果当前场景下没有任何合法可用模型：

- Model 下拉应为空态或 disabled
- 生成按钮应置灰
- 页面应给出明确提示

建议提示文案按页面类型区分：

- 用户侧页面：`当前暂无可用模型，请联系管理员配置相关模型 API Key`
- 管理侧或内部环境：`请先配置相关模型 API Key`

这条规则不要写成“只要 `availableProviders` 为空就禁用”。

更准确的说法应当是：

- 只要当前场景下 `availableFamilyOptions.length === 0`，就禁用生成按钮
- 即使还有 provider 已配置，但如果当前 scene 没有合法 family，同样不能生成
- 即使 `availableFamilyOptions` 不为空，如果当前 `selectedCandidates.length === 0`，也应作为最后保险禁用生成

也就是说，**按钮可用性应由派生结果控制，而不是只看原始 `availableProviders`。**

### 3. Tab 切换只切场景，不再手动同步 provider

`handleTabChange` 只负责：

- `setActiveTab(...)`
- `setCostCredits(...)`

如果当前 `selectedFamily` 在新场景下不可用，再统一由一个兜底 `useEffect` 回退到第一个合法 family。

### 4. 提交时发送候选链路

前端不再只发单个：

```ts
{ provider, model }
```

而是发：

```ts
{
  family: 'nano-banana-pro',
  candidates: [
    { provider: 'kie', model: 'nano-banana-pro' },
    { provider: 'replicate', model: 'google/nano-banana-pro' },
  ],
}
```

这里的 `candidates` 已经按优先级排好。

需要特别强调：`selectedCandidates` 的派生逻辑**不能只按 `family` 过滤**。

必须同时按以下三个条件过滤：

- `family`
- 当前 `scene`
- `availableProviders.includes(option.provider)`

也就是：

```ts
const selectedCandidates = MODEL_OPTIONS.filter(
  (option) =>
    option.family === selectedFamily &&
    option.scenes.includes(activeTab) &&
    availableProviders.includes(option.provider)
);
```

前面那种写法：

```ts
const selectedCandidates = availableModelOptions.filter(
  (option) => option.family === selectedFamily
);
```

与这里是**等价**的，前提是 `availableModelOptions` 本身已经先按 `scene + availableProviders` 过滤过。

文档同时保留两种写法，是为了分别强调：

- 派生链路可以先缩小范围再按 family 过滤
- 约束条件本身必须始终包含 `family + scene + availableProviders`

这条是硬约束，不是优化项。

原因是 `fal` 的 `Nano Banana Pro` 在不同 scene 下对应的是不同 `model value`：

- `text-to-image` → `fal-ai/nano-banana-pro`
- `image-to-image` → `fal-ai/nano-banana-pro/edit`

如果只按 `family` 过滤，不按 `scene` 过滤，候选链路里会混入错误模型，后端调用会直接失败。

---

## 后端方案

### 1. `/api/ai/generate` 接收候选链路

后端不再把前端传来的单个 `provider + model` 视为唯一执行项。

而是接收一个已经排序好的 `candidates`。

### 2. 只在“创建任务阶段”做 fallback

伪代码：

```ts
const errors: string[] = [];

for (const candidate of candidates) {
  try {
    const aiProvider = aiService.getProvider(candidate.provider);
    if (!aiProvider) {
      errors.push(
        `${candidate.provider}/${candidate.model}/${scene}: provider not found`
      );
      continue;
    }

    const result = await aiProvider.generate({
      params: {
        mediaType,
        model: candidate.model,
        prompt,
        options,
        callbackUrl: `${appUrl}/api/ai/notify/${candidate.provider}`,
      },
    });

    if (!result?.taskId) continue;

    // 成功后按实际命中的 provider + model 落库
    return success(candidate, result);
  } catch (error: any) {
    errors.push(
      `${candidate.provider}/${candidate.model}/${scene}: ${error.message}`
    );
    continue;
  }
}

console.error('All candidates failed:', errors);
throw new Error('All model candidates failed');
```

建议对用户仍然只返回统一错误，不暴露 provider 细节。

但服务端日志要保留完整失败链路，便于排查：

- 哪几个 candidate 被尝试过
- 每一步失败在哪个 provider / model / scene
- 每一步的错误信息是什么

### 3. generate 接口要渐进兼容旧路径

当前 `/api/ai/generate` 同时服务 image、video、music 生成器。

因此 image 改造时，不应该强迫 video / music 同步修改。

推荐兼容写法：

```ts
if (candidates?.length) {
  // 新路径：image 生成器走候选链路 fallback
} else if (provider && model) {
  // 旧路径：保留原逻辑，video/music 继续使用
} else {
  throw new Error('invalid params');
}
```

这能保证：

- image 可以先独立升级
- video / music 不受影响
- 接口风险最小

实现时建议给请求体一个明确类型，避免新旧两条路径混在一起后继续使用“直接解构”的弱约束写法，例如：

```ts
interface GenerateRequest {
  mediaType: string;
  prompt: string;
  options?: any;
  scene?: string;

  // 新路径
  family?: string;
  candidates?: Array<{
    provider: string;
    model: string;
  }>;

  // 旧路径
  provider?: string;
  model?: string;
}
```

### 4. 为什么只做创建阶段 fallback

因为这一步收益最大、复杂度最低。

如果 provider 在“创建任务前”就失败，例如：

- API 超时
- 请求参数不兼容
- 账户额度问题
- 服务商瞬时不可用

那么可以直接切下一个候选项，用户体验最好。

但如果已经成功创建了远端任务，后面轮询时才失败，那就是另一类问题：

- 是否要自动重试
- 是否要重复扣积分
- 是否要保留失败任务记录
- 是否会出现多任务并发生成

这明显属于下一阶段，不应该混在这次 v1 里。

---

## 这套方案为什么比旧方案更优雅

### 更符合用户认知

用户认知里只有“模型”，没有“模型背后的供应商部署”。

### 更符合真实业务目标

你增加多个 provider 的目的，不是为了让用户多选一次，而是为了提高成功率。

### 更少状态

从 `provider + model` 双状态，收口为 `selectedFamily` 单状态。

### 更少同步逻辑

不再需要在 init、tab 切换、模型切换、promptKey 回填等多个出口手动同步 `provider` 和 `model`。

### 更容易维护

新增某个 provider 的同族模型，只需要往 `MODEL_OPTIONS` 同 family 分组里追加一项，不需要改 UI 交互模型。

---

## 明确不做的事

以下内容本次明确不做：

- 不恢复 Provider `<Select>`
- 不给重复模型加 `(kie)`、`(replicate)` 后缀
- 不新增 `priority` 字段
- 不做任务创建成功后的二次自动重试
- 不做“轮询失败后自动切 provider 重新创建任务”
- 不做新的抽象层或新文件拆分
- 不让 `/api/ai/providers` 返回 model 级可用性

原因很简单：

这些要么会重新把 provider 暴露给用户，要么会把当前改造复杂度推高到不值得的程度。

---

## 最小改动清单

当后续开始改代码时，建议改动收口在以下位置：

- `src/shared/blocks/generator/image.tsx`
- `src/app/api/ai/generate/route.ts`

### 前端

- `MODEL_OPTIONS` 增加 `family`
- 注释 `PROVIDER_OPTIONS` 常量
- 注释 `handleProviderChange` 函数
- 注释或删除独立 `provider` state
- 新增 `selectedFamily`
- 新增 `availableFamilyOptions`
- 新增 `selectedCandidates`
- `selectedCandidates` 必须同时按 `family + scene + availableProviders` 过滤
- `handleTabChange` 简化
- Model `<Select>` 展示 family 去重结果
- `handleGenerate` 改为发送 `candidates`

### 后端

- `generate` 接口渐进兼容：优先支持 `candidates`，保留旧 `provider + model` 路径
- `generate` 接口支持 `candidates`
- 顺序尝试候选项
- 收集每个 candidate 的失败原因并统一写日志
- 成功后按实际命中的 `provider + model` 创建任务记录

---

## 实现注意事项

以下内容属于编码阶段的实现细节，不改变本方案主结论。

### 1. family 自动回退逻辑要有保护条件

文档前面提到：如果当前 `selectedFamily` 在新场景下不可用，应自动回退到第一个合法 family。

这里仍然建议把回退逻辑收口在一处，不要重新散落回 `handleTabChange`、初始化回调、历史回填等多个入口。

更稳妥的实现方式是保留一个**带保护条件**的 `useEffect`：

- 只有当当前 `selectedFamily` 已不在 `availableFamilyOptions` 中时才回退
- 如果当前 `selectedFamily` 仍然合法，则不触发任何更新

这样可以避免再次回到“多出口手动同步”的旧模式，也能避免无意义的重复渲染。

### 2. candidate 级超时是建议项，不是本次必做项

后端 fallback 是在同一个 HTTP 请求里顺序尝试 `candidates`。

这意味着如果第一个 candidate 长时间卡住才报错，会挤占后续 candidate 的处理时间。

当前阶段不建议把这件事升级成一整套复杂机制，但实现时可以考虑一条简单约束：

- 为单个 candidate 的创建请求设置一个相对合理的超时时间

这属于风险控制优化，不属于本次架构改造的核心目标，因此：

- 可以做
- 值得做
- 但不是本次方案成立的前置条件

---

## 最终结论

这次 image 生成器最合理的方向，不是“在现有方案一上继续打补丁”，也不是“只做状态合并但继续展示 provider-specific model”。

**最终应该采用：模型家族选择 + provider 自动兜底。**

这是当前阶段在：

- 优雅性
- 最小入侵
- 最大收益
- 可维护性
- 避免过度设计

之间最平衡的方案。
