# 借鉴 VideoFly 的生成器参数架构改造方案

> 参考对象：`https://videofly.app/`、`https://videofly.app/text-to-video`
> 当前项目：`D:\project3\shipany-2\bananapro-org`
> 本文定位：开发执行版，重点收敛 Phase 0A 的工程边界、验收标准和回滚风险。

## 0. 评审取舍结论

评审意见里最有价值、必须吸收的是：原方案方向正确，但 Phase 0A 范围过大，不适合直接开发。核心抽象应保留，但要拆成可独立开发、可独立验收、可回滚的小阶段。

本方案保留以下抽象：

- `model / family`
- `skuAttributes`
- `defaults`
- `controls`
- `pricing`
- `enforced`
- `finalOptions`
- `provider adapter`

本方案必须修正以下边界：

- Phase 0A 拆成 `0A-1 / 0A-2 / 0A-3`，不要把 registry 重整、最终参数链路、真实扣费迁移、adapter 清理塞进同一批。
- 动态计价必须加 feature flag，Phase 0A 只预埋结构和函数骨架，不改变线上实际扣费。
- `controls` schema 必须统一成对象结构，不能同时出现数组写法和对象写法。
- `image-to-video` 不默认开放，没有 enabled family 时前端应隐藏或禁用 tab。
- Provider fallback 成本一致性、输入 URL 深度安全校验保留为后续约束，不作为本轮 Phase 0A 阻塞项。

最终结论：

> 方案方向通过，但 Phase 0A 必须拆小执行。当前阶段优先完成 registry 结构重整、finalOptions 链路统一、Kie adapter 清理三个低耦合步骤；动态计价只预埋结构和函数，不默认影响真实扣费。真实扣费迁移放入 Phase 0B，并受 feature flag 控制。Provider 成本一致性和输入 URL 深度安全校验作为后续多 provider / 上传链路安全加固项，不作为本轮阻塞条件。

## 1. 为什么要改

当前视频生成链路有三个核心问题：

1. `family` 当前承担了 billing SKU、模型分组、UI 展示、计费查找等多重职责，长期会让 Seedance 多规格和动态计费难以扩展。
2. `enforced` 同时混入 `resolution`、`duration`、`aspect_ratio`、`generate_audio`，导致 SKU 固有规格、默认值、可选参数、硬限制语义混杂。
3. Kie adapter 仍有业务默认值兜底，导致真实下发参数不完全由 registry 和 API route 决定。

当前视频扣费也存在两套口径：

- 现网代码口径：`models.ts` 仍使用固定积分，当前 5s 实际表现为 `45 / 90 / 45`。
- 定价文档目标口径：`docs/定价/3.本项目定价方案.md` 第 3 节按 `creditsPerSecond × durationSeconds`，默认 5s 可能对应 `60 / 120 / 35`。

本次改造的关键不是立刻切换价格，而是先把“模型、规格、参数、价格、硬限制”的数据结构拆清楚。真实扣费切换必须后移到 Phase 0B，并由 feature flag 控制。

## 2. 字段职责

| 字段 | 职责 | 示例 |
| --- | --- | --- |
| `family` | 当前继续表示 billing SKU，不在本轮改成纯模型家族名 | `seedance-2-fast-480p` |
| `group` | UI 产品分组信息 | `Seedance 2 Fast` |
| `skuAttributes` | SKU 固有规格，用户不能覆盖 | `resolution: '480p'`、`inputBilling: 'no-video-input'` |
| `defaults` | 默认运行时参数，用户可在允许范围内覆盖 | `duration: 5`、`aspect_ratio: '16:9'` |
| `controls` | 前端可渲染、后端可校验的参数 schema | `duration.options`、`aspect_ratio.options` |
| `pricing` | 动态计价规则，Phase 0A 只预埋，不默认参与真实扣费 | `creditsPerSecond: 12` |
| `enforced` | 服务端最终强制覆盖的硬限制 | `generate_audio: false` |
| `finalOptions` | 服务端解析后的最终生成参数 | provider 调用、moderation、任务快照使用 |

`resolution` 不应长期放在 `enforced`，它是 SKU 固有规格，应进入 `skuAttributes`。`duration` 和 `aspect_ratio` 不应作为硬限制表达，应进入 `defaults / controls`。`generate_audio: false` 当前可以保留在 `enforced`，但要注明这是产品策略锁定，不是 provider 能力硬限制。

## 3. 统一 controls schema

`controls` 必须统一为对象结构。不要在文档、registry 或代码示例里同时出现旧的数组简写和带 `default / options` 的对象写法。

通用结构：

```ts
controls: {
  duration: {
    type: 'number',
    default: 5,
    options: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  aspect_ratio: {
    type: 'string',
    default: '16:9',
    options: ['16:9', '9:16', '1:1', '4:3', '3:4'],
  },
}
```

如需按 scene 区分，使用 scene 作为第一层 key：

```ts
controls: {
  'text-to-video': {
    duration: {
      type: 'number',
      default: 5,
      options: [4, 5, 6, 7, 8, 9, 10],
    },
    aspect_ratio: {
      type: 'string',
      default: '16:9',
      options: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    },
  },
  'video-to-video': {
    duration: {
      type: 'number',
      default: 5,
      options: [5, 10],
    },
  },
}
```

后端校验和前端渲染都以同一套 `controls` schema 为准。前端不能自己写一套允许值，后端也不能接受 registry 未声明的参数。

## 4. 推荐 ModelEntry 结构

`MODELS` 对外导出继续保持兼容，但内部源配置改为轻量 `catalog + factory`。本轮不要引入复杂多表系统。

```ts
interface ControlOption<T extends string | number | boolean = string | number | boolean> {
  type: 'string' | 'number' | 'boolean';
  default?: T;
  options?: T[];
}

type SceneControls = Record<string, ControlOption>;

interface ScenePricing {
  mode: 'fixed' | 'perSecond';
  credits?: number;
  creditsPerSecond?: number;
  defaultDuration?: number;
}

interface ModelEntry {
  mediaType: 'image' | 'video' | 'music';
  family: string;
  group?: {
    key: string;
    label: string;
  };
  value: string;
  label: string;
  provider: string;
  scenes: string[];
  enabled: boolean;
  credits: Record<string, number>;
  skuAttributes?: Partial<Record<string, Record<string, unknown>>>;
  defaults?: Partial<Record<string, Record<string, unknown>>>;
  controls?: Partial<Record<string, SceneControls>>;
  pricing?: Partial<Record<string, ScenePricing>>;
  enforced?: Partial<Record<string, Record<string, unknown>>>;
}
```

示例：

```ts
{
  mediaType: 'video',
  family: 'seedance-2-fast-480p',
  group: {
    key: 'seedance-2-fast',
    label: 'Seedance 2 Fast',
  },
  value: 'bytedance/seedance-2-fast',
  label: 'Seedance 2 Fast 480p',
  provider: 'kie',
  scenes: ['text-to-video'],
  enabled: true,
  credits: { 'text-to-video': 45 },
  skuAttributes: {
    'text-to-video': {
      resolution: '480p',
      inputBilling: 'no-video-input',
    },
  },
  defaults: {
    'text-to-video': {
      duration: 5,
      aspect_ratio: '16:9',
    },
  },
  controls: {
    'text-to-video': {
      duration: {
        type: 'number',
        default: 5,
        options: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      aspect_ratio: {
        type: 'string',
        default: '16:9',
        options: ['16:9', '9:16', '1:1', '4:3', '3:4'],
      },
    },
  },
  pricing: {
    'text-to-video': {
      mode: 'perSecond',
      creditsPerSecond: 12,
      defaultDuration: 5,
    },
  },
  enforced: {
    'text-to-video': {
      generate_audio: false,
    },
  },
}
```

