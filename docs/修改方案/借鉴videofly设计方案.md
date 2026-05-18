# 借鉴 VideoFly 的首页生成器与参数架构改造方案

> 参考对象：`https://videofly.app/`、`https://videofly.app/text-to-video`
> 阶段参考：`https://bananaproai.com/`、`https://gptimg2.art/`
> 本地参考代码：`D:\project3\shipany-2\videofly-template-main`
> 当前项目：`D:\project3\shipany-2\bananapro-org`


## 一句话结论

VideoFly 可以借鉴，但重点不是“换皮式工作台重构”，而是把生成器做成一个语义清晰、可定价、可演进的产品系统。本文后续统一用 `Phase 0/1` 指代本轮交付窗口：它不应只做保守补丁，而应先把优雅架构的骨架落地：保留 `MODELS` 作为兼容运行时结构，但把源配置收敛成轻量 `catalog + factory`；同时落实 `Product / SKU / SKU Attributes / Runtime Params / Pricing / Enforced Policy` 分层、`skuAttributes` 与 `enforced` 分离、`enforced` 与默认值分离、服务端白名单校验、服务端按最终参数/SKU 扣费、Kie 适配器不再偷偷补默认值。

首页 `Image / Video` 双入口、VideoFly 风格输入框、工具页侧边栏、历史面板、公共轮询 hook、music 迁移、埋点事件、UGC/SEO 闭环不应混进 `Phase 0/1`。但这不等于 `Phase 0/1` 只能做低水平修补：它必须为后续优雅 UI 留出真实可消费的数据结构，而不是把未来体验继续绑死在 `family` 字符串和散落默认值上。

当前最小收益最大的一版做六件事：

1. 建立轻量 `catalog + factory -> MODELS` 的编译层，外部继续导出兼容的 `MODELS`，但不再手写大段重复 `ModelEntry`。
2. 引入 `skuAttributes`，把 `resolution`、`inputBilling` 这类 SKU 固有规格从 `enforced` 拆出来。
3. `defaults -> sanitizedOptions -> resolved auto -> skuAttributes -> enforced` 合并顺序落地。
4. 后端拒绝未声明参数，把最终参数写入任务快照，并在 Phase 0 实现 `calculateModelCredits()` 的 `pricing -> credits -> scene fallback` 双路径骨架。
5. Kie provider adapter 清理硬编码默认值。
6. 前端只开放已有明确成本和 provider 支持的参数，但 UI 呈现应按“产品 + 规格 + 参数”组织，而不是继续把所有语义塞进一个模型下拉框。

## 本稿定位与边界

这份文档现在只承担三个职责，不再试图一次性覆盖所有修改讨论：

1. 定义 Phase 0/1 的工程改造边界：先修参数契约、扣费链路和 provider 适配器，再谈 UI 升级。
2. 统一“模型 / 规格 / 运行时参数 / 价格”的命名口径，避免继续把它们混成一个字段。
3. 给后续首页双入口和 VideoFly 风格 UI 提供前提条件，而不是直接替代设计稿或定价稿。

不属于本稿直接拍板的内容：

- 不直接改 `docs/定价/3.本项目定价方案.md` 已执行的公开积分档位。
- 不在这里提前宣布新的图片 family、视频时长价格或套餐价格。
- 不把示例代码中的演进方向，误当成当前线上实现或立即执行值。

如果本稿与其他文档出现口径冲突，优先级应为：

1. 当前源码事实
2. `docs/定价/3.本项目定价方案.md` 的执行口径
3. `docs/定价/2.四平台对比成本价格.md` 的成本拆分口径
4. 本稿里的中期结构建议

## 设计哲学修正

这里的“分阶段”是工程交付策略，不是设计降级策略。真正应该避免的是无边界重构，而不是避免优雅抽象。

`Phase 0/1` 的目标应当是：外部行为尽量稳定，内部模型明显变好。也就是不急着上线完整工作台，但要把生成器的领域语言从一开始立正：产品模型、售卖规格、运行时参数、计价规则、硬限制各有归属。

判断一个改动是否该进入 Phase 0/1，可以用下面三条标准：

1. 如果它能减少重复配置、消除错误扣费或让 UI 直接消费 registry，它是基础设施，不是过度设计。
2. 如果它只是新增页面壳、历史面板、埋点故事或 SEO 闭环，但不修正参数与计费事实，它应后移。
3. 如果它只是新增漂亮字段但没有任何编译器、后端或 UI 消费，它不是优雅设计，只是配置噪音。

## 当前源码事实

### 1. `family` 当前是计费 SKU，不只是产品模型名

`src/config/ai/models.ts` 顶部注释已经明确：`family` 是 billing SKU。当前 `seedance-2-fast-480p`、`seedance-2-fast-720p` 是两个计费档位，不只是 UI 标签差异。

因此，`Phase 0/1` 不要把 `seedance-2-fast-480p` 和 `seedance-2-fast-720p` 强行合并成一个 `seedance-2-fast` family。长期看“同一产品模型 + 分辨率参数计费”更干净，但这会影响：

- `findModel(mediaType, provider, family, scene, model)`
- `validateModels()` 的“同 family 同 scene 价格一致”约束
- `credit-costs.ts` 的 family 价格派生
- 前端 `dedupeModelFamilies()`
- 历史任务里 family/SKU 的解释

稳健做法：`Phase 0/1` 继续保留 `family` 的计费 SKU 语义，但不要让 `family` 继续承担产品名、规格名和 UI 分组的全部职责。应由轻量 `catalog + factory` 生成分组信息，把 `480p/720p` 展示成同一个 `Seedance 2.0 Fast` 产品下的规格控件；服务端仍用真实 SKU family 校验和扣费。这样不是提前改计费边界，而是用更优雅的领域模型包住旧接口。

### 2. `enforced` 的双重职责必须修

当前视频 entry 的 `enforced` 同时包含：

- `resolution`
- `duration`
- `aspect_ratio`
- `generate_audio`

其中 `resolution` 更像所选 SKU 的固有规格，应该进入 `skuAttributes`；`duration`、`aspect_ratio` 更像默认业务参数或可选参数，应该进入 `defaults / controls`；`generate_audio: false` 才更像硬限制或产品限制，应该继续放在 `enforced`。Phase 0 就应把这三类语义拆开，否则后续前端做分辨率规格控件时，仍会被 `enforced` 这层“强制覆盖”语义绑住。

`src/app/api/ai/generate/route.ts` 当前使用：

```ts
const finalOptions = { ...(options ?? {}), ...enforced };
```

