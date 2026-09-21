# Seedance 2.0 Mini 模型接入方案

> 项目：seadance-video-shipany2  
> 核对日期：2026-09-21  
> 状态：待实施；本文是接入方案，不代表模型已接入、联调通过或上线。  
> 目标：在现有视频生成器中增加 Seedance 2.0 Mini，并为后续模型接入 Skill 留下可复用依据。

## 1. 接入结论与 V1 范围

接入难度较低：项目已有 Kie Provider、可信模型注册表、参数驱动的前端、任务轮询、积分扣费和可选结果转存。基础接入主要涉及模型配置、Provider 字段映射和针对性验证，预计不需要新依赖或数据库迁移。

按本轮评审确定 V1 范围；扩展能力留待后续独立实施：

| 阶段     | 能力                                       | 实施边界                                                            |
| -------- | ------------------------------------------ | ------------------------------------------------------------------- |
| 基础接入 | 文生视频、首帧、首尾帧、参考图片           | 复用现有文生 / 图生入口；参考图片暂沿用项目的 2–3 张限制            |
| 按需扩展 | 参考视频、参考音频、更多参考图片、混合参考 | 补充输入约束与计费核验后开放；参考视频可先以现有单 URL 入口单独接入 |

基础接入不以多模态上传界面为前置条件。现有 Fast、Standard 和 MiniMax H3 的选项、映射、定价应保持兼容。新增 Mini 应使用独立 family，不能作为 Fast 的同价 fallback。

V1 仅开放 Text-to-Video、First Frame、First/Last Frame 和现有 2–3 张 Reference Images；不开放参考视频、参考音频或混合参考。核心业务改动限定在 `models.ts`、`kie.ts` 和必要的 `options.ts`，配套补测试与定价文档。生成器 UI、上传组件、数据库、任务表、轮询和结果展示继续复用现有实现。

## 2. 官方资料与已确认协议