注意：示例里的 `pricing` 是目标结构。Phase 0A 写入 `pricing` 不代表真实扣费已经切换。

## 5. 动态计价 feature flag

必须增加动态计价开关：

```env
ENABLE_DYNAMIC_VIDEO_PRICING=false
```

规则：

1. Phase 0A 即使 registry 已经写入 `pricing`，也不能默认影响真实扣费。
2. 只有当 `ENABLE_DYNAMIC_VIDEO_PRICING=true` 时，才允许 `/api/ai/generate` 接入 `calculateModelCredits()` 作为真实扣费来源。
3. Phase 0B 才正式切换真实扣费。
4. 这个开关必须作为防止误上线的保护措施。

明确结论：

> Phase 0A 只完成动态计价的数据结构和函数骨架，不改变线上实际扣费。真实扣费切换必须放到 Phase 0B，并受 feature flag 控制。

## 6. 服务端 finalOptions 链路

服务端最终参数合并顺序必须统一为：

```ts
defaults -> sanitized user options -> auto resolved options -> skuAttributes -> enforced
```

推荐形态：

```ts
const defaults = entry.defaults?.[scene] ?? {};
const sanitizedOptions = sanitizeGenerationOptions({
  mediaType,
  scene,
  entry,
  options,
});
const baseOptions = {
  ...defaults,
  ...sanitizedOptions,
};

const autoResolvedOptions = resolveAutoOptions({
  entry,
  scene,
  options: baseOptions,
});
const skuAttributes = entry.skuAttributes?.[scene] ?? {};
const enforced = entry.enforced?.[scene] ?? {};

const finalOptions = {
  ...baseOptions,
  ...autoResolvedOptions,
  ...skuAttributes,
  ...enforced,
};
```

`resolveAutoOptions()` 统一只返回自动推导出的**增量参数**，不返回完整 options。`finalOptions` 中已显式 spread `baseOptions`，IDE AI 实现时不得将 `resolveAutoOptions()` 改成返回完整 options，否则可能造成用户合法参数或 defaults 被自动推导结果静默覆盖，导致最终参数语义不稳定。也就是说，`resolveAutoOptions()` 的返回值只能包含需要自动补充或自动修正的字段。

`finalOptions` 应统一用于：

- provider adapter 输入
- moderation
- 任务创建
- 任务落库快照
- 后续动态计价输入

`skuAttributes` 中可能包含 `inputBilling` 等内部计费属性。adapter 生成 provider payload 时必须按 provider 字段白名单取值，不能把整个 `finalOptions` 原样透传给 provider。

Phase 0A 下真实扣费仍使用旧逻辑，不能因为 `finalOptions` 已经可用就提前切换到动态计价。

## 7. sanitizeGenerationOptions 边界

`sanitizeGenerationOptions()` 本轮只负责生成参数的 key/value 白名单校验，不负责上传资源 URL 的深度安全校验。

本轮必须处理：

1. 未知参数不透传。
2. 非法参数值拒绝或过滤。
3. 用户参数不能覆盖 `enforced`。
4. 参数必须与 scene 匹配。
5. 不允许把不属于当前 scene 的参数传给 provider。

不放进本轮必做：

- URL 域名白名单
- 签名 URL 校验
- HTTPS 限制
- 文件归属校验
- 上传资源大小和 MIME 深度检查

`image_input` / `video_input` 的文件类型、大小、URL 来源、签名、归属等安全问题，应主要放在上传接口和对象存储链路处理。该项作为后续安全加固，不阻塞 Phase 0A。

## 8. Kie adapter 边界

Kie adapter 只负责 provider 字段映射，不再偷偷补业务默认值。

必须清理：

1. 移除 Kie adapter 中和业务规格相关的默认值。
2. 删除隐藏的 `n_frames` 兜底逻辑。
3. Seedance 使用上游 `finalOptions` 中的 `duration`、`aspect_ratio`、`resolution` 等参数。
4. adapter 不负责决定业务默认时长、默认比例、默认清晰度。

允许保留：

- provider 字段名转换
- provider 必需字段映射
- provider 明确要求的格式转换

不允许保留：

- `aspect_ratio: 'landscape'` 这类业务默认值
- `n_frames: '10'` 这类隐藏时长兜底
- adapter 自行决定 `480p / 720p`
- adapter 自行决定默认 `duration`

## 9. image-to-video tab 策略

本阶段不默认开放 `image-to-video`。

规则：

1. 如果当前 scene 下没有 enabled family，前端应隐藏或禁用该 tab。
2. 不要让用户进入空模型状态。
3. `image-to-video` 不应默认开放。
4. 必须等 scene、输入校验、provider capability、计费、模型 registry 全部闭环后再开放。

推荐表述：

> 本阶段不默认开放 image-to-video。如果 registry 中没有 enabled 的 image-to-video family，前端应隐藏或禁用该 tab，避免用户进入无模型可选的空状态。

## 10. Provider fallback 成本一致性

当前阶段 Seedance 主要走 Kie，candidates 不是多个独立成本来源的 provider 轮转，因此 provider 成本一致性不作为 Phase 0A 验收项。

该规则仅作为未来接入多 provider 前的架构约束：

> 如果同一 family 下存在多个不同 provider 且成本结构不同，必须重新校验计费口径与能力边界。

后续如果接入高成本 provider，不能直接塞进低价 family 的 fallback 链路。可选处理方式是拆独立 family，或升级为 `family + scene + provider / route` 计价。

## 11. 分阶段执行方案

### Phase 0A + Phase 0A-post 完成状态总结

> **Phase 0A（含 0A-post）已于 2026-05-19 全部完成并通过验收。**
>
> 以下为各子阶段实际完成结果：
>
> - **0A-1 Registry 结构重整** ✅：`SEEDANCE_CATALOG` + `buildSeedanceModels()` 工厂已就位，`MODELS` 对外导出保持兼容，`validateModels()` 校验通过。Registry 已完成 `skuAttributes` / `defaults` / `controls` / `pricing` / `enforced` 结构预埋。
> - **0A-2 finalOptions 链路** ✅：`sanitizeGenerationOptions()` 和 `resolveFinalOptions()` 已集成到 `/api/ai/generate`，provider 调用、moderation、任务快照统一使用 `finalOptions`。`finalOptions` 链路已接入 image/video candidates 路径。`task.options` 已记录 `finalOptions`。
> - **0A-3 Kie adapter 清理** ✅：移除了 `aspect_ratio: 'landscape'`、`n_frames: '10'`、`size: 'standard'` 等业务默认值和隐藏兜底逻辑。Kie `generateVideo` 已完成默认值清理。
> - **0A-post Seedance catalog disabled 预埋** ✅：Seedance 候选 SKU 已完成 disabled catalog 预埋。依据扣费矩阵共新增 7 条 disabled SKU（含 Standard 全系列和 Fast 720p video-input）。`SeedanceCatalogItem` 类型已扩展支持 `enabled`、`modelValue`、`image-to-video` scene、`1080p` resolution。
>
> 当前真实状态：
>
> - 真实扣费仍走旧 credits 逻辑，Seedance 已上线 SKU 保持 `45 / 90 / 45`。
> - 已验证 480p text-to-video 真实生成成功，扣费 45 credits。
> - `task.options` 已记录 `finalOptions`。
> - `pricing` 仍只是预埋结构，尚未接入真实扣费。
> - 前端 `duration` / `aspect_ratio` 控件尚未开放。
> - `image-to-video` 尚未开放。
>
> 验证通过记录：
>
> - `pnpm.cmd exec tsc --noEmit` — ✅ 零错误
> - `pnpm.cmd run ai:validate-models` — ✅ `AI model registry is valid.`
> - `pnpm.cmd exec eslint` (models.ts / options.ts / route.ts / kie.ts) — ✅ 零警告零错误

