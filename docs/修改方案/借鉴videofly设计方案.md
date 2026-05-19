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

### Phase 0A-1：Registry 结构重整

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

### Phase 0A-2：服务端 finalOptions 链路

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

### Phase 0A-3：Kie adapter 清理

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

## 12. Phase 0B：真实扣费迁移

目标：在 Phase 0A-1 / 0A-2 / 0A-3 全部稳定后，把视频真实扣费从固定 `credits` 口径迁移到 `pricing + finalOptions` 动态口径。

### Seedance 2 系列 Phase 0B 执行扣费矩阵

| 媒体类型 | 模型 | 规格 | 输入口径 | 场景 | 代码 family key | 时长能力 | KIE 基础价 | 本站积分/秒 | 状态 |
|---|---|---|---|---|---|---|---:|---:|---|
| video | Seedance 2 Fast | 480p | no video input | `text-to-video` / `image-to-video` | `seedance-2-fast-480p` | `4-15s` | $0.0775/s | 12 | 当前主线 |
| video | Seedance 2 Fast | 480p | with video input | `video-to-video` | `seedance-2-fast-480p-video-input` | `4-15s` | $0.045/s | 7 | 当前低成本测试档 |
| video | Seedance 2 Fast | 720p | no video input | `text-to-video` / `image-to-video` | `seedance-2-fast-720p` | `4-15s` | $0.165/s | 24 | 当前主线 |
| video | Seedance 2 Fast | 720p | with video input | `video-to-video` | `seedance-2-fast-720p-video-input` | `4-15s` | $0.100/s | 15 | 候选，不默认公开 |
| video | Seedance 2 Standard | 480p | no video input | `text-to-video` / `image-to-video` | `seedance-2-standard-480p` | `4-15s` | $0.095/s | 14 | 候选，不默认公开 |
| video | Seedance 2 Standard | 480p | with video input | `video-to-video` | `seedance-2-standard-480p-video-input` | `4-15s` | $0.0575/s | 9 | 候选，不默认公开 |
| video | Seedance 2 Standard | 720p | no video input | `text-to-video` / `image-to-video` | `seedance-2-standard-720p` | `4-15s` | $0.205/s | 30 | 候选，不默认公开 |
| video | Seedance 2 Standard | 720p | with video input | `video-to-video` | `seedance-2-standard-720p-video-input` | `4-15s` | $0.125/s | 18 | 候选，不默认公开 |
| video | Seedance 2 Standard | 1080p | no video input | `text-to-video` / `image-to-video` | `seedance-2-standard-1080p` | `4-15s` | $0.51/s | 75 | 高阶候选 / 白名单 |
| video | Seedance 2 Standard | 1080p | with video input | `video-to-video` | `seedance-2-standard-1080p-video-input` | `4-15s` | $0.31/s | 45 | 高阶候选 / 白名单 |

**Phase 0A-1 当前状态**：

`SEEDANCE_CATALOG` 只注册了 3 条已启用 SKU，`pricing.creditsPerSecond` 是按 `credits ÷ defaultDuration` 镜像的旧固定值，不代表真实按秒扣费。

现网实际扣费仍为：

- `seedance-2-fast-480p`：45 credits / 5s 固定
- `seedance-2-fast-720p`：90 credits / 5s 固定
- `seedance-2-fast-480p-video-input`：45 credits / 5s 固定

**Phase 0B 迁移规则**：

1. 只有确认上线的 SKU 才进入 `SEEDANCE_CATALOG` 并设 `enabled: true`。
2. `creditsPerSecond` 必须改为本表「本站积分/秒」列的精确值。
3. `calculateModelCredits()` 必须优先命中 `family + scene + creditsPerSecond`。
4. `Seedance 2 Standard` 和 `1080p` 规格不在 Phase 0B 首批，只作为 candidate 预留。
5. 前台套餐页只展示稳定锚点，例如 `Fast Video from 12 Credits/s`。
6. Phase 0B 之前，不允许把本表候选 SKU 提前接入前端展示、Kie adapter 或真实扣费逻辑。

前置条件：

- `ENABLE_DYNAMIC_VIDEO_PRICING=true`。
- 前台价格展示已同步。
- 余额不足提示已同步。
- `/api/ai/generate` 的余额预检、任务 `costCredits` 落库、实际扣费、失败退款全部使用同一个 `calculateModelCredits()` 结果。
- 历史任务不回写旧价格。