这会让服务端强制参数覆盖前端输入。只改 UI 不改这里，参数选择不会真正生效。

### 3. Kie 适配器仍有硬编码默认值

`src/extensions/ai/kie.ts` 的 `generateVideo()` 当前写死了：

```ts
input: {
  aspect_ratio: 'landscape',
  n_frames: '10',
  size: 'standard',
}
```

而本地 Kie Seedance 文档中参数是 `aspect_ratio: "16:9"`、`resolution: "720p"`、`duration`。默认值应该由 registry/API route 统一解析，provider adapter 只负责字段映射和透传，不要再悄悄补业务默认。

### 4. `image-to-video` UI 已有入口，定价文档已补但代码 registry 仍未接入

`src/shared/blocks/generator/video.tsx` 已经有 `text-to-video / image-to-video / video-to-video` 三个 tab，但当前 `src/config/ai/models.ts` 里的视频 `MODELS` 只覆盖：

- `text-to-video`
- `video-to-video`

`docs/定价/3.本项目定价方案.md` 已经把 Seedance 2 的执行扣费口径补成完整矩阵：`text-to-video / image-to-video` 归入 `no video input`，`video-to-video` 归入 `with video input`，并按 `resolution + input type + duration` 拆每秒积分。也就是说，现在不是“文档里没有 image-to-video 价格”，而是“代码还没具备把这些价格安全接入 registry 和扣费链路的架构”。

当前代码侧还存在三个硬事实：

- `models.ts` 里的 Seedance 视频项没有声明 `image-to-video` scene，也没有对应 `credits` / `enforced`。
- `credit-costs.ts` 里虽然有 `video / image-to-video: 60` 的 scene fallback，但这只是兜底价格，不是可上线的 Seedance SKU 定价。
- `/api/ai/generate` 仍按 `entry.credits[scene]` 取固定积分，并在之后才合并 `enforced`，还没有按最终 `SKU + duration + resolution + input type` 动态计价。

这会影响方案边界判断：

- Phase 0/1 可以先修好通用参数链路。
- 但不要因为文档价格已补齐，就直接把 `image-to-video` 写进 `MODELS` 上线。
- 如果要启用 `image-to-video`，必须先补 `scene + family/SKU + creditsPerSecond/pricing + provider capability + image input 校验 + 服务端最终参数扣费` 的完整闭环。
- 在轻量 `catalog + factory -> MODELS`、`skuAttributes / defaults / controls / pricing / enforced`、服务端最终参数计价这些结构落地前，`image-to-video` 的价格应继续只停留在定价文档，不进入代码注册表。

### 5. 视频轮询容错弱于图片

`image.tsx` 已有 `queryFailCountRef`，轮询失败会重试几次；`video.tsx` 轮询失败后直接 `resetTaskState()`。这个问题可以低风险修，但不需要为了它立刻抽一个大公共 hook。

### 6. 项目已有 analytics service

项目已有 `src/shared/services/analytics.ts` 和 `src/extensions/analytics/*`。不要再新增一套 `src/shared/lib/analytics.ts` 并行入口。`Phase 0/1` 不铺埋点；未来要做事件追踪时，应扩展现有 analytics service。

### 7. `ai_task.options` 不需要数据库 migration

`ai_task.options` 是 text/longtext，存 JSON string。新增 `resolution`、`aspect_ratio` 等字段不需要 schema migration。只需保证读取旧任务时缺字段兼容。

## 改造原则

1. 保留当前模型候选链路：用户不选择 provider，provider 仍作为后台候选链路。
2. `Phase 0/1` 保留 `family` 的 billing SKU 语义，不改成纯产品模型家族。
3. `Phase 0/1` 就引入 `Product / SKU / SKU Attributes / Scene Controls / Scene Pricing` 的内部语义边界，但实现上优先采用轻量 `catalog + factory`，避免继续手写重复 `ModelEntry`，也避免过早建复杂 `PRODUCTS / SKUS` 多表映射。
4. `skuAttributes` 表达 SKU 固有规格，例如 `resolution`、`inputBilling`；`enforced` 只保留不可被用户覆盖的硬限制；默认值进入 `defaults`，可展示选项进入 `controls`。
5. 服务端是唯一可信源：参数校验、`auto` 解析、扣费、任务快照都在服务端完成。
6. 前端展示的积分只是估算，不能参与实际扣费。
7. 没有明确每秒价格规则的参数不要开放；但 Seedance 这类已经有 `creditsPerSecond` 和 `4-15s` 能力范围的模型，`duration` 不应只做少数固定档位，而应由 registry 声明 `4s` 到 `15s` 的完整可选秒数。
8. 可以做小而精的参数信息架构，`Phase 0/1` 不做完整 VideoFly 工作台、侧边栏、历史面板。
9. 不把 image/video/music 强行合并成一个万能生成器。
10. 不新增重复 analytics 入口。
11. 客户端生成结果不等于 SEO 内容；只有发布、审核、服务端可访问的结果才可能成为可索引资产。

## 可吸收的评审意见

评审里可吸收的内容已尽量并入下文对应章节，这里不再重复展开表格。当前稿子的阶段性结论保持不变：

- `Phase 0/1` 优先修参数链路与数据结构，包括轻量 `catalog / factory` 源配置、`skuAttributes / credits / defaults / controls / pricing / enforced` 职责拆分、`calculateModelCredits()` 的 `pricing -> credits -> scene fallback` 骨架、`sanitizeGenerationOptions()` 严格类型、`kie.ts` 默认值清理、`aspect_ratio` 与 `auto` 的统一解析。
- 前端能力按每秒价格规则和允许列表开放；没有明确计费口径的 `duration` 不开放，但 Seedance 已明确 `4-15s` 时应完整渲染 `4s / 5s / 6s / 7s / 8s / 9s / 10s / 11s / 12s / 13s / 14s / 15s`，不能只给几个固定推荐项。分辨率和宽高比这类已有成本口径的选项也应尽量从 registry 渲染，避免继续写死在组件里。视频轮询只先补失败重试，不提前抽公共 hook。
- `music` 迁移、服务端估价 API debounce、首页 shell SEO 扩展、数据库 migration 等都不作为 `Phase 0/1` 阻塞项，相关边界已在“Phase 0/1 不做清单”和后文各节体现。

## 综合建议清单：模型、规格、价格、页面四层拆分

后续改造应统一按四层理解，不要再把“真实模型名、产品名、规格、用户参数”混在同一个字段里。

### 1. 四层命名边界