### Phase 0A-1：Registry 结构重整 ✅ 已完成

目标：只调整模型注册表结构，不改变真实请求链路、不改变真实扣费。

本阶段只做：

1. 引入轻量 `catalog + factory`。
2. 保持现有 `MODELS` 对外导出兼容。
3. 在模型定义中补充 `skuAttributes`、`defaults`、`controls`、`pricing`、`enforced`。
4. 增强 `validateModels()`，校验 registry 自身一致性。
5. 不接入真实动态计费。
6. 不改变 `/api/ai/generate` 的扣费逻辑。
7. 不改变 provider adapter 的行为。

`validateModels()` 至少校验：

- 每个 enabled model 的 `scenes` 都有 `credits[scene]`。
- `skuAttributes / defaults / controls / pricing / enforced` 的 scene 必须属于 `scenes`。
- `controls` 中 `default` 必须属于 `options`。
- `defaults` 中的值必须通过 `controls` 校验。
- `skuAttributes` 和 `enforced` 不应与用户可控参数产生不可解释冲突。
- 同一 `(mediaType, provider, family, scene, value)` 不重复。

验收标准：

- 现有模型仍能正常被 `findModel()` 找到。
- 现有文生视频、视频转视频功能不受影响。
- `MODELS` 结构对旧调用方保持兼容。
- `validateModels()` 能发现明显配置错误。
- Phase 0A-1 完成后，Seedance 用户可见扣费仍保持现网 `45 / 90 / 45`。

### Phase 0A-2：服务端 finalOptions 链路 ✅ 已完成

目标：统一服务端最终参数解析逻辑，但仍不改变真实扣费。

本阶段只做：

1. 新增或完善 `sanitizeGenerationOptions()`。
2. 新增或完善 `resolveFinalOptions()`。
3. 明确参数合并顺序：`defaults -> sanitized user options -> auto resolved options -> skuAttributes -> enforced`。
4. `/api/ai/generate` 中 provider 调用统一使用 `finalOptions`。
5. moderation、任务创建、落库快照统一使用 `finalOptions`。
6. 任务表中记录最终生成参数，便于后续追踪。
7. 真实扣费仍使用旧逻辑，不启用动态计价。

验收标准：

- 用户传入非法参数时会被拒绝或过滤。
- 未知参数不会透传到 provider。
- `enforced` 参数不能被用户覆盖。
- 任务记录中能看到最终生效参数。
- 真实扣费金额与当前线上保持一致。
- feature flag 未开启时不调用动态计价作为真实扣费来源。

### Phase 0A-3：Kie adapter 清理 ✅ 已完成

目标：让 Kie adapter 只负责 provider 字段映射，不再偷偷补业务默认值。

本阶段只做：

1. 移除 Kie adapter 中和业务规格相关的默认值。
2. 删除隐藏的 `n_frames` 兜底逻辑。
3. Seedance 使用上游 `finalOptions` 中的 `duration`、`aspect_ratio`、`resolution` 等参数。
4. adapter 不负责决定业务默认时长、默认比例、默认清晰度。

验收标准：

- adapter 输入相同 `finalOptions` 时，生成的 provider payload 稳定可预期。
- 旧的 480p / 720p 文生视频仍能正常生成。
- 旧的视频转视频仍能正常生成。
- 没有因为 adapter 清理导致 provider 请求缺字段。

#### Phase 0A-3 执行补充：Kie generateVideo 最小清理

本阶段只清理 `src/extensions/ai/kie.ts` 中的 `generateVideo()`，目标是让 Kie video adapter 只负责 provider 字段映射，不再承担业务默认值决策。

本阶段不改：

- `generateImage()`
- `generateMusic()`
- query / callback 相关逻辑
- `/api/ai/generate`
- `src/config/ai/options.ts`
- `src/config/ai/models.ts`
- 前端控件
- 真实扣费逻辑

具体要求：

1. 删除 `generateVideo()` 初始 payload 中的业务默认值：

```ts
aspect_ratio: 'landscape'
n_frames: '10'
size: 'standard'
```

2. 删除上述默认值后，`payload.input` 应初始化为空对象：

```ts
input: {}
```

3. 删除末尾隐藏时长兜底：

```ts
if (!payload.input.n_frames && !payload.input.duration) {
  payload.input.n_frames = '10';
}
```

4. 删除 duration 映射块中已经无意义的清理语句：

```ts
delete payload.input.n_frames;
delete payload.input.size;
```

5. 保留 provider 字段映射逻辑：

- 保留 `KIE_VIDEO_DURATION_FIELD`
- 保留 `duration -> duration / n_frames` 映射
- 保留 `aspect_ratio` 透传
- 保留 `resolution` 透传
- 保留 `image_input -> image_urls`
- 保留 `video_input -> reference_video_urls`
- 保留 `generate_audio` 透传

6. 保留现有防御式条件赋值：

- 本阶段不把 `if (options.xxx)` 改成直接赋值。
- Phase 0A-3 只删除业务默认值，不重构赋值模式。

7. 当前 Seedance 参数应来自上游 `finalOptions`：

- `duration`
- `aspect_ratio`
- `resolution`
- `generate_audio`

验收标准：

- Kie video adapter 不再偷偷补业务默认参数。
- `generateVideo()` 的 payload 只由输入参数和字段映射产生。
- Seedance 仍走 `duration` 字段。
- 现有 text-to-video / video-to-video 行为不变。
- 不接入动态计费。
- 不混入前端参数开放。
- 不修改 image/music/query/callback 相关逻辑。

验证命令：

```bash
pnpm.cmd exec tsc --noEmit
pnpm.cmd run ai:validate-models
pnpm.cmd exec eslint src/extensions/ai/kie.ts
```

## 12. Phase 0A-post：Seedance catalog disabled 预埋 ✅ 已完成

依据下方 Seedance 2 系列扣费矩阵，将候选 SKU 预注册到 `SEEDANCE_CATALOG`，全部 `enabled: false`，仅做 registry 层配置预埋。不设 `enabled: true`，不接入前端展示，不接入 Kie adapter，不影响真实扣费。

### Seedance 2 系列执行扣费矩阵