需要产品和运营确认：

- 480p text-to-video：当前 `45 credits / 5s`，目标可能变为 `60 credits / 5s`。
- 720p text-to-video：当前 `90 credits / 5s`，目标可能变为 `120 credits / 5s`。
- 480p video-to-video：当前 `45 credits / 5s`，目标可能变为 `35 credits / 5s`。
- 是否需要公告、changelog 或灰度策略，由产品决定。
- 是否对老用户短期保留旧价，也由产品决定。

验收标准：

- feature flag 关闭时，真实扣费仍走旧逻辑。
- feature flag 开启时，真实扣费、余额预检、失败退款使用同一个动态计价结果。
- 前台展示价格与后端真实扣费一致。
- 余额不足提示按新口径计算。
- 历史任务保持原 `costCredits`，不回写。

## 13. Phase 1：前端参数开放

目标：只在 Phase 0B 稳定后，开放可由 registry 描述、可由服务端校验、可由动态计价覆盖的参数。

可优先开放：

- `aspect_ratio`
- Seedance `duration` 离散选项
- Seedance `480p / 720p` 产品规格聚合展示

必须满足：

- 前端参数来自 `controls`，不在组件里写死。
- 切换模型或 scene 后，不支持的参数会清理或回落到合法默认值。
- 后端仍是唯一可信源，前端估算不参与实际扣费。
- `duration` 不做自由输入，只从 `controls.duration.options` 渲染。

不在 Phase 1 首批做：

- 完整 VideoFly 工作台 UI
- 历史面板大重构
- 生成结果流
- UGC / showcase / SEO 闭环
- `image-to-video` 默认开放
- music 迁移到公共 hook
- 新增并行 analytics 入口

## 14. 本轮不做清单

为避免范围继续扩张，本轮明确不做：

- 不切换真实动态扣费，除非进入 Phase 0B 且打开 `ENABLE_DYNAMIC_VIDEO_PRICING`。
- 不默认开放 `image-to-video`。
- 不把 `duration` 前端开放、真实扣费迁移、`image-to-video` 上线放进同一批。
- 不新增完整 VideoFly 工作台、侧边栏、历史面板。
- 不新增第二套 analytics 入口。
- 不把 URL 域名白名单、签名 URL、HTTPS 限制塞进 `sanitizeGenerationOptions()` 的 Phase 0A 必做项。
- 不把 provider 成本一致性作为 Phase 0A 阻塞项。
- 不把 `family` 在本轮改成纯产品模型家族。

## 15. 测试矩阵

| 模块 | 测试内容 |
| --- | --- |
| `validateModels()` | 校验 family、scene、credits、pricing、controls、defaults、skuAttributes 的一致性 |
| `resolveFinalOptions()` | 校验 defaults、用户参数、auto 参数、skuAttributes、enforced 的合并顺序 |
| `sanitizeGenerationOptions()` | 校验未知 key、非法 value、scene 不匹配参数不会透传 |
| `/api/ai/generate` | Phase 0A 下真实扣费保持旧逻辑 |
| `/api/ai/generate` | feature flag 未开启时不使用动态计价作为真实扣费来源 |
| `calculateModelCredits()` | 只完成函数骨架和单元测试，不接入真实扣费 |
| Kie adapter | adapter 不再补业务默认值，只做字段映射 |
| UI tabs | `image-to-video` 无 enabled model 时隐藏或禁用 |
| 历史任务 | 老任务 options 缺少新字段时不报错 |

## 16. 上线闸门

Phase 0A-1 通过，只代表 registry 结构重整完成，不代表服务端参数链路或 adapter 已清理。

Phase 0A-2 通过，只代表 `finalOptions` 链路统一完成，不代表真实扣费已经切换。

Phase 0A-3 通过，只代表 Kie adapter 不再补业务默认值，不代表前端参数已经开放。

Phase 0B 通过，才代表真实扣费已迁移到动态计价口径，并且必须受 `ENABLE_DYNAMIC_VIDEO_PRICING` 控制。

Phase 1 通过，才代表前端参数控件可以正式开放给用户。

任一阶段回归失败，应优先回滚该阶段改动，不能为了赶进度把后续阶段一起上线。