| 层级 | 含义 | 示例 | 是否给用户直接看 |
| --- | --- | --- | --- |
| Provider Model | 供应商真实模型 ID | `bytedance/seedance-2-fast` | 否 |
| Product | 产品模型名称 | `Seedance 2 Fast`、`Nano Banana Pro` | 是 |
| SKU / Spec | 我们售卖和计费的规格档位 | `480p`、`720p`、`1K`、`2K`、`4K`、`with-video` | 是 |
| Runtime Params | 单次生成参数 | `duration`、`aspect_ratio`、`generate_audio` | 视成本和能力开放 |

结论：

- `seedance-2-fast` 才是产品/模型名称。
- `480p / 720p` 是规格，不是模型名。
- `4s` 到 `15s` 这类时长选择是运行时参数，不应编码进模型名。
- `family` 在 `Phase 0/1` 继续作为内部 SKU key，而不是纯模型家族名。
- UI 可以显示成“模型：Seedance 2 Fast；规格：480p；时长：5s”，但请求后端仍传稳定 `family` 或由前端映射到稳定 `family`。

### 2. `MODELS` 继续导出，但源码改成轻量 `catalog + factory`

当前外部代码依赖 `MODELS: ModelEntry[]`、`findModel()`、`validateModels()`，不建议 `Phase 0/1` 改掉这个外部边界。但内部继续手写高度重复的 `ModelEntry` 也不是最佳实践。考虑到 Seedance 2 / Seedance 2 Fast 已经有 10 种视频价格，再叠加图片规格，继续把 `MODELS` 当作手写源配置会越来越难维护。

更合适的做法不是马上引入复杂 `PRODUCTS / SKUS` 多表，而是保留 `MODELS` 导出，同时把源配置收敛成几组轻量 TypeScript catalog，再用工厂函数编译成 `MODELS: ModelEntry[]`。这更接近行业里常见的 catalog-as-source、runtime-registry-as-artifact 做法。

推荐形态：

```ts
const VIDEO_MODEL_PRESETS = [
  {
    key: 'seedance-2-fast',
    label: 'Seedance 2 Fast',
    provider: 'kie',
    value: 'bytedance/seedance-2-fast',
  },
];

const VIDEO_PRICE_VARIANTS = [
  {
    family: 'seedance-2-fast-480p',
    productKey: 'seedance-2-fast',
    resolution: '480p',
    inputBilling: 'no-video',
    scenes: ['text-to-video', 'image-to-video'],
    pricing: { type: 'per-second', creditsPerSecond: 12 },
    defaults: { duration: 5, aspect_ratio: '16:9' },
    controls: { duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    enforced: { generate_audio: false },
  },
];

const IMAGE_MODEL_PRESETS = [
  {
    key: 'nano-banana',
    label: 'Nano Banana',
    provider: 'kie',
    valueByScene: {
      'text-to-image': 'google/nano-banana',
      'image-to-image': 'google/nano-banana-edit',
    },
  },
  {
    key: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'kie',
    value: 'nano-banana-pro',
  },
];

const IMAGE_PRICE_VARIANTS = [
  {
    family: 'nano-banana',
    productKey: 'nano-banana',
    spec: 'standard',
    scenes: ['text-to-image', 'image-to-image'],
    pricing: { type: 'fixed', credits: 5 },
    enabled: true,
  },
  {
    family: 'nano-banana-pro',
    productKey: 'nano-banana-pro',
    spec: '1K / 2K',
    scenes: ['text-to-image', 'image-to-image'],
    pricing: { type: 'fixed', credits: 20 },
    enabled: true,
  },
  {
    family: 'nano-banana-pro-4k',
    productKey: 'nano-banana-pro',
    spec: '4K',
    scenes: ['text-to-image', 'image-to-image'],
    pricing: { type: 'fixed', credits: 30 },
    enabled: true,
  },
];

export const MODELS: ModelEntry[] = [
  ...VIDEO_PRICE_VARIANTS.flatMap(buildVideoModelEntries),
  ...IMAGE_PRICE_VARIANTS.flatMap(buildImageModelEntries),
];
```

这样外部调用不变，但源码不需要手写十几个结构高度重复的 `ModelEntry`。这是“兼容旧接口 + 建立新领域模型”，不是为了优雅而优雅；它能直接减少配置漂移、定价错配和 UI 推导困难。

图片结构也应该写出来，但粒度要比视频轻：图片的价格通常是单次固定扣费，核心是表达 `Product + Spec + Scene + Provider Model`，而不是提前引入视频那种 `duration / inputBilling / creditsPerSecond` 矩阵。尤其是 `Nano Banana` 基础版当前 `text-to-image` 和 `image-to-image` 对应不同 provider model，示例里必须体现 `valueByScene`，否则 factory 很容易把两个 scene 错编译成同一个底层模型。

推荐职责划分：

| 配置 | 职责 |
| --- | --- |
| `IMAGE_MODEL_PRESETS` / `VIDEO_MODEL_PRESETS` | 产品级公共信息：显示名、provider、真实模型 ID、共用默认值 |
| `IMAGE_PRICE_VARIANTS` / `VIDEO_PRICE_VARIANTS` | family、规格、scene、输入口径、是否启用、计价规则 |
| `defineImageModel()` / `defineVideoModel()` | 约束源配置 shape，减少漏字段 |
| `buildImageModelEntries()` / `buildVideoModelEntries()` | 把轻量源配置编译成现有 `ModelEntry` |

关键点不是配置名字，而是职责边界：

- `MODELS` 是运行时兼容结构，不再是人工维护的主账本。
- 源配置只保留真正会变化的产品信息、价格矩阵和默认参数，不为了“语义完整”先造四五张表。
- `resolution`、`inputBilling` 这类 SKU 固有规格编译进 `ModelEntry.skuAttributes[scene]`。
- `duration`、`aspect_ratio` 这类默认值和可选项编译进 `defaults / controls`。
- `generate_audio: false` 这类真正的硬限制才编译进 `enforced`。
- `credits` 继续保留为默认参数下的兼容价；动态时长扣费由 `pricing` 计算。

如果图片的 `1K / 2K / 4K` 价格还没完全确认，可以先保留在变体配置里但 `enabled: false`，不进入前台可选项。

### 3. 图片规格先和定价文档对齐，再决定是否拆 `1K / 2K / 4K` family

图片侧的关键问题不是“马上拆出 3 个新 family”，而是先把“产品”和“规格”从文档与代码口径上对齐。

当前执行口径里，`docs/定价/3.本项目定价方案.md` 已经至少区分了两档：