| 媒体类型 | 模型 | 规格 | 输入口径 | 场景 | 代码 family key | 时长能力 | KIE 基础价 | 本站积分/秒 | 状态 |
|---|---|---|---|---|---|---|---:|---:|---|
| video | Seedance 2 Fast | 480p | `no-video-input` | `text-to-video` / `image-to-video` | `seedance-2-fast-480p` | `4-15s` | $0.0775/s | 12 | 当前主线 |
| video | Seedance 2 Fast | 480p | `video-input` | `video-to-video` | `seedance-2-fast-480p-video-input` | `4-15s` | $0.045/s | 7 | 当前低成本测试档 |
| video | Seedance 2 Fast | 720p | `no-video-input` | `text-to-video` / `image-to-video` | `seedance-2-fast-720p` | `4-15s` | $0.165/s | 24 | 当前主线 |
| video | Seedance 2 Fast | 720p | `video-input` | `video-to-video` | `seedance-2-fast-720p-video-input` | `4-15s` | $0.100/s | 15 | 候选，不默认公开 |
| video | Seedance 2 Standard | 480p | `no-video-input` | `text-to-video` / `image-to-video` | `seedance-2-standard-480p` | `4-15s` | $0.095/s | 14 | 候选，不默认公开 |
| video | Seedance 2 Standard | 480p | `video-input` | `video-to-video` | `seedance-2-standard-480p-video-input` | `4-15s` | $0.0575/s | 9 | 候选，不默认公开 |
| video | Seedance 2 Standard | 720p | `no-video-input` | `text-to-video` / `image-to-video` | `seedance-2-standard-720p` | `4-15s` | $0.205/s | 30 | 候选，不默认公开 |
| video | Seedance 2 Standard | 720p | `video-input` | `video-to-video` | `seedance-2-standard-720p-video-input` | `4-15s` | $0.125/s | 18 | 候选，不默认公开 |
| video | Seedance 2 Standard | 1080p | `no-video-input` | `text-to-video` / `image-to-video` | `seedance-2-standard-1080p` | `4-15s` | $0.51/s | 75 | 高阶候选 / 白名单 |
| video | Seedance 2 Standard | 1080p | `video-input` | `video-to-video` | `seedance-2-standard-1080p-video-input` | `4-15s` | $0.31/s | 45 | 高阶候选 / 白名单 |

### Phase 0A-post 执行边界

本阶段只做 Seedance 候选 SKU 的 registry 层 disabled 预埋，不开放、不展示、不调用、不计费。

允许修改：

- `src/config/ai/models.ts`

不允许修改：

- `/api/ai/generate`
- `src/config/ai/options.ts`
- `src/extensions/ai/kie.ts`
- 前端控件
- 真实扣费逻辑
- 动态计价开关逻辑

执行约束：

1. 当前已经上线的 3 个 Seedance SKU 保持 `enabled: true`，不得改变现有 `family`、`value`、`credits`、`scenes` 和真实行为。
2. 新增候选 SKU 必须全部 `enabled: false`。
3. 新增候选 SKU 不得被前端展示，不得进入真实生成链路，不得影响当前扣费。
4. 只补充本节矩阵中已经明确列出的 SKU，不猜测额外模型或额外规格。
5. 如果某个 SKU 的 Kie `modelValue` 无法从现有文档或代码中确认，不得编造，应先列为待确认。
6. 可以对 `SeedanceCatalogItem` 做最小类型扩展，例如 `enabled`、`modelValue`、`image-to-video` scene、`1080p` resolution。
7. 不新增复杂 registry framework，继续保持轻量 `SEEDANCE_CATALOG + createSeedanceEntry()`。

验收标准：

- 现有 3 个 Seedance 上线 SKU 行为不变。
- 新增 Seedance SKU 全部 `enabled: false`。
- 真实扣费仍保持旧 credits 逻辑。
- 前端不可见、不可调用新增 SKU。
- 未修改请求链路、Kie adapter、前端控件或动态计费逻辑。
- `pnpm.cmd exec tsc --noEmit` 通过。
- `pnpm.cmd run ai:validate-models` 通过。
- `pnpm.cmd exec eslint src/config/ai/models.ts` 通过。

**Phase 0A-post 验收结果**：

`SEEDANCE_CATALOG` 现包含 10 条 SKU：3 条 `enabled: true`（已上线），7 条 `enabled: false`（候选预埋）。`pricing.creditsPerSecond` 按扣费矩阵设置，但仍不参与真实扣费。

现网实际扣费仍为：

- `seedance-2-fast-480p`：45 credits / 5s 固定
- `seedance-2-fast-720p`：90 credits / 5s 固定
- `seedance-2-fast-480p-video-input`：45 credits / 5s 固定

候选 SKU 全部 disabled，前端不可见、不可调用、不影响当前扣费。

验证通过：

- `pnpm.cmd exec tsc --noEmit` — ✅ 零错误
- `pnpm.cmd run ai:validate-models` — ✅ `AI model registry is valid.`
- `pnpm.cmd exec eslint src/config/ai/models.ts` — ✅ 零警告零错误

## 13. Phase 0B：真实扣费迁移

目标：在 Phase 0A-1 / 0A-2 / 0A-3 全部稳定后，把视频真实扣费从固定 `credits` 口径迁移到 `pricing + finalOptions` 动态口径。

Phase 0B 涉及余额预检、真实扣费、失败退款、任务 `costCredits`、前端价格展示和余额不足提示，属于资金链路，不允许一次性切换。保留分阶段思想，但不再拆成过细的 0B-3a / 0B-3b；执行时只按以下三步推进。

**Phase 0B-1：`calculateModelCredits()` 纯函数 + 测试**

- 只实现计价函数和单元测试。
- 不接入 `/api/ai/generate`。
- 不读取 env。
- 不改变真实扣费。
- 函数必须优先命中 `family + scene + pricing`，并使用 `finalOptions.duration` 计算 `perSecond` 价格。
- 当 `pricing` 缺失或不合法时必须显式报错，不允许静默回落到错误价格。

**Phase 0B-2：feature flag 接入生成链路**

- 接入 `ENABLE_DYNAMIC_VIDEO_PRICING`，默认值必须为 `false`。
- flag 关闭时，视频真实扣费仍走旧 `credits` 口径，现网 `45 / 90 / 45` 保持不变。
- flag 开启时，`/api/ai/generate` 的余额预检、任务 `costCredits` 落库、实际扣费、失败退款必须使用同一个 `calculateModelCredits()` 结果。
- 同一次请求内不得分别计算多次价格后各自使用，避免预检、落库、扣费、退款出现漂移。
- 历史任务不回写旧价格。

`ENABLE_DYNAMIC_VIDEO_PRICING` 是动态视频计费迁移期的安全开关。代码默认值仍应保持 `false`，用于防止未配置环境误切换；但当前站点暂无真实外部用户，且 Phase 0B 生产真实链路已验证通过时，生产环境可以继续保持 `ENABLE_DYNAMIC_VIDEO_PRICING=true`，不必再做复杂灰度和长时间观察。若动态计费出现异常，仍可通过改回 `false` 快速回滚旧扣费逻辑；后续真实用户流量增长后，再评估是否移除旧扣费 fallback 和该 feature flag。

**Phase 0B-3：价格展示对齐 + 生产链路确认**

Phase 0B-3 不再继续拆分子阶段，但执行时必须先完成价格展示口径梳理和对齐。在当前站点暂无外部用户、生产真实链路验证已通过的情况下，可以让生产 `ENABLE_DYNAMIC_VIDEO_PRICING` 继续保持 `true`，不再要求复杂灰度节奏或长时间观察。本阶段仍不得开放 `duration / aspect_ratio` 参数控件、不得开放 `image-to-video`、不得启用 disabled SKU。

Phase 0B-3 当前优先只处理「视频生成页价格展示与后端动态计价对齐」，暂不修改套餐页 pricing 文案、套餐用量示例和对外营销价格锚点。套餐页文案仍应结合产品价格锚点、公告和回滚策略单独处理，避免套餐页展示口径与视频生成页真实扣费口径错位。