实施前重新查看 [Kie Mini API 文档](https://docs.kie.ai/market/bytedance/seedance-2-mini)、[Mini 产品与参数页](https://kie.ai/seedance-2-0-mini) 和 [通用任务查询文档](https://docs.kie.ai/market/common/get-task-detail)。价格和字段可能更新，实际联调记录应注明日期。

根据 Kie API 文档，Mini 使用以下模型和任务接口；鉴权采用服务端 Bearer API Key：

```text
model: bytedance/seedance-2-mini
POST https://api.kie.ai/api/v1/jobs/createTask
GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=<providerTaskId>
```

模型身份建议固定为：

| 注册表字段 | 值                        |
| ---------- | ------------------------- |
| mediaType  | video                     |
| family     | seedance-2-mini           |
| value      | bytedance/seedance-2-mini |
| label      | Seedance 2.0 Mini         |
| provider   | kie                       |

注意区分内部 family 和上游 model；不能把 `seedance-2-mini` 直接作为上游 model 发送。

官方参数页列出 480p / 720p、音频生成开关，以及图片、视频、音频参考输入。画幅包含现有常用比例，并增加 `21:9` 和 `adaptive`。首帧、首尾帧与多模态参考为互斥路径；官方示例同时列出多种字段，不能把整个示例原样当成有效组合。[API 约束说明](https://docs.kie.ai/market/bytedance/seedance-2-mini)、[参数页](https://kie.ai/seedance-2-0-mini)。

本次可读取的文档未完整展示 `duration` 的上下界、默认值和最新单价。不能把 Fast 的时长范围、价格或上游默认值直接视为 Mini 的合同；实施时需从完整请求 schema 或 Playground 确认。若官方完整 schema 明确支持特殊值（如 `-1`），V1 也只开放可明确计费的数字秒数，不开放特殊时长语义。

## 3. 当前代码事实与接入缺口

以下路径均相对于仓库根目录，以核对日的代码为准。

| 位置                                    | 当前实现                                                                               | Mini 接入影响                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/config/ai/models.ts`               | `SEEDANCE_CATALOG` 生成 Seedance 条目，统一定义场景、规格、价格                        | 新增 Mini 条目；共享工厂的默认值和枚举不能不经核对直接照搬 |
| `src/extensions/ai/kie.ts`              | `KIE_VIDEO_DURATION_FIELD` 只为 Fast 显式指定 `duration`，其余通用视频默认 `n_frames`  | 为 Mini 显式指定 `duration`                                |
| 同上                                    | `SEEDANCE_2_VIDEO_MODELS` 仅包含 Fast、Standard                                        | 加入 Mini，才能复用首帧、首尾帧及参考图片映射              |
| 同上                                    | 支持通用视频输入、画幅、分辨率、音频生成和时长映射                                     | 参考音频、联网检索等不是添加 controls 后就能自动透传       |
| `src/shared/blocks/generator/video.tsx` | 从 `MODELS` 读取模型和 controls                                                        | 基础模型选择通常无需另写一份前端模型列表                   |
| 同上                                    | 提示词上限 2000；参考图片 2–3 张；视频输入为单 URL                                     | 可先保留产品限制；不能宣传已经覆盖全部上游能力             |
| `src/config/ai/options.ts`              | 图片模式有数量校验；场景输入分别允许 `image_input` / `video_input`；未登记选项会被过滤 | 完整多模态需要扩展共享输入合同，不能只改 Provider          |
| `src/config/ai/asset-url-security.ts`   | 检查图片和视频输入 URL                                                                 | 引入音频输入时需同步接入 URL 检查                          |
| `src/shared/services/ai.ts`             | 已按 `kie_api_key` 初始化 Kie Provider                                                 | 复用现有配置；本次未核验运行环境 Key、余额或模型访问权限   |

图片模式校验还有一个实际边界：`assertModelInputConstraints()` 在缺少 `image_mode` 时提前返回。通过声明式配置收紧 Mini 的 `image-to-video` 合同：在现有 `ModelInputConstraints` 中增加 `imageInputRequired?: boolean`，仅 Mini 图生配置为 `true`。

当 `imageInputRequired === true` 时，`assertModelInputConstraints()` 在现有提前返回之前执行通用必填检查：`image_mode` 必须存在，`image_input` 必须为非空数组，模式必须合法且在配置的 `imageModes` 允许列表中。数量和 URL 字符串检查继续复用 `assertVideoImageInput()`：首帧 1 张、首尾帧 2 张、参考图片 2–3 张。缺少模式时明确拒绝，不能回退到通用 `image_urls`。

Fast / Standard / MiniMax H3 不设置该字段；字段缺省或为 `false` 时保留原有校验路径，Mini 文生也不设置该字段。模型差异由 `models.ts` 声明，`options.ts` 不按具体 family 或 model ID 分支；不扩展成 `requiredFields[]`、通用 schema engine 或 asset rule system。

## 4. 模型注册与默认参数

基础阶段为 `text-to-video` 和 `image-to-video` 分别配置条目，共用 `seedance-2-mini` family。后续 `video-to-video` 使用同一 family 的独立 scene 配置。

- `defaults`：分辨率和画幅可采用已确认支持的 480p、16:9，`generate_audio: false`；其中 480p / 16:9 是本站产品默认策略，不代表 Kie / 上游默认值。默认 duration 在确认完整允许范围后确定，不预填猜测秒数。
- `controls`：只列已确认支持且已定价的规格。480p / 720p 分别配置；时长枚举在确认 schema 后填写，不照搬 Fast / Standard 的 `durationOptions`。
- 画幅：可先保留项目当前五种常用比例；若开放 `21:9` / `adaptive`，只扩展 Mini 的 controls，不改变旧模型。
- `inputConstraints`：Mini 图生配置 `imageModes: [...VIDEO_IMAGE_MODES]`、`imageInputRequired: true`、`promptRequired: true` 和经核对的 `uploadMaxSizeMB`。在现有 `validateInputConstraints()` 中为可选字段 `imageInputRequired` 补布尔类型检查；该字段为 true 时应配置图生场景的非空合法 `imageModes`，复用现有模式校验。
- `skuAttributes.inputBilling`：文生 / 图生使用 `no-video-input`，视频参考场景使用 `video-input`。
- `pricing`：按 scene 和 resolution 定义每秒积分；价格确定后再启用对应配置。
- `generate_audio`：V1 向用户展示现有音频开关，默认仍为 `false`，客户可选择 `true`。本站暂不新增音频专属计费维度，Provider 继续复用通用 boolean 映射；音频开启是否产生 Kie 上游额外成本仍需通过真实账单核验。
- `enabled`：价格和完整 duration 允许范围未确认前，Mini 所有条目保持 `false`。这是发布闸门，不是允许临时假配置的理由；未知值保留为文档待定项，不用猜测价格、秒数或 Fast 配置凑出注册表条目。

现有 `createSeedanceEntry()` 会无条件添加音频 controls。为 catalog / factory 增加一个最小可选配置 `enableAudioControl?: boolean`：未设置时保留旧行为，Mini V1 显式设为 `true`，工厂生成现有 `controls.generate_audio`；`defaults.generate_audio` 仍为 `false`。现有 options 白名单允许客户选择的 `true` 通过，`kie.ts` 继续复用现有通用 boolean 映射，把最终值显式发送给上游，不为 Mini 重复写一份音频策略。本站计费仍按既有模型、场景、分辨率和时长计算，不在 Provider 层静默覆盖客户选择。

其他共享画幅、默认值和旧模型参数保持原状；仅在 Mini 确有差异时做局部扩展。

## 5. Provider 字段映射

基础接入复用 `applyKieVideoImageInput()` 和现有 `generateVideo()`，Mini 加入 `KIE_VIDEO_DURATION_FIELD` 和 `SEEDANCE_2_VIDEO_MODELS`。不新增 Provider，也不创建独立 `buildSeedanceMiniPayload()`；`generate_audio` 继续走现有通用 boolean 映射，不增加 Mini model ID 特判。

| 项目输入                                       | Kie input 字段                   | 条件                            |
| ---------------------------------------------- | -------------------------------- | ------------------------------- |
| prompt                                         | prompt                           | 基础阶段要求非空                |
| image_mode=first_frame，image_input[0]         | first_frame_url                  | 恰好一张图片                    |
| image_mode=first_last_frames，image_input[0/1] | first_frame_url / last_frame_url | 恰好两张，顺序固定              |
| image_mode=reference_images，image_input       | reference_image_urls             | 初期沿用 2–3 张                 |
| video_input                                    | reference_video_urls             | 仅在视频参考场景开放后使用      |
| duration                                       | duration                         | 数字秒数；不发送 n_frames       |
| resolution / aspect_ratio                      | 同名字段                         | 以 Mini controls 校验后的值为准 |
| generate_audio                                 | generate_audio                   | false 也必须被明确发送          |

`image_mode`、`inputBilling` 是项目内部字段，不发送给上游。不要把 `finalOptions` 无差别展开进 `input`；仅映射实际接受的字段。

建议的文生请求形态如下，仅展示对象结构，不是可直接发送的 JSON 或已验证的调用结果。`confirmedDuration` 表示确认范围后选定的数字秒数。`callBackUrl` 沿用现有生成接口提供的值；示例域名仅为占位：

```js
{
  "model": "bytedance/seedance-2-mini",
  "callBackUrl": "https://your-domain.example/api/ai/notify/kie",
  "input": {
    "prompt": "A sailboat moving slowly across a calm lake at sunrise.",
    "duration": confirmedDuration,
    "resolution": "480p",
    "aspect_ratio": "16:9",
    "generate_audio": false
  }
}
```

图生请求在上述结构中按所选模式加入对应图片字段，不能同时发送首尾帧和 reference 字段。`web_search`、`nsfw_checker`、`return_last_frame` 的支持、默认行为及作用需按完整 schema 核验后决定；不能将“未传入”当成“已强制关闭或开启”。当前项目审核仍沿用现有服务链路。

## 6. 积分与任务生命周期

Mini 当前没有已确认的本站价格。V1 实施前核对无视频输入、音频关闭时各分辨率的成本，记录到业务定价源 `docs/定价/3.本项目定价方案.md` 第 3 节，再同步代码。带视频输入及音频开启的成本留到相应扩展阶段核验，不作为 V1 的前置条件。Kie credits 与本站 credits 是不同口径，不得直接等同。

本站现有视频计算方式为：

```text
costCredits = duration × pricing[scene].byResolution[resolution].creditsPerSecond
```

前端预估和后端扣费均应复用现有函数，后端以 `resolveGenerationPricingSnapshot()` 得出的最终参数和金额为准。仅 Mini 自己的 `credits[scene]` 与默认规格保持一致，但不能替代视频 `pricing`。不借此修正 Fast / Standard 的旧 credits 值或其他既有价格。同一 family / scene 的候选必须满足价格与最终参数一致性检查。

若上游对输入视频时长或音频另行收费，现有按输出时长计算的模式不能自动覆盖差异；先确定本站售价是否覆盖成本，必要时再扩展计费，不能假定新增一个 `inputBilling` 字段就完成了计费支持。

任务沿用 `/api/ai/generate` → Kie → `ai_task` → `/api/ai/query` → 结果展示。区分数据库任务 ID 和 Kie taskId；前端查询项目任务，上游查询使用 Provider taskId。

当前生成接口会构造 `/api/ai/notify/kie`，Fast / Standard 的通用 Provider 路径也会发送该 callback，但仓库尚无对应接收路由。这是已有架构问题。V1 保持现有 callback 参数行为，继续依赖轮询，不增加 Mini 专属的省略或改写分支。后续统一治理回调时再落实接收路由、校验和幂等更新，不能声称当前已有可用回调链路。

复用 `queryVideo()` 的状态、`resultJson.resultUrls` 解析及可选转存，并通过真实结果确认兼容性。当前失败退款在 `updateAITaskById()` 的 FAILED 分支实现，需验收重复查询不会重复退回。前端超时或关闭页面不等于上游失败，不能据此承诺自动退款；审核终态也按现有策略验收。

## 7. 实施文件与顺序

1. 核对官方完整参数 schema、成本和运行环境模型权限，补齐本文待定项。
2. 更新 `docs/定价/3.本项目定价方案.md` 的 Mini 执行价格；不因新增模型改套餐销售价格。
3. 修改 `src/config/ai/models.ts`，增加可选 `imageInputRequired?: boolean` 及其配置校验，仅 Mini 图生声明为 true。同时增加 Mini 场景、已确认规格、独立价格和 `enableAudioControl: true`；默认音频值仍为 `false`。价格与 duration 未确认时保持 `enabled: false`，不填写假配置。
4. 修改 `src/extensions/ai/kie.ts`，补 Mini 模型识别和 duration 映射；保持 callback 行为。
5. 在 `src/config/ai/options.ts` 按 `imageInputRequired` 执行通用素材与模式必填规则，复用现有模式允许列表和数量检查；不硬编码 Mini family，不扩展 V1 之外的共享输入合同。
6. 在现有注册表、参数、Provider 请求及计费测试中补 Mini 用例，覆盖声明式约束、disabled 基础配置验证和 enabled 一致性检查，回归旧模型。
7. 完成真实生成与账单核验，记录结果后启用生产配置。

`enabled: false` 只是禁止入口与生成，不代表跳过验证。当前注册表中部分启用态检查仅针对 enabled 条目，包括 credits 必填及一致性、重复启用条目和 fallback candidate consistency。scene config、parameter maps、inputConstraints、controls、defaults、pricing、video metadata 等基础检查仍遍历整个 `MODELS`；视频 resolution controls 和计费路径检查也会涉及 disabled 条目，部分子规则另有启用态条件，不能概括为所有检查都完全相同。生产启用前仍需在本地测试或隔离联调环境中执行启用态测试和真实联调，不能仅凭 disabled 状态下基础检查通过就认定满足发布条件。

如增加用户可见的选项、提示或错误信息，同步检查 `src/config/locale/messages/en/ai/video.json` 和 `src/config/locale/messages/zh/ai/video.json`。基础模型英文品牌名可沿用现有 label 机制。

## 8. 验收要求

| 验收项   | 通过标准                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 模型注册 | Mini 只在已启用的 scene 中出现；Kie 未配置时不展示可用模型                                                                                                                  |
| 请求映射 | 精确 model ID；发送 duration；首帧、首尾帧、参考图分别映射；false 不丢失                                                                                                    |
| 输入约束 | imageInputRequired=true 触发通用规则；缺失模式 / 素材、非法或不在允许列表的模式、越界数量必须拒绝；复用 assertVideoImageInput，不回退 image_urls；options.ts 无具体模型特判 |
| 音频开关 | Mini UI 展示现有音频开关且默认关闭；选择 generate_audio=true 后最终参数及上游请求为 true；本站不新增音频计费维度；旧模型音频 controls 不变 |
| 配置验证 | disabled 条目的基础配置仍受验证；imageInputRequired 类型与模式配置有效；字段缺省或为 false 时旧模型保持原行为，Mini 文生不受图生必填规则影响                                |
| 发布条件 | 价格和 duration 范围未确认时 Mini 保持 disabled，不填猜测值；基础配置验证通过后，启用前仍完成启用态一致性测试和真实联调                                                     |
| Callback | Mini 复用现有 callback 参数与轮询链路，无模型专属 callback 分支                                                                                                             |
| 积分     | 各开放分辨率与时长的前端预估、后端扣费、任务记录一致；未定价规格不可生成                                                                                                    |
| 任务完成 | 上游任务能通过轮询到达终态；视频可预览、下载；启用转存时确认持久化结果                                                                                                      |
| 失败处理 | 创建失败、上游失败、查询异常分别验证；重复查询不重复退款                                                                                                                    |
| 回归     | Fast、Standard、H3 原有请求字段、controls、credits 和 pricing 均不因 Mini 改动漂移                                                                                          |

实施后运行以下现有检查；命令列于方案中不代表本次已经执行：

```bash
pnpm test:video-contract
pnpm exec tsx scripts/test-calculate-model-credits.ts
pnpm exec tsc --noEmit
```

`test:video-contract` 已包含注册表、最终参数和视频图片输入测试。它不等于真实上游验收；补充 Mini 请求断言后，还需至少覆盖文生、首帧、首尾帧和参考图片的真实生成，并比较上游账单。修改了共享审核路径时再运行对应审核测试。

回滚优先将 Mini 各条目设为 `enabled: false` 后发布，停止新任务创建；保留 Provider 查询和历史任务展示，使已提交任务仍能完成或被手动刷新。

## 9. 完整参考能力的后续扩展

完整多模态属于独立增量：现有 `SCENE_INPUT_OPTIONS` 不支持图、视频、音频混合输入，也没有音频 URL 安全校验。参考图片数量同时受到前端和后端限制，不能只增大上传组件的上限。

扩展时按模型声明输入数量、格式、大小和时长，前后端共用约束；校验公开 URL 并取得可信媒体信息。混合参考需要按真实输入确定计费口径，不能把带视频素材的请求放进无视频定价场景。参考视频单 URL 可先沿现有 `video-to-video` 接入，但仍需确认输入时长、成本和上游接受规则。

未来提炼模型接入 Skill 时，保留以下可复用步骤：官方合同核对 → 当前架构定位 → 参数映射 → 定价同步 → 最小实现 → 请求与计费验证 → 真实任务验收 → 启用与回滚。模型 ID、价格、项目路径和输入限制应作为项目实例资料，不硬编码进通用流程。

## 10. 当前待定与验证状态

- V1 发布前待确认：Mini 精确时长范围、本站默认规格与无视频输入 / 音频关闭的单价；确认前保持 `enabled: false`，不以假配置代替待定项。若官方存在 `-1` 等特殊时长值，V1 不开放，只采用可明确计费的数字秒数。
- 后续扩展再确认：音频开启是否产生额外成本、视频输入计费口径、扩展字段默认值；在账单确认前本站不新增音频计费维度。
- 评审已确定：V1 仅文生与三种图片模式；Mini 音频开关对客户开放且默认关闭；不增加 Mini callback 分支；通过 imageInputRequired 声明式配置仅收紧 Mini 图生合同；通用层不硬编码型号，不调整旧模型 credits。
- 验证口径：disabled 条目仍接受基础配置检查，发布前另行验证启用态一致性与真实生成链路。
- 已完成：官方页面与当前关键代码交叉检查，形成实施方案。
- 尚未执行：业务代码修改、API 付费调用、真实账单验证、生产启用和部署。