| Product | 当前公开规格口径 | 当前 family |
| --- | --- | --- |
| Nano Banana Pro | `1K / 2K` 暂按标准档合并 | `nano-banana-pro` |
| Nano Banana Pro | `4K` 单独售卖 | `nano-banana-pro-4k` |

因此 `Phase 0/1` 更稳的做法是：

- 文档、UI 语义和代码内部都承认“规格是独立维度”，但不急着一次性拆出 3 个新的公开 family。
- 继续兼容当前执行版的 `nano-banana-pro` / `nano-banana-pro-4k` 两档口径。
- 只有在 `1K` 与 `2K` 真的需要独立成本、独立售价、独立前台展示时，才再拆出 `nano-banana-pro-1k`、`nano-banana-pro-2k`。

换句话说：

- 结构上，要为 `1K / 2K / 4K` 规格化留位。
- 执行上，先不要在本稿里写死新的图片积分档位。
- 真要拆 family 时，必须同步更新 `models.ts`、`credit-costs.ts` 和 `docs/定价/3.本项目定价方案.md`，不能只改其中一处。

### 4. 视频分辨率是规格，输入口径也是规格

Seedance 2 系列应拆成：

| 产品模型 | 真实 provider model | 规格 | 输入口径 | 内部 SKU 示例 |
| --- | --- | --- | --- | --- |
| Seedance 2 Fast | `bytedance/seedance-2-fast` | `480p` | no video input | `seedance-2-fast-480p` |
| Seedance 2 Fast | `bytedance/seedance-2-fast` | `720p` | no video input | `seedance-2-fast-720p` |
| Seedance 2 Fast | `bytedance/seedance-2-fast` | `480p` | with video input | `seedance-2-fast-480p-video-input` |
| Seedance 2 | `bytedance/seedance-2` | `480p / 720p / 1080p` | no video / with video | 先作为候选价格矩阵，未售卖则不导出到 `MODELS` |

注意：

- 当前源码里的已启用视频 scene 仍只有 `text-to-video` 和 `video-to-video`。`image-to-video` 如果要开放，必须补独立 scene 与价格口径，不能只在 UI 打开 tab。
- `with video` 和 `no video` 不只是 UI 模式不同，供应商基础价格不同。
- video-to-video 如果供应商按“输入秒数 + 输出秒数”计费，必须能可靠拿到输入视频时长，或确认当前 route 只按输出秒数计费后，才能开放 `4s` 到 `15s` 的完整输出时长选择。
- 如果某个 video-to-video SKU 的计费公式无法确认，不应退而求其次只给几个固定秒数；应暂不开放该 SKU 的可变 `duration` 控件，避免低估成本。

### 5. `duration` 的最佳实践：默认值、可选项和硬限制必须拆开

`duration: 5` 当前表现为“产品固定只卖 5 秒”，但最佳实践也不应把它长期放在 `enforced` 里。更清晰的表达是：`defaults` 给出默认输出时长，`pricing` 说明默认价或按秒价，`controls` 决定前端是否允许用户选择，`enforced` 只处理真正不能被覆盖的硬限制。

因此，即使某个阶段暂未开放可选秒数，也建议先把 `duration` 从 `enforced` 移入 `defaults`。当前方案既然已经把视频计费推进到 `creditsPerSecond`，并且 Seedance 能力范围明确为 `4-15s`，页面开放时就不应再只给 `5s / 10s` 这类少数固定档位，而应补齐完整的可选集合：

- `defaults`：默认时长，例如 `5`。
- `controls`：可选时长，例如 `[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]`；这是可选集合，不是几个 featured 档位。
- `pricing`：固定价或按秒计价规则；Seedance 首版按 `creditsPerSecond` 线性计算。
- `options`：用户本次选择的单个时长；单次生成仍只选一个 duration，但用户必须能从 `4s` 到 `15s` 每一秒中选择。

从行业产品形态和价格结构看，视频生成器支持多个时长选项已经是基本预期，尤其是 Seedance 这类专业视频模型。VideoFly 的 `text-to-video` 页面直接把 `VIDEO LENGTH` 做成一级参数，提供多个秒数 chips。供应商成本通常也是按 `1s` 倍数计费，时长本身不需要被设计成复杂矩阵；复杂的是“不同模型支持的秒数范围不同”和“不同分辨率每秒多少积分”。如果页面最终只能固定 `5s`，或者只开放 `4s / 5s / 10s` 这类少数档位，会显得像半成品能力，而不是完整的视频生成器。因此最终页面必须支持多秒数选择，但不要做前端自由输入。推荐把时长产品化成“模型能力声明 + 完整离散选项 + 默认值”的固定选项：

| 阶段 | 时长选项 | 建议定位 |
| --- | --- | --- |
| Seedance 能力 | `4s-15s` | Seedance 的模型能力范围，不能写死成全站统一时长 |
| Seedance 首版可选集合 | `4s / 5s / 6s / 7s / 8s / 9s / 10s / 11s / 12s / 13s / 14s / 15s` | 全量来自 registry，前端完整渲染，不只展示少数 featured |
| 默认值 | `5s` 或产品确认后的默认秒数 | 只决定初始选中值，不缩小可选范围 |
| 未来模型 | 按各自 provider capability 配置 | 不同视频模型可以有不同范围或枚举 |
| 不建议 | 前端自由输入、全站固定同一秒数列表、只开放少数推荐秒数、把更多秒数藏到 `More durations` | 容易和模型能力、计价规则、用户预期不一致 |

推荐 UI 用 chips、分段控件或可横向滚动的紧凑按钮组，而不是下拉框；`4s` 到 `15s` 都应可见或可直接滑动选择：

```text
Duration
[4s] [5s] [6s] [7s] [8s] [9s] [10s] [11s] [12s] [13s] [14s] [15s]
```

其中默认值可以是 `5s`；`10s`、`15s` 只是线性扣费下的更高成本选择，不应该被当成特殊套餐。Seedance 的允许范围应由服务端展开为固定 options，或者用 `range: { min: 4, max: 15, step: 1 }` 编译成同样的 options。未来如果其他 provider 只支持 `5s / 10s` 或支持 `1-30s`，就由各自 registry 配置决定。不要把秒数硬编码进组件，也不要把 Seedance 的完整范围拆成“首屏少量 + More durations”。`video-to-video` 如果存在输入视频时长参与计费的 route，必须先确认扣费公式；但只要某个 SKU 已声明 `creditsPerSecond` 与 `4-15s` 输出能力，前端就应完整开放这些秒数。