同时补充执行范围限制：
- 当前 0B-3 可修改 `models.ts`、`/api/ai/providers`、`video.tsx` 及必要的 service 类型。
- 当前 0B-3 不修改套餐页 pricing 文案。
- 当前 0B-3 不要求再做复杂灰度或长时间观察；生产已开启时可保持 `ENABLE_DYNAMIC_VIDEO_PRICING=true`。
- 当前 0B-3 不开放 `duration / aspect_ratio` 控件。
- 当前 0B-3 不开放 `image-to-video`。
- 当前 0B-3 不启用 disabled SKU。
- 套餐页 pricing 文案留到产品价格锚点确认后单独处理。

- 前端价格展示、余额不足提示与后端动态计费口径对齐。
- 只有确认上线的 SKU 才进入 `SEEDANCE_CATALOG` 并设 `enabled: true`。
- `creditsPerSecond` 必须改为本表「本站积分/秒」列的精确值。
- `Seedance 2 Standard` 和 `1080p` 规格不在 Phase 0B 首批，只作为 candidate 预留。
- 当前无外部用户且生产真实链路已验证时，feature flag 可保持开启；未来有真实用户流量后，产品公告、价格锚点和回滚策略仍需单独确认。

全局红线：

- 不提前开放 `duration / aspect_ratio` 前端控件。
- 不提前开放 `image-to-video`。
- 不启用 disabled SKU。
- 不混入 Phase 1。
- 在明确启用对应 SKU 前，不允许把候选 SKU 接入前端展示、Kie adapter 或真实扣费逻辑。

需要产品和运营确认：

- 480p text-to-video：当前 `45 credits / 5s`，目标可能变为 `60 credits / 5s`。
- 720p text-to-video：当前 `90 credits / 5s`，目标可能变为 `120 credits / 5s`。
- 480p video-to-video：当前 `45 credits / 5s`，目标可能变为 `35 credits / 5s`。
- 是否需要公告、changelog 或灰度策略，由产品决定。
- 是否对老用户短期保留旧价，也由产品决定。

验收标准：

- Phase 0B-1 只新增纯函数和测试，不改变 `/api/ai/generate` 行为。
- Phase 0B-2 在 feature flag 关闭时，真实扣费仍走旧逻辑。
- Phase 0B-2 在 feature flag 开启时，真实扣费、余额预检、失败退款使用同一个动态计价结果。
- Phase 0B-3 前台展示价格与后端真实扣费一致。
- Phase 0B-3 余额不足提示按新口径计算。
- 历史任务保持原 `costCredits`，不回写。

## Phase 1 拆分说明：先后端防线，再前端控件

在当前站点暂无外部用户的情况下，Phase 0B 生产真实链路验证通过后，可直接进入 Phase 1 开发。Phase 1 仍按 Phase 1A / Phase 1B 的逻辑顺序推进，但两阶段可在同一个开发分支连续完成，不需要中间等待很久；commit 最好分开，便于回滚。

推荐执行顺序：

- commit 1：Phase 1A 后端参数职责与测试。
- commit 2：Phase 1B 前端控件与价格联动。

由于 Phase 1 涉及 `duration` 和 `aspect_ratio` 等用户可选参数开放，不能直接从前端 UI 控件开始做，需要先处理服务端参数职责和回滚安全问题。因此 Phase 1 拆分为 Phase 1A 和 Phase 1B 两个逻辑阶段推进。

### Phase 1A：参数职责重构与后端防线

Phase 1A 的目标是先理清 `duration`、`aspect_ratio`、`resolution`、`generate_audio` 等参数的职责边界，保证后端在任何情况下都是最终可信校验层。

当前问题是，`duration` 和 `aspect_ratio` 虽然已经配置在模型注册表的 `defaults` 和 `controls` 中，但同时也存在于 `enforced` 中。由于 `resolveFinalOptions()` 的合并顺序中 `enforced` 优先级最高，用户即使传入新的 `duration` 或 `aspect_ratio`，最终也会被覆盖回默认值。因此，在开放前端控件之前，需要先将这两个参数从强制参数中拆出。

Phase 1A 的调整方向如下：

- `defaults` 负责提供默认值，例如 `duration=5`、`aspect_ratio=16:9`；
- `controls` 负责声明用户可选范围，例如可选时长和画面比例；
- `skuAttributes` 负责 SKU 固有属性，例如 `resolution`；
- `enforced` 只保留服务端强控参数，例如 `generate_audio=false`；
- `pricing` 继续负责动态计费规则。

同时，为了保证回滚安全，需要增加 `allowControlOptions` 这类后端保护逻辑：只有在 `ENABLE_DYNAMIC_VIDEO_PRICING=true` 且当前生成为 video 时，服务端才接受用户传入的 `duration` 和 `aspect_ratio`。当 `ENABLE_DYNAMIC_VIDEO_PRICING=false` 时，即使请求中传入 `duration=10` 或其他可选参数，服务端也应忽略这些参数，并回落到默认的 `duration=5` 和 `aspect_ratio=16:9`，避免出现生成 10 秒但只按旧固定价扣费的资损坑。

Phase 1A 不开放任何前端控件，只完成后端参数职责调整和测试验证。当前可以在同一开发分支里继续推进 Phase 1B，但 Phase 1A 的后端边界和测试应单独提交。

### Phase 1B：前端参数控件开放

Phase 1A 验证通过后，逻辑上再进入 Phase 1B。当前无外部用户时，Phase 1B 可以和 Phase 1A 连续完成，但仍应保持独立 commit。Phase 1B 的目标是在视频生成页面开放 `duration` 和 `aspect_ratio` 控件，并让前端价格随用户选择实时更新。

Phase 1B 的前端控件必须从模型注册表中的 `controls` 读取，不能在组件中硬编码可选项。前端只负责展示和传参，后端仍负责最终校验。

Phase 1B 初期只开放：

- text-to-video 的 `duration` 和 `aspect_ratio`；
- video-to-video 的 `duration` 和 `aspect_ratio`。

暂不开放：

- image-to-video；
- disabled SKU；
- 1080p 或未启用模型；
- pricing plan 文案调整；
- 数据库结构调整。

### Phase 1 验收重点

Phase 1A 验收重点：

- `duration` 和 `aspect_ratio` 不再被 `enforced` 覆盖；
- 新增 `allowControlOptions` 或等价保护逻辑；
- `ENABLE_DYNAMIC_VIDEO_PRICING=true` 时，用户选择的参数可以生效；
- `ENABLE_DYNAMIC_VIDEO_PRICING=false` 时，用户传入的参数会被忽略并回落默认值；
- `resolution` 仍由 SKU 控制，不能被用户请求覆盖；
- 非法 `duration`、非法 `aspect_ratio` 不会透传给 provider；
- image-to-video 和 disabled SKU 仍未开放。

Phase 1B 验收重点：

- 前端控件从 `controls` 读取选项；
- 用户切换 `duration` 后，展示价格同步变化；
- 生成请求携带用户选择的 `duration` 和 `aspect_ratio`；
- 后端落库的 `cost_credits` 与实际扣费一致；
- flag 回滚后仍能恢复旧价格和默认参数。

## 14. Phase 1：前端参数开放

目标：在 Phase 1A 完成参数职责重构与后端防线验证后，开放可由 registry 描述、可由服务端校验、可由动态计价覆盖的参数。当前站点暂无外部用户时，Phase 1A 和 Phase 1B 可以连续完成，但不得跳过后端校验。

可优先开放：

- `aspect_ratio`
- Seedance `duration` 离散选项
- 价格随 `duration` 和 SKU 实时更新

必须满足：

- 前端参数来自 `controls`，不在组件里写死。
- 切换模型或 scene 后，不支持的参数会清理或回落到合法默认值。
- 后端仍是唯一可信源，前端估算不参与实际扣费。
- `duration` 不做自由输入，只从 `controls.duration.options` 渲染。
- `resolution` 仍由 SKU 控制，不能被用户请求覆盖。
- `ENABLE_DYNAMIC_VIDEO_PRICING=false` 时，用户传入的 `duration / aspect_ratio` 必须被忽略并回落默认值。

不在 Phase 1 首批做：

- 完整 VideoFly 工作台 UI
- 历史面板大重构
- 生成结果流
- UGC / showcase / SEO 闭环
- `image-to-video` 默认开放
- music 迁移到公共 hook
- 新增并行 analytics 入口

## 15. 本轮不做清单

为避免范围继续扩张，本轮明确不做：

- 不在 Phase 1 中反复切换或关闭已验证的动态扣费链路；flag=false 必须仍能回滚旧价和默认参数。
- 不默认开放 `image-to-video`。
- 不把 `duration / aspect_ratio` 控件开放、`image-to-video` 上线、disabled SKU 启用混在同一批；Phase 1B 只开放已启用 video SKU 的 `duration / aspect_ratio`。
- 不允许 flag=false 时仍接受 10s 等用户参数并只按旧固定价扣费。
- 不新增完整 VideoFly 工作台、侧边栏、历史面板。
- 不新增第二套 analytics 入口。
- 不把 URL 域名白名单、签名 URL、HTTPS 限制塞进 `sanitizeGenerationOptions()` 的 Phase 0A 必做项。
- 不把 provider 成本一致性作为 Phase 0A 阻塞项。
- 不把 `family` 在本轮改成纯产品模型家族。

## 16. 测试矩阵

| 模块 | 测试内容 |
| --- | --- |
| `validateModels()` | 校验 family、scene、credits、pricing、controls、defaults、skuAttributes 的一致性 |
| `resolveFinalOptions()` | 校验 defaults、用户参数、auto 参数、skuAttributes、enforced 的合并顺序 |
| `sanitizeGenerationOptions()` | 校验未知 key、非法 value、scene 不匹配参数不会透传 |
| `/api/ai/generate` | Phase 0A 下真实扣费保持旧逻辑 |
| `calculateModelCredits()` | Phase 0B-1 只完成纯函数和单元测试，不接入真实扣费 |
| `calculateModelCredits()` | 覆盖固定价、按秒价、`finalOptions.duration`、默认时长、非法 pricing 显式报错 |
| `/api/ai/generate` | Phase 0B-2 feature flag 未开启时不使用动态计价作为真实扣费来源 |
| `/api/ai/generate` | Phase 0B-2 feature flag 开启时余额预检、任务 `costCredits`、实际扣费、失败退款使用同一价格结果 |
| UI pricing | Phase 0B-3 前端价格展示、余额不足提示与后端动态计费口径一致 |
| `resolveFinalOptions()` | Phase 1A 校验 `duration / aspect_ratio` 不再被 `enforced` 覆盖，`resolution` 仍由 `skuAttributes` 控制 |
| `resolveFinalOptions()` | Phase 1A 校验 `ENABLE_DYNAMIC_VIDEO_PRICING=false` 时忽略用户控制参数并回落默认值 |
| video UI controls | Phase 1B 校验控件选项来自 `controls`，价格随 `duration` 和 SKU 实时更新，生成请求携带用户选择参数 |
| Kie adapter | adapter 不再补业务默认值，只做字段映射 |
| UI tabs | `image-to-video` 无 enabled model 时隐藏或禁用 |
| 历史任务 | 开发期旧任务不做专项兼容；不重新计费，必要时手动清理测试数据 |

## 17. 上线闸门

Phase 0A-1 通过，只代表 registry 结构重整完成，不代表服务端参数链路或 adapter 已清理。

Phase 0A-2 通过，只代表 `finalOptions` 链路统一完成，不代表真实扣费已经切换。

Phase 0A-3 通过，只代表 Kie adapter 不再补业务默认值，不代表前端参数已经开放。

Phase 0B-1 通过，只代表 `calculateModelCredits()` 纯函数和测试完成，不代表真实扣费已经切换。

Phase 0B-2 通过，只代表动态计价已接入生成链路且受 `ENABLE_DYNAMIC_VIDEO_PRICING` 控制；flag 关闭时现网旧价格必须保持不变。

Phase 0B-3 通过，才代表前端展示、余额不足提示和真实扣费已经迁移到动态计价口径。当前站点暂无外部用户时，生产 `ENABLE_DYNAMIC_VIDEO_PRICING` 可继续保持 `true`，并可直接进入 Phase 1 开发。

Phase 1 通过，才代表前端参数控件可以正式开放给用户。

任一阶段回归失败，应优先回滚该阶段改动，不能为了赶进度把后续阶段一起上线。

## 18. Phase 2 升级目标：收敛阶段性设计

Phase 0A、Phase 0B 和 Phase 1 的目标是以较小改动跑通模型注册表、动态计费、参数控件、任务落库和积分流水。这些阶段为了降低上线风险，保留了一些阶段性设计，例如带分辨率的 `family`、按单个 SKU 维护 `creditsPerSecond`、隐藏的 `image-to-video` 入口，以及尚未补齐的输入资源 URL 安全校验。

Phase 2 的目标不是继续叠加临时逻辑，而是在现有链路验证通过后，把这些阶段性设计升级为更稳定的 registry、pricing、controls 和兼容策略。Kimi 的简化方向有参考价值，但不宜一刀切删除状态字段和计费口径。Phase 2 应采用 `pricing[scene].byResolution[resolution] + availability` 的结构，降低查价歧义，同时保留 `candidate / whitelist` 的后端防御能力。

当前站点暂无外部访问量和真实用户，因此 Phase 2 不需要按大规模存量系统迁移处理。可以减少复杂灰度、公告、老用户价格保护、批量数据迁移和多层兼容状态机，但仍需要保留几个底线：

- 后端仍是参数和计费的最终校验层。
- 真实扣费必须来自 registry / pricing 的统一结果，不能散落在前端、provider adapter 或临时分支里。
- `cost_credits` 已落库的历史任务不重新计费。
- 输入资源 URL 安全不能完全后置，尤其是公网接口可访问时，必须补齐最低安全边界。

### 18.1 `family` 从带分辨率 SKU 收敛为模型家族

Phase 1 结束时，系统仍使用 `seedance-2-fast-480p`、`seedance-2-fast-720p`、`seedance-2-fast-480p-video-input` 这类带分辨率或输入口径的 `family` / SKU 标识。这个做法有利于早期快速验证不同分辨率的价格和扣费，但长期会让 `family` 同时承担模型家族、分辨率、计费 SKU 和 UI 分组等多重含义。

Phase 2 继续采用“family 收敛 + resolution 参数化”的方向。`family` 表示模型族，例如：

- `seedance-2-fast`
- `seedance-2-standard`