不建议把时长编码进 `family`：

```ts
// 不推荐
seedance-2-fast-480p-5s
seedance-2-fast-480p-10s
seedance-2-fast-720p-5s
seedance-2-fast-720p-10s
```

推荐保留分辨率 SKU，时长作为运行时参数：

```ts
family: 'seedance-2-fast-480p'
options: { duration: 10 }
```

对应 `ModelEntry` 应在 Phase 0 就扩展出结构，哪怕 Phase 1 只消费其中一部分：

```ts
interface ModelEntry {
  mediaType: 'image' | 'video' | 'music';
  family: string;
  value: string;
  label: string;
  provider: string;
  scenes: string[];
  enabled: boolean;
  credits: Record<string, number>; // 默认参数下的兼容价格
  skuAttributes?: Record<string, Record<string, unknown>>;
  defaults?: Record<string, Record<string, unknown>>;
  controls?: Record<string, SceneControls>;
  pricing?: Record<string, ScenePricing>;
  enforced?: Record<string, Record<string, unknown>>;
}
```

示例：

```ts
{
  family: 'seedance-2-fast-480p',
  credits: { 'text-to-video': 60 },
  skuAttributes: {
    'text-to-video': {
      resolution: '480p',
      inputBilling: 'no-video',
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
      duration: { default: 5, options: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
      aspectRatio: { default: '16:9', options: ['16:9', '9:16', '1:1'] },
    },
  },
  pricing: {
    'text-to-video': {
      type: 'per-second',
      creditsPerSecond: 12,
      billableSeconds: 'output',
      roundTo: 1,
    },
  },
  enforced: {
    'text-to-video': {
      generate_audio: false,
    },
  },
}
```

时长定价应优先采用按秒线性计价：`credits = durationSeconds * creditsPerSecond`。分辨率决定 `creditsPerSecond`，时长只是秒数倍数。实际扣费必须由服务端执行，不能由前端计算后传入：

| SKU | 每秒积分 | 可选时长 | 积分公式 |
| --- | ---: | --- | --- |
| `seedance-2-fast-480p` | 12 credits/s | `4s` 到 `15s` 每一秒 | `durationSeconds * 12` |
| `seedance-2-fast-720p` | 24 credits/s | `4s` 到 `15s` 每一秒 | `durationSeconds * 24` |

Seedance 应把 `4-15s` 全部作为可选项展示，页面上可以用布局控制密度，但不能只开放几个固定秒数。时长本身保持线性按秒计价，不再人为把 `15s` 靠档到 `150/300`，除非后续有促销、套餐或供应商阶梯价的明确产品理由。其他视频模型不要继承 Seedance 的 `4-15s`，必须声明自己的能力范围或枚举。

### 6. 服务端必须按最终参数重新计算积分

当前页面展示积分可以是估算，但实际扣费只能在服务端完成。

动态时长后的服务端顺序应是：

```ts
const finalOptions = resolveFinalOptions(entry, scene, options);
const costCredits = calculateModelCredits({
  mediaType,
  scene,
  entry,
  finalOptions,
});
```

而不是先用 `family` 固定价格扣费，再合并 `enforced`。

`calculateModelCredits()` 在 Phase 0 就应落地可运行骨架，不要只预留入口。它的第一版不需要覆盖复杂套餐策略，但必须覆盖 `pricing` 和 `credits` 两条路径，保证新增动态 SKU 时能马上暴露兼容问题：

```ts
interface CalculateModelCreditsInput {
  mediaType: string;
  scene: string;
  entry?: ModelEntry;
  finalOptions: Record<string, unknown>;
}

function calculateModelCredits({
  mediaType,
  scene,
  entry,
  finalOptions,
}: CalculateModelCreditsInput): number {
  const pricing = entry?.pricing?.[scene];

  if (pricing?.type === 'fixed') {
    return pricing.credits;
  }

  if (pricing?.type === 'per-second') {
    const duration = Number(finalOptions.duration);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(`invalid duration for pricing: ${entry?.family}/${scene}`);
    }

    const rawCredits = duration * pricing.creditsPerSecond;
    const roundedCredits = pricing.roundTo
      ? Math.ceil(rawCredits / pricing.roundTo) * pricing.roundTo
      : Math.ceil(rawCredits);

    return Math.max(roundedCredits, pricing.minCredits ?? 0);
  }

  const compatibleCredits = entry?.credits?.[scene];

  if (typeof compatibleCredits === 'number') {
    return compatibleCredits;
  }

  return getSceneFallbackCreditCost(mediaType, scene);
}
```

推荐落点仍是 `src/config/ai/credit-costs.ts` 或后续独立的 `src/config/ai/pricing.ts`。短期为了兼容现有调用，可以让 `getGenerationCreditCost()` 继续服务前端估算，同时新增 `calculateModelCredits()` 给服务端最终扣费使用；等前端也消费最终 registry 后，再逐步收敛成同一个导出。

为了尽早发现与现有 SKU 的兼容问题，`validateModels()` 还应增加一条校验：如果某个 scene 同时存在 `pricing` 和 `credits`，则用默认参数计算出的 `calculateModelCredits()` 必须等于 `credits[scene]`，除非本次改动明确就是一次定价迁移。这样 `credits` 兼容价不会和 `pricing` 动态价悄悄漂移。

要求：

- `duration` 必须在允许列表内。
- `resolution` 如果属于 SKU，应由 `skuAttributes` 注入和记录，不再放进 `enforced`。
- `aspect_ratio` 如果开放，必须在 `controls` 允许列表内。
- `generate_audio` 如果成本不明确，继续由 `enforced` 锁定为 `false`。
- 前端传入的积分或价格不可信。

### 7. 当前页面的真实状态

当前 `video.tsx` 只有 `selectedFamily`，没有 `selectedDuration`：

- 模型下拉直接展示 `ModelEntry.label`。
- 积分按 `getGenerationCreditCost({ family })` 固定计算。
- 提交时 `options` 只包含 `image_input / video_input`。
- `duration` 由后端从 `models.ts.enforced` 注入。

因此当前实现本质是“固定 5 秒 SKU”，不是“可选秒数产品”。

如果要最小入侵支持可变秒数，应按以下顺序：

1. `ModelEntry` 增加 `skuAttributes / defaults / controls / pricing`，保留 `credits` 作为默认价兼容。
2. `video.tsx` 增加 `selectedDuration`，从 `entry.controls[scene].duration.options` 渲染。
3. 前端估算积分使用同一套 `calculateModelCredits()`。
4. 提交时把 `duration` 放入 `options`。
5. 后端合并最终参数后重新计算积分。
6. `duration` 从 `enforced` 移到 `defaults / controls`，`resolution` 从 `enforced` 移到 `skuAttributes`，`enforced` 只保留 `generate_audio` 等硬限制。

### 8. 文档定价表也要拆列

这里的拆列是合适的，但两个文档的拆法不同：

- `docs/定价/2.四平台对比成本价格.md` 是成本快照，可以保持 Seedance 5 行，因为每行代表一个模型规格；但应该把 `no video input` 和 `with video input` 的每秒价格拆成明确列。
- `docs/定价/3.本项目定价方案.md` 是执行扣费表，必须拆成 Seedance 10 行，因为 `no video input` 和 `with video input` 对应不同 scene、family 和 `creditsPerSecond`。

`docs/定价/2.四平台对比成本价格.md` 的推荐结构：

```md
| 模型 | 规格 | 时长能力 | KIE no video input | KIE with video input | 其他平台参考 |
| --- | --- | --- | ---: | ---: | --- |
| Seedance 2 Fast | 480p | 4-15s | $0.0775/s | $0.045/s | Replicate / EvoLink / WaveSpeed 按列补充 |
| Seedance 2 Fast | 720p | 4-15s | $0.165/s | $0.100/s | Replicate / EvoLink / WaveSpeed 按列补充 |
```

`docs/定价/3.本项目定价方案.md` 的推荐结构：

```md
| 媒体 | 模型 | 规格 | 输入口径 | scene | family | 时长能力 | KIE 基础价 | 本站积分/秒 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | --- |
| video | Seedance 2 Fast | 480p | no video input | `text-to-video` / `image-to-video` | `seedance-2-fast-480p` | `4-15s` | $0.0775/s | 12 | 当前主线 |
| video | Seedance 2 Fast | 480p | with video input | `video-to-video` | `seedance-2-fast-480p-video-input` | `4-15s` | $0.045/s | 7 | 当前低成本测试档 |
```

不要在“模型”列里写 `Seedance 2 Fast 5s 480p`。`4-15s` 是模型能力范围，`480p / 720p / 1080p` 是规格，`no video input / with video input` 是输入计费口径。

这里的重点是“拆列”和“统一语义”。成本快照按规格 5 行即可；执行扣费必须按规格 × 输入口径拆成 10 行。公开积分以 `docs/定价/3.本项目定价方案.md` 的执行版为准。

### 9. 不建议新增孤立的 `productFamily/displayFamily`，但应提供可消费的分组模型

如果只是为了“看起来语义更好”，不要贸然加没人消费的 `productFamily`、`displayFamily`。但如果 Phase 1 要把 `Seedance 2 Fast` 下的 `480p / 720p` 做成同一产品下的规格选择，那么分组字段就是实际 UI 契约，不应被推迟。

更好的做法：

- Phase 0 用轻量 `catalog + factory` 在源码内部表达产品和规格。
- 生成后的 `ModelEntry.label` 仍可保持 `Seedance 2 Fast 480p`，兼容当前下拉框。
- 如果 Phase 1 做规格聚合 UI，就让生成后的 `ModelEntry` 带上：

```ts
group?: {
  key: string;
  label: string;
}
```

关键不是“少加字段”，而是“字段必须有消费者”。`group` 一旦用于前端分组、价格提示或日志快照，就是优雅领域模型的一部分；如果没有消费者，就暂时留在 `catalog + factory` 编译层即可。

## 推荐数据结构

### `credits` 保持兼容层，动态计价另加 `pricing`

不建议把 `credits` 改成：

```ts
Record<string, number> | Record<string, Record<string, number>>
```

这种联合类型运行时不够清晰，也容易让扣费路径变重。`credits` 应继续保持简单结构，用作“默认参数下的展示价/兼容价”：

```ts
credits: Record<string, number>;
```

如果需要按秒数、分辨率、输入口径动态计价，不要扩展 `credits`，而是增加独立的 `pricing`：

```ts
type ScenePricing =
  | {
      type: 'fixed';
      credits: number;
    }
  | {
      type: 'per-second';
      creditsPerSecond: number;
      billableSeconds: 'output' | 'input-plus-output';
      minCredits?: number;
      roundTo?: number;
    };
```

### `skuAttributes / defaults / controls / pricing / enforced` 职责拆分

建议把 SKU 固有规格、可变参数、默认参数、计价规则和硬限制拆开：

| 字段 | 职责 | 示例 |
| --- | --- | --- |
| `skuAttributes` | 所选 SKU 的固有规格，用于计价、任务快照、UI 规格展示，以及 provider 支持字段的映射 | `resolution: '480p'`、`inputBilling: 'no-video'` |
| `defaults` | 用户不选时的默认值 | `duration: 5`、`aspect_ratio: '16:9'` |
| `controls` | 前端可展示的可选项 | `duration.options: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]` |
| `pricing` | 服务端动态计价规则 | `creditsPerSecond: 9` |
| `enforced` | 用户不能覆盖的硬限制，不表示 SKU 规格 | `generate_audio: false` |

`skuAttributes` 不是前端用户输入，也不是策略覆盖。它描述“当前 family/SKU 本身是什么规格”，因此应该参与 `finalOptions`、计价和任务快照；其中 provider 支持的字段（如 `resolution`）再由 adapter 映射/透传，不需要传给 provider 的字段（如 `inputBilling`）只用于计价和快照。这样后续把 `480p / 720p` 做成规格控件时，UI 切换的是 SKU，服务端记录的是 SKU 属性，不会误解为用户被强制覆盖了一个运行时参数。

```ts
interface SceneControls {
  duration?: {
    default: number;
    options: number[];
  };
  aspectRatio?: {
    default: string;
    options: string[];
  };
}

interface ModelEntry {
  mediaType: 'image' | 'video' | 'music';
  family: string; // Phase 0/1 继续表示 billing SKU
  group?: {
    key: string;
    label: string;
  };
  value: string;
  label: string;
  provider: string;
  scenes: string[];
  enabled: boolean;
  credits: Record<string, number>; // 默认参数下的兼容价格
  skuAttributes?: Partial<Record<string, Record<string, unknown>>>;
  defaults?: Partial<Record<string, Record<string, unknown>>>;
  controls?: Partial<Record<string, SceneControls>>;
  pricing?: Partial<Record<string, ScenePricing>>;
  enforced?: Partial<Record<string, Record<string, unknown>>>;
}
```

### Sanitized options 必须严格