`resolution` 不再通过多个 SKU family 表达，而是作为运行 option 进入 `controls.resolution` / `finalOptions.resolution`。前端从 registry / pricing 渲染当前 scene 可用的 resolution，后端通过 `resolveFinalOptions()`、pricing 和 `validateModels()` 统一校验。

历史任务兼容只做展示兜底：不批量迁移，不重新计费，不强制从旧 `family` 推断 `resolution`。如果旧 task 找不到新的 registry entry，就展示原始 `task.model` / `task.family`，并标记为 `legacy` 或 `unknown`，保证页面不报错即可。历史费用仍以已落库的 `cost_credits` 为准。

### 18.2 pricing 从 matrix 收敛为 `byResolution`

当前代码中 `pricing` 是 `pricing[scene] -> { mode, creditsPerSecond, defaultDuration }`，Seedance catalog 的内部 `inputBilling` 取值是 `no-video-input` / `video-input`。Phase 2 不推荐再扩成 `pricing.matrix + scenes + inputBilling + resolution + status` 的全局多条件匹配结构。

推荐结构是每个 family 下按 scene 查价，再按 resolution 命中叶子节点：

```ts
type VideoPricingAvailability =
  | 'enabled'
  | 'candidate'
  | 'whitelist'
  | 'disabled';

type VideoScene = 'text-to-video' | 'image-to-video' | 'video-to-video';

type VideoInputBilling = 'no-video-input' | 'video-input';

type VideoResolution = '480p' | '720p' | '1080p';

type VideoResolutionPricing = {
  creditsPerSecond: number;
  availability: VideoPricingAvailability;
};

type VideoScenePricing = {
  mode: 'perSecond';
  defaultDuration: number;
  byResolution: Partial<Record<VideoResolution, VideoResolutionPricing>>;
};

type VideoPricing = Partial<Record<VideoScene, VideoScenePricing>>;
```

推荐结构示例：

```ts
pricing: {
  'text-to-video': {
    mode: 'perSecond',
    defaultDuration: 5,
    byResolution: {
      '480p': { creditsPerSecond: 12, availability: 'enabled' },
      '720p': { creditsPerSecond: 24, availability: 'enabled' },
    },
  },
  'image-to-video': {
    mode: 'perSecond',
    defaultDuration: 5,
    byResolution: {
      '480p': { creditsPerSecond: 12, availability: 'candidate' },
      '720p': { creditsPerSecond: 24, availability: 'candidate' },
    },
  },
  'video-to-video': {
    mode: 'perSecond',
    defaultDuration: 5,
    byResolution: {
      '480p': { creditsPerSecond: 7, availability: 'enabled' },
      '720p': { creditsPerSecond: 15, availability: 'candidate' },
    },
  },
}
```

这个结构的重点不是性能，而是让查价路径唯一、类型更清楚、减少非法组合、前后端更容易保持一致，也让 `validateModels()` 更容易校验。运行时查价路径固定为：

```ts
pricing[scene].byResolution[finalOptions.resolution]
```

再用 `finalOptions.duration` 计算 `creditsPerSecond * duration`。如果未来出现时长阶梯价，再在 scene 或 resolution 叶子节点下扩展，不要在当前没有需求时提前做全局价格引擎。

### 18.3 `inputBilling` 由 scene 派生，不作为查价维度

`inputBilling` 不彻底删除，但不再作为用户输入、前端控件或 pricing 独立匹配维度。它是内部计费口径，可由 scene 派生：

```ts
const INPUT_BILLING_BY_SCENE = {
  'text-to-video': 'no-video-input',
  'image-to-video': 'no-video-input',
  'video-to-video': 'video-input',
} as const;
```

当前项目真实枚举是 `no-video-input` / `video-input`，不要在 registry 或 Phase 2 文档里引入其他输入口径命名。`inputBilling` 可以继续用于 `skuAttributes`、成本口径校验或 provider 成本对照，但不应和 `scene` 重复配置后再参与运行时查价。运行时扣费只依赖 `scene + resolution + duration`，其中 `scene` 已经足够派生内部输入口径。

### 18.4 用 `availability` 表达 scene + resolution 可用性

原 matrix entry 上的 `status` 不再保留。`availability` 放在 `scene + resolution` 的叶子节点上，表达该 family 在某个场景和清晰度下是否对普通用户开放。

需要区分两个层级：

- `ModelEntry.enabled` 表示这个模型 / family 是否参与 registry 和候选选择。
- `availability` 表示某个 `scene + resolution` 是否对用户开放。
- 两者不是同一层概念，不能互相替代。

普通用户只能使用 `availability = 'enabled'` 的组合。`candidate / whitelist / disabled` 可以留在 registry 中作为候选、灰度或内部规划，但后端必须拒绝普通用户请求，不能只依赖前端隐藏。

如果某个 scene 暂不开放，前端入口要隐藏或禁用，后端也要拒绝普通用户访问。不要把 `image-to-video` tab 是否显示只交给 `availability` 隐式决定；入口策略和后端权限都要明确。

### 18.5 resolution controls 与 pricing 保持一致

`controls.resolution` 可以表达模型家族支持的 resolution，但普通用户实际可见的 resolution options 应来自当前 scene 下 `availability = 'enabled'` 的 pricing，或者由 `validateModels()` 强制校验 `controls` 与 pricing 一致。

约束如下：

- 普通用户默认 `resolution` 必须是 `enabled`，不能是 `candidate / whitelist / disabled`。
- 切换 scene 后，如果当前 `resolution` 在新 scene 下不合法，应回落到该 scene 的合法默认值。
- 前端展示、余额预估、生成请求、后端扣费和 provider payload 必须使用同一份 `finalOptions`。
- 不得仅按 `controls.resolution` 展示或放行，也不得让前端维护一套独立 resolution 白名单。

### 18.6 `image-to-video` 纳入设计，但不急于开放入口

Phase 1 为了降低范围，`image-to-video` 入口仍保持隐藏。从定价口径看，`image-to-video` 属于 `no-video-input`，Fast 480p 和 Fast 720p 的单价应与同 family、同 resolution 的 `text-to-video` 保持一致。

Phase 2 需要把 `image-to-video` 纳入 registry、pricing 和 controls 的设计中，避免后续开放入口时再补结构。当前没有访问量时，不必把正式开放入口作为 Phase 2 第一批硬目标。入口开放不能简化成一行 tab 开关，必须等 adapter 字段映射、输入资源 URL 安全和真实生成测试闭环后再开放。

### 18.7 `validateModels()` 补充规则

Phase 2 的 `validateModels()` 不只校验 schema，还要校验开放组合和计费口径：

- 对普通用户开放的 `family + scene`，至少要有一个 `availability = 'enabled'` 的 resolution。
- 如果某个 scene 暂不开放，前端入口要隐藏，后端也要拒绝普通用户访问。
- 同一 `family + resolution + no-video-input` 成本口径下，`text-to-video` 与 `image-to-video` 的单价应一致。
- 如果新 pricing 结构不再存 `inputBilling`，不要校验“pricing 里的 inputBilling”；应校验 `skuAttributes` 或 scene 派生出的 `inputBilling` 与成本口径一致。
- `controls.resolution.default` 必须指向当前 scene 下 `availability = 'enabled'` 的 resolution。
- `controls.resolution.options` 不得包含 pricing 中完全不存在的 resolution；如果保留 `candidate / whitelist` 选项，普通用户过滤逻辑必须由后端测试覆盖。

`calculateModelCredits()` 只使用 `resolveFinalOptions()` 归一化后的 `scene + resolution + duration`，不从用户原始输入直接计费。provider payload 与 `costCredits` 必须使用同一份 `finalOptions`，避免展示、扣费和实际调用不一致。

### 18.8 输入资源 URL 安全作为 Phase 2B 验收项

URL 安全不要从 Phase 2B 移除，可以从 registry / pricing 重构中拆成独立 commit，但仍应作为 Phase 2B 验收项。当前 `options.ts` 只做参数白名单和 `image_input` / `video_input` 的数组字符串校验，不足以覆盖资源 URL 风险。

第一版建议优先只允许 HTTPS，并覆盖 `image_input` / `video_input`。最低安全边界包括：

- 只允许 HTTPS URL。
- 禁止 localhost、127.0.0.1、`::1`、内网 IP、link-local 和云厂商 metadata IP。
- 处理 DNS 解析、重定向绕过和最终落点校验。
- 不信任前端传入的文件扩展名。
- 限制允许的 MIME 类型。
- 限制资源大小。
- 设置探测或下载超时。
- provider 拉取失败时返回明确错误。

当前阶段可以先做最低版，不需要一次性完成复杂上传治理、文件归属校验、签名 URL 全链路审计和异步安全扫描。但只要开放用户可传入图片或视频 URL，就不能跳过 SSRF、资源大小、MIME 和超时风险。

URL 安全逻辑不要直接塞进 `options.ts`。`options.ts` 仍主要负责生成参数清洗和 controls 校验；HTTPS、内网地址、metadata 地址、MIME、大小和超时等资源安全检查应放在独立模块中，例如 `asset-url-security.ts`，再由生成入口或上传链路调用。

### 18.9 Provider 成本一致性先写原则，不做复杂实现

当前主要依赖 Kie provider，多 provider 成本一致性还不是主要矛盾。Phase 2 只需要明确原则：

> 平台价格属于平台 registry，不属于底层 provider。

不同 provider 的物理模型、字段格式和参数差异应由 adapter 吸收。对用户展示、任务落库和积分扣费的价格，应统一由 registry 中的价格口径决定，避免未来接入新 provider 后出现同一平台规格在不同渠道下扣费不一致。

当前没有多 provider 真实流量时，不需要做复杂的 `provider pricing`、跨 provider fallback 成本路由或自动利润计算。后续接入新 provider 前，再根据真实能力和成本决定是否拆 family、拆 route，或增加 provider 维度。

### 18.10 pricing 页文案与动态计费事实对齐

视频生成页已经支持按模型、清晰度和时长动态展示预计积分。如果套餐页或 pricing 页仍使用固定按次表述，容易造成误解。

Phase 2 不需要在套餐页堆满所有细分价格，但应避免继续使用会让用户误解为固定按次扣费的描述。推荐补充文案：

> 积分可用于图片、视频等多种 AI 生成能力。视频生成会根据模型、清晰度、输入类型和时长动态扣费。生成前页面会展示预计消耗积分，实际扣费以任务记录为准。

这部分不需要和 registry 重构绑在同一个 commit 中，但应作为 Phase 2 的收尾对齐项，并同步检查中英文 i18n 文案。

### 18.11 Phase 2 建议执行顺序

Phase 2 按 5 个可回滚 commit 拆分，避免把 registry、计费、前端控件、URL 安全和产品文案混在同一批。

Commit 1：Registry family 收敛 + pricing byResolution + availability

- `family` 收敛为 `seedance-2-fast / seedance-2-standard`。
- `resolution` 进入 `controls.resolution` / `finalOptions.resolution`。
- pricing 改为 `pricing[scene].byResolution[resolution]`。
- availability 放在 resolution 叶子节点。
- `validateModels()` 更新，校验 family、controls、pricing、availability、scene 和成本口径一致性。

Commit 2：后端 `resolveFinalOptions` / `calculateModelCredits` 适配 `resolution`

- `resolveFinalOptions()` 支持 `resolution` controls。
- `calculateModelCredits()` 按归一化后的 `scene + resolution + duration` 计算总价。
- `inputBilling` 由 scene 派生，仅用于内部成本口径校验。
- 当 `ENABLE_DYNAMIC_VIDEO_PRICING=false`，或 `resolution` 控制参数尚未开放时，服务端必须忽略用户传入的 `resolution`，并回落到默认规格或旧 enabled SKU 对应参数，避免用户传入高规格参数后仍按旧固定价扣费。
- 非法 `resolution`、pricing 缺失、`candidate / whitelist / disabled` 防误用逻辑落地。
- 确保 provider payload 与 `costCredits` 使用同一份 `finalOptions`。

Commit 3：前端 video 生成表单增加 `resolution` 控件

- 普通用户 resolution options 来自当前 scene 下 `availability = 'enabled'` 的 pricing。
- 默认 resolution 必须是 enabled。
- 切换 scene 后，当前 resolution 不合法时回落到合法默认值。
- 价格随 `resolution + duration` 更新，生成请求携带 `resolution`。
- `image-to-video` 仍保持入口受控，不在本 commit 中正式开放。

Commit 4：URL 安全模块，覆盖 `image_input` / `video_input`

- 新增独立资源 URL 安全模块，例如 `asset-url-security.ts`。
- 第一版优先只允许 HTTPS URL。
- 覆盖 SSRF、localhost、127.0.0.1、内网 IP、metadata IP、重定向绕过、文件大小、MIME 和下载超时。
- 生成入口或上传链路调用该模块，不能只做前端校验。

Commit 5：pricing 页面和 i18n 文案对齐

- 套餐页说明视频生成是动态扣费。
- 避免继续使用固定按次扣费的误导表述。
- 同步更新中英文 i18n 文案。
- 保持简化展示，不在套餐页堆满所有细分价格表。

Phase 2 的最后判断标准：

- 新视频规格不再依赖带分辨率的 `family` 命名才能计费。
- 前端展示、后端校验、任务落库和扣费使用同一套 registry / pricing / finalOptions 结果。
- 历史任务不批量迁移、不重新计费，找不到 registry 时展示原始 `task.model` / `task.family` 并标记 `legacy` 或 `unknown`。
- `image-to-video` 的价格和参数结构已经补齐，即使入口暂不开放。
- 输入资源 URL 安全作为 Phase 2B 验收项，至少覆盖 HTTPS、内网地址、metadata 地址、重定向、MIME、大小和超时校验。
- pricing 页和 i18n 文案不再暗示视频生成是固定按次扣费。

Phase 2 还应补充以下可测项：

- `seedance-2-fast` / `seedance-2-standard` family 合并后 registry 校验通过。
- `pricing[scene].byResolution[resolution]` 能唯一命中价格。
- `availability = 'enabled'` 是普通用户唯一可用状态。
- `candidate / whitelist / disabled` 存在时，普通用户请求被后端拒绝。
- `no-video-input` 由 `text-to-video / image-to-video` 派生，`video-input` 由 `video-to-video` 派生。
- 同一 family + resolution + `no-video-input` 下，`text-to-video` 与 `image-to-video` 单价一致。
- Fast 480p / 720p 的 `text-to-video` 价格分别为 12、24 credits/s。
- Fast 480p `video-to-video` 价格为 7 credits/s。
- 非法 `resolution` 被拒绝。
- pricing 不存在的 `resolution` 被拒绝。
- provider payload 使用的 `finalOptions` 与 `costCredits` 计算使用的是同一份 `finalOptions`。