```ts
interface SanitizedGenerationOptions {
  aspect_ratio?: string;
  duration?: number;
  resolution?: string;
  generate_audio?: boolean;
  image_input?: string[];
  video_input?: string[];
}
```

`sanitizeGenerationOptions()` 只允许返回 registry 中声明过的参数值。未知 key 不透传，非法 value 直接拒绝。

## 服务端参数链路

后端创建任务前统一做：

```ts
const skuAttributes = entry.skuAttributes?.[scene] ?? {};
const defaults = resolveControls(entry, scene).defaults ?? {};
const sanitizedOptions = sanitizeGenerationOptions({
  mediaType,
  scene,
  entry,
  options,
});
const resolvedOptions = resolveAutoOptions({
  entry,
  scene,
  options: { ...defaults, ...sanitizedOptions },
});
const enforced = entry.enforced?.[scene] ?? {};
const finalOptions = { ...resolvedOptions, ...skuAttributes, ...enforced };
const costCredits = calculateModelCredits({
  mediaType,
  scene,
  entry,
  finalOptions,
});
```

要求：

- `skuAttributes` 注入 SKU 固有规格，例如分辨率和输入计费口径，不由用户覆盖。
- `defaults` 只提供默认值，不覆盖用户选择。
- `sanitizedOptions` 只包含白名单 key/value。
- `auto` 必须在服务端解析成真实 provider 参数。
- `enforced` 只保留硬限制，并且最后覆盖。
- `finalOptions` 用于任务快照和扣费；provider adapter 只映射/透传 provider 支持的字段，`costCredits` 必须在 `finalOptions` 之后计算。
- 前端传入的 cost 不可信，实际扣费仍由服务端计算。

### `auto` Phase 0/1 规则

`Phase 0/1` 不要做“免费用户默认 1k、付费用户默认 2k”这种动态策略。规则越简单越稳：

- `resolution: auto` 解析为当前 SKU 的 `skuAttributes.resolution`；如果该 scene 没有 SKU 分辨率属性，再回退到明确声明的 default。
- `aspect_ratio: auto` 解析为当前 SKU/model 的默认 `aspect_ratio`。
- 如果某个参数没有明确 default，不允许出现 `auto`。

## 前端参数开放边界

### 图片生成器

可低风险开放：

- `aspect_ratio`: `auto` / `1:1` / `16:9` / `9:16` / `4:3` / `3:4`

谨慎开放：

- `resolution`: 只有在 `1k/2k/4k` 对应成本明确后再开放。

暂不开放：

- 输出数量、多参考图数量、复杂高级项。

### 视频生成器

可低风险开放：

- `aspect_ratio`: `auto` / `16:9` / `9:16` / `1:1` / `4:3` / `3:4`

应该做成轻量 UI 聚合，但服务端仍按 SKU：

- `resolution`: `480p` / `720p`
- UI 可以显示为同一个 `Seedance 2.0 Fast` 下的分辨率控件。
- 提交时映射到当前已有 SKU family：`480p -> seedance-2-fast-480p`，`720p -> seedance-2-fast-720p`。
- 不要在 `Phase 0/1` 把 registry 改成同一 family + tiered credits。

可在价格规则补齐后开放：

- `duration`: Seedance 按 `4s` 到 `15s` 每一秒完整开放，默认值只决定初始选中项；前端从 `controls.duration.options` 渲染，不自由输入，不只开放少数推荐秒数，也不把完整范围藏进 `More durations`。其他模型各自声明自己的范围或枚举。

暂不开放：

- `duration` 的前端自由输入、全站统一写死秒数、或没有 `resolution -> creditsPerSecond` 价格规则和模型级允许范围的模型时长。
- `generate_audio`。如果当前产品限制是 `false`，继续放在 `enforced`。

交互设计边界：

- `Phase 0/1` 可以把模型选择拆成“产品 + 规格 + 参数摘要”的轻量结构，避免用户看到一串伪模型名。
- 时长控件采用 chips、分段控件或横向滚动按钮组：Seedance 显示 `4s` 到 `15s` 全部选项，默认 `5s`；未开放的秒数不渲染，不做 disabled 噱头。
- `Phase 0/1` 不做完整工作台，不做复杂历史面板，不做多列结果流。
- 参数控件应从 registry 派生，避免 UI 先行导致服务端不认账。

## Kie 适配器要求

`src/extensions/ai/kie.ts` 应改为：

- 不再设置视频业务默认值。
- 不再用 `landscape` 作为默认 aspect ratio。
- 对 Seedance 直接透传 `16:9`、`9:16`、`1:1` 等 Kie 文档支持的值。
- 如果 provider/model 需要不同字段名，只在 adapter 中做字段名转换。
- 如果 route 没有传必需参数，adapter 应抛错或让 provider 报错，不要自行补默认业务值。

## 推荐实施顺序

### Phase 0：参数契约与领域模型硬化，不改页面交互

目标：不改变现有页面交互，先把后端契约、registry 领域模型和 provider adapter 变可靠。Phase 0 不是“只修 bug”，而是把后续优雅 UI 需要的数据源先做对。

修改范围：

- `src/config/ai/models.ts`
  - 引入轻量 `catalog + factory -> MODELS` 的编译层，保留外部 `MODELS` 导出。
  - 新增最小 `skuAttributes / defaults / controls / pricing` 结构。
  - `enforced` 收缩为硬限制。
  - `validateModels()` 增加源配置、skuAttributes/defaults/enforced、controls/pricing 的一致性校验，并校验默认参数下 `pricing` 计算值与 `credits[scene]` 兼容价一致。
- `src/app/api/ai/generate/route.ts`
  - 新增严格类型的 `sanitizeGenerationOptions()`。
  - 合并顺序改为 `defaults -> sanitizedOptions -> resolved auto -> skuAttributes -> enforced`。
  - 任务落库写最终参数，并记录可解释的 SKU/规格快照。
- `src/extensions/ai/kie.ts`
  - 删除视频生成里的业务默认值。
  - 只透传 route 解析后的 canonical 参数。
- `src/config/ai/credit-costs.ts`
  - 实现 `calculateModelCredits()` 的 Phase 0 骨架：优先 `entry.pricing[scene]`，其次 `entry.credits[scene]`，最后才走 scene fallback。

验收：

- 当前 Image/Video/Music 生成流程不变。
- 现有 480p/720p 视频 SKU 扣费不变。
- 公开套餐表和现有视频积分锚点不被本阶段误改。
- `MODELS` 外部调用不变，但内部不再依赖大段重复手写配置。
- `pnpm ai:validate-models` 通过。
- `pnpm build` 通过。

### Phase 1：最小前端参数开放

目标：只开放低风险参数，不做首页/工作台重构；但生成器局部交互应按 registry 展示“产品、规格、参数摘要”，不要继续把所有选择压进单个模型下拉框。

修改范围：

- `src/shared/blocks/generator/image.tsx`
  - 增加最少量 `aspect_ratio` 控件。
  - 提交到 `options`。
- `src/shared/blocks/generator/video.tsx`
  - 增加最少量 `aspect_ratio` 控件。
  - 增加 `resolution` 规格控件，映射到现有 SKU family。
  - 补齐 `resolution -> creditsPerSecond` 价格规则和模型级 duration capability 后，增加 `duration` 控件；Seedance 从 registry 渲染 `4s` 到 `15s` 每一秒，默认只控制初始选中值。
  - 补齐类似 `queryFailCountRef` 的轮询失败容错。
- `src/config/locale/messages/*/ai/image.json`
  - 只补参数控件文案。
- `src/config/locale/messages/*/ai/video.json`
  - 只补参数控件文案。

验收：

- 前端选项来自 registry。
- 后端拒绝未声明参数。
- 切换模型/SKU 后，不支持参数回落到默认值。
- 若开放 `duration`，服务端必须按 `resolution -> creditsPerSecond` 与 `duration` 重新计算积分；前端只展示估算。
- 任务落库 `options` 是服务端最终参数。
- 扣费金额来自服务端按最终 SKU/参数计算。
- 用户看到的是清晰的产品与规格选择，而不是“Seedance 2 Fast 5s 480p”这种混合模型名。

### Phase 2：首页 Image / Video 双入口与输入器质感

目标：参数链路稳定后，再改首页入口。

修改范围：

- 新增轻量 `HomepageGeneratorShell`。
- 默认打开 Image。
- Video 面板 lazy load，只在用户切换到 Video 时加载。
- 输入区可以借鉴 VideoFly 的紧凑结构、参数摘要和渐进展开，但不引入完整工作台。
- 不改 title/canonical。
- 不引入工作台侧边栏。

验收：

- 首页仍保留原 SSR SEO 内容。
- 首屏默认体验不变重。
- Image 生成流程不回退。
- Video 入口可用但不拖慢默认 Image 首屏。

### Phase 3：公共 hook 与工作台级 UI 升级

目标：当 image/video 行为稳定后，再抽公共逻辑和升级体验。

可做：

- `useGenerationTask()`：先覆盖 image/video 的轮询、超时、失败计数。
- `useGeneratorOptions()`：统一推导候选链、controls、defaults。
- VideoFly 风格输入器：参数摘要、Popover、紧凑输入区。
- 生成页工作台：Sidebar + Generator + Result/History。

暂不强制：

- music 迁移。
- 完整历史面板。
- UGC/showcase SEO 闭环。

### Phase 4：稳定性与增长闭环

这一阶段才考虑：

- 服务端超时回收任务。
- 超时回收统一走失败更新和退款逻辑。
- 用户主动公开生成结果到 showcase。
- 审核后的公开结果进入 SEO/UGC 页面。
- 生成事件埋点。

## Phase 0/1 不做清单

为了避免无边界重构，`Phase 0/1` 明确不做：

- 不新增 `generator-workspace-layout.tsx`。
- 不新增 `generator-tool-sidebar.tsx`。
- 不新增 `generation-history-panel.tsx`。
- 不做 `GenerationResultStream`。
- 不新增 `src/shared/lib/analytics.ts`。
- 不迁移 music 到公共 hook。
- 不把全部生成器合并为一个万能组件。
- 不把 `family` 语义从 SKU 改成产品模型家族。
- 不默认开放 `image-to-video`，除非先补齐对应 `scene / SKU / credits / provider capability`。
- 不开放没有每秒价格规则和模型级 duration capability 的 `duration`；但 Seedance 首版能力范围按 `4-15s` 设计，必须支持 `4s` 到 `15s` 每一秒可选，不能只展示少数固定秒数或依赖 `More durations`。
- 不做 UGC/showcase/SEO 闭环。
- 不做服务端超时回收 cron。

`Phase 0/1` 明确要做的设计质量：

- 要拆清 `Product / SKU / SKU Attributes / Runtime Params / Pricing / Enforced Policy`，但实现层优先采用轻量 `catalog + factory`，不先上复杂多表。
- 要在 Phase 0 落地 `calculateModelCredits()` 的 `pricing -> credits -> scene fallback` 骨架，而不是只预留函数名。
- 要让前端参数控件来自 registry，而不是组件内写死。
- 要让任务快照能解释用户当时选择了哪个产品、规格和最终参数。
- 要让后续 VideoFly 风格输入器可以自然消费现有结构，而不是再做第二次重构。

## 最终验收标准

Phase 0/1 完成时应满足：

- `enforced` 不再承载默认业务参数。
- `resolution`、`inputBilling` 等 SKU 固有规格进入 `skuAttributes`，不再混进 `enforced`。
- 服务端按 `defaults -> sanitizedOptions -> resolved auto -> skuAttributes -> enforced` 得到最终参数。
- 后端拒绝不在 registry 允许列表中的参数。
- `auto` 会解析成真实参数，不直接传给 provider。
- `kie.ts` 不再写死视频默认值。
- 任务快照中的 `options` 是最终参数。
- 扣费来自服务端 `calculateModelCredits()` 基于最终 SKU/参数计算，不信任前端。
- 当前图片、视频、音乐生成流程不被破坏。
- 视频轮询失败不会一次网络抖动就直接终止。
- 轻量 `catalog + factory` 与 `Product / SKU / SKU Attributes / Controls / Pricing` 成为 registry 内部事实，`MODELS` 只是兼容导出。
- 视频前端至少能按产品和规格组织 480p/720p，而不是继续暴露为互不相关的模型项。
- 没有新增大体量 UI shell、工作台或历史面板。

## 总结

这份方案应定位为“生成器领域模型重整 + 参数契约修复 + 后续 UI 升级路线图”，而不是一次性 VideoFly 重构。

最佳路线不是一味保守，而是把风险控制放在外部行为，把设计质量放在内部结构：先修服务端参数、扣费链路和 registry 领域模型，再开放少量但结构正确的前端参数；等这条链路稳定，再做首页双入口和 VideoFly 风格体验升级。这样既能避免破坏现有流程，也不会因为短期求稳而继续积累低质量抽象。
