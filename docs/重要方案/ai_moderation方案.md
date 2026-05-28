# AI 生成流程内容安全检测接入方案（保守版）

## 0. 审核结论

原方案方向是对的，但首版范围明显偏重：独立 Moderation Service、人工审核后台、用户风控画像、多供应商 fallback、结果隔离区、合规报表都不是当前生成链路接入内容安全的必要前置条件。

本项目第一版建议只做一件事：在 `/api/ai/generate` 调用真实 AI provider 之前，对用户输入做前置审核，违规则直接拒绝，不创建任务、不扣积分。

这样收益最大、入侵最小：

- 保护支付渠道和平台合规的核心风险点：用户提交违规生成请求。
- 不改现有 provider 抽象、模型注册表、候选模型 fallback、任务表、积分表。
- 不新增后台、不新增数据库表、不引入人工审核队列。
- 出问题时可以通过配置关闭或 fail closed，不影响已有 AI provider 代码。

## 1. 首版范围

### 必做

1. 接入 Sightengine 作为主审核服务。
2. 生成前审核 `prompt`。
3. 生成前审核 `options.image_input` 中的参考图 URL。
4. 对音乐自定义模式额外审核 `options.title`、`options.style`、`options.lyrics`。
5. 审核失败时返回统一安全提示。
6. 审核必须发生在 `aiProvider.generate()` 和 `createAITask()` 之前，保证违规请求不会扣积分。
7. 设置短超时，避免外部审核服务拖慢生成接口。

### 暂不做

这些不是第一版必要范围，先不要做：

- 不新建 `/moderation/*` API。
- 不做独立微服务。
- 不做人工审核后台。
- 不做 `moderation_logs` 数据库表。
- 不做用户风险评分表。
- 不做 Wavespeed fallback。
- 不做复杂规则引擎。
- 不做生成结果隔离区和 CDN 搬运流程。
- 不改前端生成流程。

生成结果复检是有价值的，但当前 `/api/ai/query` 每次轮询都会查 provider，结果复检如果没有任务级缓存，会引入重复审核、状态处理和退款语义问题。建议作为第二阶段单独做，不混入这次前置审核。

## 2. 当前代码判断

当前生成流程在 [route.ts](/d:/project3/shipany-2/bananapro-org/src/app/api/ai/generate/route.ts) 中大致是：

```text
解析请求
校验 mediaType / model / candidates
获取用户
计算 costCredits
检查 remainingCredits
调用 aiProvider.generate()
createAITask()
  -> 创建任务
  -> consumeCredits()
返回任务
```

积分实际扣除发生在 [ai_task.ts](/d:/project3/shipany-2/bananapro-org/src/shared/models/ai_task.ts) 的 `createAITask()` 内部。只要审核放在 `aiProvider.generate()` 之前，就一定早于扣积分。

推荐插入点：

```text
检查 remainingCredits 通过
  ↓
moderateGenerationInput(...)
  ↓
aiProvider.generate(...)
  ↓
createAITask(...)
```

为什么不放在更前面：

- 未登录、参数错误、模型非法、积分不足的请求本来就不会生成，没必要浪费 Sightengine 调用。
- 审核一次即可，不要在每个候选模型 fallback 中重复审核。

## 3. 文件改动建议

### 3.1 新增 `src/extensions/moderation/sightengine.ts`

职责只做供应商适配：

- `checkText(text)` 调 Sightengine 文本审核。
- `checkImageUrl(url)` 调 Sightengine 图片 URL 审核。
- 处理 `fetch`、`AbortController` 超时、基础错误。
- 把 Sightengine 原始响应归一成项目内部结果。

建议内部返回结构保持很小：

```ts
type ModerationDecision = 'allow' | 'block';

interface ModerationResult {
  decision: ModerationDecision;
  provider: 'sightengine';
  categories: string[];
  raw?: unknown;
}
```

第一版不要引入 `review`、`rewrite`、`risk_level`、`action`、`reason_code`。没有人工审核队列时，引入这些状态只会让业务分支变复杂。

### 3.2 新增 `src/shared/services/moderation.ts`

职责做项目级编排：

- 从 `getAllConfigs()` 读取 Sightengine 配置。
- 如果未开启审核，直接 allow。
- 抽取需要审核的文本字段。
- 抽取 `options.image_input` URL。
- 调用 Sightengine adapter。
- 任一命中 block，则抛出统一错误。

建议暴露一个函数：

```ts
await moderateGenerationInput({
  userId: user.id,
  mediaType,
  scene,
  prompt: requestPrompt,
  options,
});
```

内部只处理生成入口需要的输入，不要做成通用平台风控中心。

### 3.3 修改 `src/app/api/ai/generate/route.ts`

接入点仍然只放在 `generate/route.ts` 主链路里，但 candidate fallback 需要额外收口，不能让同一请求在候选循环里重复审核：

```ts
const remainingCredits = await getRemainingCredits(user.id);
if (remainingCredits < costCredits) {
  throw new Error('insufficient credits');
}

await moderateGenerationInput({
  userId: user.id,
  mediaType,
  scene,
  prompt: requestPrompt,
  options,
});
```

不要改 `createProviderTask()` 和 `createAITask()` 的核心职责；但 candidate fallback 场景需要把输入审核移到候选循环外。同一请求在 `finalOptions` 和 pricing consistency 确认后，只审核一次，不要每个候选模型重复调用 Sightengine。

### 3.4 配置

更符合当前项目模式的改法不是改 `src/shared/models/config.ts`，而是：

- 在 [settings.ts](/d:/project3/shipany-2/bananapro-org/src/shared/services/settings.ts) 的 AI tab 增加 Sightengine 配置项。
- 在 [.env.example](/d:/project3/shipany-2/bananapro-org/.env.example) 增加环境变量示例。
- 不加入 `publicSettingNames`，因为这是服务端密钥。

注意：当前 `getAllConfigs()` 只会把 `settings.ts` 中登记过的 setting name 合并进最终配置；环境变量也是按这些 name 转成大写后读取。因此 Sightengine 配置必须先在 `settings.ts` 中声明，例如 `sightengine_moderation_enabled` 对应 `SIGHTENGINE_MODERATION_ENABLED`，否则 `.env` 中配置了也不会进入 `configs`。

建议配置项：

```env
SIGHTENGINE_MODERATION_ENABLED="false"
SIGHTENGINE_API_USER=""
SIGHTENGINE_API_SECRET=""
SIGHTENGINE_TIMEOUT_MS="3500"
SIGHTENGINE_VIDEO_TIMEOUT_MS="15000"
SIGHTENGINE_FAIL_CLOSED="true"
```

说明：

- `SIGHTENGINE_MODERATION_ENABLED=false` 方便上线前灰度和紧急回滚。
- `SIGHTENGINE_FAIL_CLOSED=true` 更符合支付渠道风控目标；审核服务异常时拒绝生成。
- `SIGHTENGINE_TIMEOUT_MS=3500` 先保守控制在 3.5 秒内，后续按真实延迟再调。
- `SIGHTENGINE_VIDEO_TIMEOUT_MS=15000` 单独给短视频同步审核使用，不要复用图片 / 文本的 3500ms。

如果第二阶段接入短视频输出审核，则 `settings.ts` 和 `.env.example` 都要同步增加 `sightengine_video_timeout_ms / SIGHTENGINE_VIDEO_TIMEOUT_MS`，不要只在 adapter 内硬编码。

## 4. 审核内容抽取规则

### 4.1 文本字段

第一版只审核这些字段：

```text
prompt
options.title
options.style
options.lyrics
options.negative_prompt
options.negativePrompt
```

不要递归审核所有 `options` 字符串。`options` 里可能有 URL、比例、分辨率、模型参数，递归扫会产生误杀和无意义调用。

空字符串跳过。多个文本字段可以合并成一次文本审核，字段之间用换行隔开。

### 4.2 图片输入

第一版只审核：

```text
options.image_input
```

兼容字符串和字符串数组：

```ts
const imageInputs = Array.isArray(options?.image_input)
  ? options.image_input
  : options?.image_input
    ? [options.image_input]
    : [];
```

只接受 `http:` / `https:` URL。非 URL 或空值直接按参数错误处理，不传给 Sightengine。

### 4.3 视频输入

当前前端视频页有 `options.video_input`。视频审核比图片更重，且 Sightengine 视频接口和结果处理会带来更多状态问题，第一版不接。

保守处理建议：

- 先审核 prompt。
- `video-to-video` 的视频输入审核列为第二阶段。
- 如果上线时 `video-to-video` 风险不可接受，临时关闭该场景，比半吊子接入视频审核更稳。

## 5. 阻断策略

第一版只有两个结果：

| 结果 | 动作 |
|---|---|
| allow | 继续进入 `aiProvider.generate()` |
| block | 抛错，直接返回前端，不创建任务，不扣积分 |

用户提示统一为：

```text
This request violates our content safety policy. Please revise it and try again.
```

如果需要中文提示，可以统一为：

```text
该请求违反平台内容政策，无法生成。请修改为安全、合规的内容。
```

当前项目的 `respErr()` 顶层 `code` 是数字 `-1`，不要在第一版为了 `CONTENT_POLICY_VIOLATION` 直接把响应协议改成字符串 code。更保守的实现是先统一 `message`；如果后续需要业务错误码，可以扩展 `respErr()` 支持额外 `data` 或独立错误类型，再返回：

```json
{
  "code": -1,
  "message": "该请求违反平台内容政策，无法生成。请修改为安全、合规的内容。",
  "data": {
    "reason": "CONTENT_POLICY_VIOLATION"
  }
}
```

不要把具体命中类别、关键词、分数返回给用户，避免帮助绕过审核。

服务端可以记录脱敏日志：

```ts
console.warn('generation moderation blocked', {
  userId,
  mediaType,
  scene,
  provider: result.provider,
  categories: result.categories,
});
```

不要打印原始 prompt、lyrics、图片 URL 中的完整敏感信息。需要排查时最多记录 hash。

## 6. Sightengine 接入要点

按官方文档，Sightengine 支持文本审核和图片审核：

- 文本审核接口使用 `https://api.sightengine.com/1.0/text/check.json`。
- 图片审核接口使用 `https://api.sightengine.com/1.0/check.json`。
- 鉴权参数使用 `api_user` 和 `api_secret`。
- 文本可使用 `mode=rules,ml`。
- 图片可组合多个视觉模型，具体模型名以账号和官方文档为准。

第一版建议在 adapter 里集中配置默认模型，不散落在 route 里：

```ts
const DEFAULT_IMAGE_MODELS = [
  'nudity-2.1',
  'gore-2.0',
  'weapon',
  'violence',
  'offensive',
  'text-content',
];
```

如果实际账号推荐使用 `text-content-2.0`，只改 adapter 常量，不改业务流程。

文本结果和图片结果不要让业务层直接依赖供应商原始字段。adapter 内部做一次简单归一：

```text
Sightengine raw response
  -> categories[]
  -> allow / block
```

## 7. Wavespeed 的位置

Wavespeed 的 content moderator 可以作为后续备选，但不放进第一版。

原因：

- 当前项目实际 AI provider 主要通过 `kie/fal/replicate/gemini` 抽象接入，并没有 Wavespeed provider。
- 为了备用审核单独接 Wavespeed，会新增认证、调用、状态、计费和错误处理分支。
- 第一版风险收益比不如 Sightengine 单供应商前置审核。

后续只有在满足以下条件时再考虑：

- 已经接入 Wavespeed 作为 AI provider。
- Sightengine 成本或可用性成为问题。
- 已有统一的 moderation result 缓存和日志。

### 7.1 后续多供应商扩展：工厂 + 适配器模式

如果后续决定接入 Wavespeed，不建议直接在 `src/shared/services/moderation.ts` 里继续加 `if provider === 'wavespeed'` 分支。当前 `moderation.ts` 已经把 Sightengine 的配置读取、缺配置告警、失败日志、文本 / 图片 / 视频调用都写在业务编排层；再硬塞第二个供应商，会让这个文件变成“双 provider 硬编码”，后续第三个供应商会继续恶化。

更合适的做法是先补一层轻量的工厂 + 适配器模式，不需要建设完整 `ModerationManager`，也不需要引入独立服务。边界保持很小：

```text
src/shared/services/moderation.ts
  -> 只负责业务编排、配置读取、输入/输出 URL 抽取、fail closed、统一错误

src/extensions/moderation/index.ts
  -> 根据配置创建具体 provider

src/extensions/moderation/types.ts
  -> 定义项目内部统一接口和统一返回值

src/extensions/moderation/sightengine.ts
  -> 只负责 Sightengine API 调用和结果归一化

src/extensions/moderation/wavespeed.ts
  -> 只负责 Wavespeed API 调用、轮询和结果归一化
```

建议的公共类型：

```ts
export type ModerationProviderName = 'sightengine' | 'wavespeed';

export type ModerationDecision = 'allow' | 'block';

export interface ModerationResult {
  decision: ModerationDecision;
  provider: ModerationProviderName;
  categories: string[];
  raw?: unknown;
}

export interface ModerationProvider {
  readonly name: ModerationProviderName;

  checkText?(text: string): Promise<ModerationResult>;
  checkImageUrl?(url: string, text?: string): Promise<ModerationResult>;
  checkVideoUrl?(url: string, text?: string): Promise<ModerationResult>;
}
```

`sightengine.ts` 和 `wavespeed.ts` 都实现 `ModerationProvider`。业务层不要再 import `checkText / checkImageUrl / checkVideoUrlSync` 这类具体供应商函数，而是只拿到统一 provider 后调用：

```ts
const provider = createModerationProvider(configs);

await provider.checkText?.(text);
await provider.checkImageUrl?.(imageUrl);
await provider.checkVideoUrl?.(videoUrl);
```

14B 之后的工厂函数可以保持简单，不需要状态管理。14A 阶段的工厂只需要返回 Sightengine provider，不读取 `moderation_provider`：

```ts
export function createModerationProvider(configs: Configs): ModerationProvider | undefined {
  const providerName = configs.moderation_provider || 'sightengine';

  if (providerName === 'wavespeed') {
    return createWavespeedModerationProvider({
      apiKey: configs.wavespeed_api_key,
      timeoutMs: parseTimeoutMs(configs.wavespeed_timeout_ms, 3500),
      videoTimeoutMs: parseTimeoutMs(configs.wavespeed_video_timeout_ms, 30000),
      pollIntervalMs: parseTimeoutMs(configs.wavespeed_poll_interval_ms, 1000),
    });
  }

  return createSightengineModerationProvider({
    apiUser: configs.sightengine_api_user,
    apiSecret: configs.sightengine_api_secret,
    timeoutMs: parseTimeoutMs(configs.sightengine_timeout_ms, 3500),
    videoTimeoutMs: parseTimeoutMs(configs.sightengine_video_timeout_ms, 15000),
  });
}
```

注意这里的 `parseTimeoutMs()` 如果继续放在 `moderation.ts`，就不要让 `index.ts` 直接依赖它；可以把通用配置解析放到 `src/extensions/moderation/config.ts`，或者让工厂只接收已经解析好的配置。不要为了一个小工厂制造跨层循环依赖。

等进入 14B、真正新增 Wavespeed provider 时，再把配置从供应商开关扩展成通用开关 + provider 选择。14A 只做 Sightengine 行为保持型重构，不做配置迁移：

```env
MODERATION_ENABLED="false"
MODERATION_PROVIDER="sightengine"
MODERATION_FAIL_CLOSED="true"

SIGHTENGINE_API_USER=""
SIGHTENGINE_API_SECRET=""
SIGHTENGINE_TIMEOUT_MS="3500"
SIGHTENGINE_VIDEO_TIMEOUT_MS="15000"

WAVESPEED_API_KEY=""
WAVESPEED_TIMEOUT_MS="3500"
WAVESPEED_VIDEO_TIMEOUT_MS="30000"
WAVESPEED_POLL_INTERVAL_MS="1000"
```

14B 做配置扩展时，为了兼容已有部署，可以做一次过渡：

- 如果 `MODERATION_ENABLED` 未配置，则回退读取 `sightengine_moderation_enabled`。
- 如果 `MODERATION_FAIL_CLOSED` 未配置，则回退读取 `sightengine_fail_closed`。
- 如果 `MODERATION_PROVIDER` 未配置，则默认 `sightengine`，保持现有行为。
- 后台 settings 新增 `basic_moderation` 分组放通用开关和 provider 选择，Sightengine / Wavespeed 各自只放密钥、模型和超时。

Wavespeed adapter 的难点不在文本和图片，而在视频。当前业务层需要的是异步函数 `checkVideoUrl()`，不要把接口命名成 `checkVideoUrlSync()`；如果供应商底层需要 prediction + polling，轮询应该封装在 `wavespeed.ts` 内部。业务层只关心 Promise 最终返回 `allow/block`，并继续使用统一的 fail closed 策略。

Wavespeed 当前 content-moderation 分类下可作为候选的模型有 5 个，后续设计 adapter 时应把它们作为同一个供应商下的可配置 model，而不是拆成 5 个 provider：

| 模型 | 输入 | 输出倾向 | 建议用途 |
|---|---|---|---|
| `wavespeed-ai/content-moderator/text` | `text`，`enable_sync_mode` | 文档以 prediction 输出为主，需保守解析 `data.outputs[0]` | 成本优先的文本审核候选 |
| `wavespeed-ai/content-moderator/image` | `image`，可选 `text`，`enable_sync_mode` | 文档以 prediction 输出为主，需保守解析 `data.outputs[0]` | 成本优先的图片审核候选 |
| `wavespeed-ai/molmo2/text-content-moderator` | `text`，`enable_sync_mode` | JSON boolean 分类：`harassment / hate / sexual / sexual/minors / violence` | 更适合作为第一版 Wavespeed 文本 adapter 默认模型 |
| `wavespeed-ai/molmo2/image-content-moderator` | `image`，可选 `text`，`enable_sync_mode` | JSON boolean 分类：`harassment / hate / sexual / sexual/minors / violence` | 更适合作为第一版 Wavespeed 图片 adapter 默认模型 |
| `wavespeed-ai/molmo2/video-content-moderator` | `video`，可选 `text` | JSON boolean 分类：`harassment / hate / sexual / sexual/minors / violence` | 视频输出复检候选，但 adapter 内部必须处理 prediction polling |

建议 Wavespeed 配置不要只给一个固定模型，而是把 text / image / video 拆开：

```env
WAVESPEED_TEXT_MODEL="wavespeed-ai/molmo2/text-content-moderator"
WAVESPEED_IMAGE_MODEL="wavespeed-ai/molmo2/image-content-moderator"
WAVESPEED_VIDEO_MODEL="wavespeed-ai/molmo2/video-content-moderator"
```

这样可以先用 Molmo2 系列获得更稳定的结构化分类输出；如果后续成本压力明显，再把 text / image 切到 `content-moderator/text` 或 `content-moderator/image`。不建议第一版 Wavespeed adapter 同时混用普通模型和 Molmo2 模型做 fallback，否则会引入第二层供应商内 fallback、重复计费和结果冲突问题。

Wavespeed 归一化规则建议：

- 如果 `outputs[0]` 是对象，直接从对象里收集值为 `true` 的风险类别。
- 如果 `outputs[0]` 是字符串，先尝试按 JSON 字符串解析；解析失败则按供应商返回结构异常处理。
- 如果 prediction 结果迟迟不是 `completed`，或者状态是失败 / 取消 / 超时，交给统一 `fail closed` 策略处理。
- 不要把 Wavespeed 的原始 category 名直接返回给前端；只用于服务端日志和内部 `categories`。

推荐落地顺序按第 14 节拆三轮执行：

1. 14A：先抽 `types.ts`，改造 Sightengine，实现只返回 Sightengine 的工厂，保持旧配置和旧行为不变。
2. 14B：再新增 `moderation_enabled / moderation_provider / moderation_fail_closed` 通用配置，并接入 Wavespeed text/image。
3. 14C：最后补 Wavespeed video，让 adapter 内部处理 polling、超时和异常状态。

这个模式的目标不是为了抽象而抽象，而是把“业务闸门”和“供应商协议”拆开。`moderation.ts` 继续表达项目规则：什么时候审核、审核哪些字段、block 后如何返回、是否 fail closed；各 provider adapter 只表达供应商 API：怎么鉴权、怎么提交、怎么解析、怎么归一化。

## 8. 失败策略

首版建议：

| 场景 | 策略 |
|---|---|
| 审核未开启 | 直接 allow |
| 审核已开启但 API user/secret 缺失 | 根据 `SIGHTENGINE_FAIL_CLOSED` 处理，默认 block，并打印一次配置告警 |
| Sightengine 返回违规 | block |
| Sightengine 超时 | 根据 `SIGHTENGINE_FAIL_CLOSED`，默认 block |
| Sightengine 5xx / 网络错误 | 根据 `SIGHTENGINE_FAIL_CLOSED`，默认 block |
| 单张参考图违规 | block 整个请求 |

默认 `fail closed` 是为了合规稳定，不是为了体验最优。只有审核未开启时才直接放行；只要审核开关已开启，密钥缺失、超时、网络异常都应遵守 `SIGHTENGINE_FAIL_CLOSED`。上线初期如果误杀或外部服务不稳定，可以临时关闭 `SIGHTENGINE_MODERATION_ENABLED`。

## 9. 最小测试清单

至少覆盖这些用例：

1. 审核关闭时，生成流程保持原行为。
2. prompt 命中 block 时，不调用 `aiProvider.generate()`。
3. prompt 命中 block 时，不调用 `createAITask()`，不扣积分。
4. `options.image_input` 为数组时，每张图都会审核。
5. 任一参考图 block 时，整个请求 block。
6. Sightengine 超时时，`SIGHTENGINE_FAIL_CLOSED=true` 会 block。
7. 音乐 custom mode 下，`title/style/lyrics` 会被审核。
8. candidate fallback 场景只审核一次，不按候选模型重复审核。

## 10. 远期候选池（附录，非当前项目第二阶段范围）

以下只是远期候选项，不属于当前项目第一版或第二阶段 2A/2B 的执行范围，Codex 落地时不要实现。

第一版稳定后，其它项目可以再按实际风险补：

1. 在未来需要审计、误杀复盘、统计或跨任务复用时，再设计轻量 `moderation_logs` 或更完整的审核缓存机制；轻量表只存 hash、用户、类别、决策、时间，不存原文和原始 URL。
2. 对 `video_input` 做视频审核。
3. 对公开 showcase 发布前做结果审核。
4. 当审核量和误杀数据足够后，再考虑 review 状态、人工后台、用户风险分。
5. 需要成本或可用性优化时，再评估 Wavespeed 作为备用。

## 11. 最终推荐方案

首版落地顺序：

1. 新增 Sightengine adapter。
2. 新增 `moderateGenerationInput()`。
3. 在 `generate/route.ts` 的积分检查后、provider 调用前接入。
4. 增加 `.env.example` 和后台 AI settings 配置。
5. 加最小单元测试或 mock 测试。

明确不做大重构。这个方案的边界是“生成前输入安全闸门”，不是一次性建设完整 Trust & Safety 平台。

## 12. 第二阶段：输出结果复检

上面第 10 节只是远期候选池，方便其它项目继续参考，不属于当前项目第二阶段执行范围。当前项目第二阶段建议收敛为轻量同步版：**2A 图片输出同步审核 + 2B 短视频输出同步审核**。

输入审核只能证明用户提交的 `prompt`、参考图和部分文本字段没有明显违规，不能证明 AI provider 生成出来的图片 / 视频一定安全。第二阶段的核心边界是：**服务端在返回 `success + taskInfo/taskResult` 之前，必须先审核输出图片 / 视频；allow 才返回结果，block 则不暴露原始 output URL。**

### 12.1 第二阶段目标

1. 继续保留第一版的 `moderateGenerationInput()`，不回滚、不重写。
2. 输出复检覆盖两条成功路径：`/api/ai/generate` 中 provider 同步返回 `success`，以及 `/api/ai/query` 中 provider 轮询返回 `success`。
3. 图片输出走同步 `checkImageUrl()`。
4. 当前短视频输出走同步 `checkVideoUrlSync()`，不接 Sightengine async callback。
5. 只新增一个业务状态：`moderation_blocked`。
6. 任务终态短路作为 MVP 缓存：已经 `success / failed / canceled / moderation_blocked` 的任务直接返回本地记录，不再查 provider，也不再重复审。

### 12.2 推荐接入位置

第二阶段不是只改 `/api/ai/query`。当前 `generate/route.ts` 会把 provider 返回的 `taskInfo/taskResult` 写入 task 并直接返回；前端也会在生成接口返回 `SUCCESS` 时直接解析展示图片 / 视频。因此输出审核必须拦在所有“服务端返回成功结果”之前。

推荐主流程：

```text
provider generate/query 返回 success
  ↓
extractGenerationOutputUrls(...)
  ↓
moderateGenerationOutput(...)
  ↓
allow -> 写入 success + 原始 taskInfo/taskResult，返回给前端
block -> 写入 moderation_blocked + 脱敏错误信息，不返回原始 output URL
```

`/api/ai/query` 还要先补终态短路：

```text
findAITaskById(taskId)
  ↓
如果 status 是 success / failed / canceled / moderation_blocked
  ↓
直接返回本地 task，不再请求 provider
```

这就是第二阶段的缓存策略。先不建新表，不为极端并发重复审核引入额外复杂度。

### 12.3 输出 URL 抽取规则

不要把前端组件里的 `extractImageUrls()` / `extractVideoUrls()` 直接复制到 route 里。建议在服务端新增一个小工具，例如：

```ts
extractGenerationOutputUrls({
  mediaType,
  taskInfo: result.taskInfo,
  taskResult: result.taskResult,
});
```

第二阶段首版先保守：优先只信任 provider 已规范化后的 `taskInfo` 主输出字段。

图片输出优先从这些位置抽取：

```text
taskInfo.images[].imageUrl
```

视频输出优先从这些位置抽取：

```text
taskInfo.videos[].videoUrl
```

`taskResult` 只作为 provider 已知结构的浅层 fallback，例如已确认的 `output`、`images`、`videos`、`video` 字段。不要递归扫描原始响应，不要从任意 `data` 字段里泛化抽取 URL，避免把 input URL、thumbnail、metadata 或供应商内部字段误当成主输出。

第二阶段首版只审核主输出 URL。视频 `thumbnailUrl` 暂不单独处理，后续如果缩略图进入公开展示或下载链路，再作为独立补充。

对于 image / video 任务，如果 provider 返回 `success`，但 `extractGenerationOutputUrls()` 没有抽到任何主输出 URL，不应跳过审核后直接返回 `success`。应按异常结果处理：不要返回原始 `taskResult`，可写入 `failed` 或保持原有错误流程，并记录脱敏日志。只有明确抽到主输出 URL 且审核 allow，才允许返回 `success`。这类情况属于 provider 返回结构异常，不属于 `moderation_blocked`。

多张图片或多个视频的处理先保守：**任一输出命中 block，整条任务都 block**。不要第一轮就做 partial success，否则前端展示、下载和计费语义都会变复杂。

### 12.4 输出审核服务函数

建议在 `src/shared/services/moderation.ts` 里新增第二个编排函数，不要把输出逻辑塞进 `moderateGenerationInput()`：

```ts
await moderateGenerationOutput({
  taskId: task.id,
  userId: task.userId,
  mediaType: task.mediaType,
  scene: task.scene,
  outputUrls,
});
```

内部职责保持很小：

- 读取 Sightengine 配置。
- 按 `mediaType` 区分 image / video。
- 图片调用 `checkImageUrl()`。
- 短视频调用 `checkVideoUrlSync()`。
- 命中 block 时抛出和第一版一致的 `ContentPolicyViolationError`。
- 只记录脱敏日志和 hash，不记录完整 prompt、lyrics、output URL。

adapter 层继续隔离供应商差异。业务层只接收统一的 `allow/block + categories`，不要依赖 Sightengine 原始字段。

### 12.5 图片输出同步审核

图片输出可以作为第二阶段 2A 先跑通，收益最大、复杂度最低。

推荐策略：

- provider 返回 `success` 后，先抽取所有图片 URL。
- 每张图片调用 `checkImageUrl()`。
- 所有图片 allow 后，才把 `taskInfo/taskResult` 写入 `success` 并返回给前端。
- 任一图片 block，则写入 `moderation_blocked`，并只保存脱敏错误信息。

注意：审核的 URL 应该是最终会返回给用户的 URL。如果 provider query 里已经做了自有 storage 搬运，就审搬运后的 URL；如果返回的是 provider 临时 URL，就审这个临时 URL，并确保 Sightengine 能访问。

### 12.6 短视频输出同步审核

当前项目视频主要是短视频：`text-to-video / image-to-video` 支持 4-15s，`video-to-video` 是 5/10s。因此第二阶段 2B 可以和图片同一轮排期做，但只做同步 MVP。

推荐策略：

- provider 返回 `success` 后，先抽取所有视频 URL。
- 每个视频调用 `checkVideoUrlSync()`。
- 使用单独配置 `SIGHTENGINE_VIDEO_TIMEOUT_MS`，不要复用文本 / 图片的 3500ms。
- 超时、网络错误、Sightengine 异常继续遵守 `SIGHTENGINE_FAIL_CLOSED`。
- 所有视频 allow 后，才把 `taskInfo/taskResult` 写入 `success` 并返回给前端。
- 任一视频 block，则写入 `moderation_blocked`，并只保存脱敏错误信息。

不要让视频先 `success` 返回，再靠前端隐藏或后续后台删除。那样用户已经可能下载或分享，内容安全闸门就失效了。

### 12.7 阻断状态和积分语义

输出审核 block 和 provider 生成失败不是同一种失败。第二阶段只新增：

```text
moderation_blocked
```

暂不新增：

```text
moderating
```

原因：

- `failed` 在当前 `updateAITaskById()` 里会触发积分退回逻辑。
- 输出审核 block 时，provider 实际已经生成并产生成本，是否退积分是产品策略，不应该被 `failed` 的通用退款逻辑隐式决定。
- 同步审核不需要 `moderating`；它是异步视频 callback 才真正需要的状态。

默认建议：输出 block 不自动退款。后续如果出于体验要补偿用户，单独设计“输出审核拦截补偿”策略，不要复用 provider failed 的自动退款路径。

对于 `/api/ai/generate` 同步返回 `success` 但输出审核 block 的情况，如果沿用“输出 block 不自动退款”的策略，也应创建一条 `moderation_blocked` 任务并正常记录 `creditId`，但 `taskInfo/taskResult` 只能保存脱敏错误信息，不能保存 provider 原始输出 URL。不要因为 block 发生在 `createAITask()` 之前，就直接返回错误并跳过扣费，除非产品策略明确改成“同步输出拦截不扣积分”。

返回给用户的提示继续统一：

```text
This generated result violates our content safety policy and cannot be displayed. Please revise your prompt and try again.
```

不要返回命中类别、分数、帧位置或原始 URL。`moderation_blocked` 任务的 `taskInfo/taskResult` 也不要保存 provider 原始结果，避免后续接口误把 URL 暴露出去。

### 12.8 第二阶段暂不做

这些不要混进第二阶段第一轮：

- 不做 `moderation_logs`。
- 不做 `moderating` 状态。
- 不做 Sightengine async callback。
- 不做人工审核后台。
- 不做复杂用户风险评分。
- 不做历史任务全量回扫。
- 不做多供应商审核 fallback。
- 不把输出文件搬进隔离 CDN 再二次发布。
- showcase 保存闸门放到最后单独处理，不混进主链路第一轮返修。
- 不把具体违规类别返回给用户。

本阶段主链路先封住 generate/query 返回路径。showcase 入口放最后做独立收尾：若 `/api/showcases/add` 在生产环境仍开放，应二选一：禁用该入口，或单独给保存入口补图片审核。不要为了 showcase 提前扩大本阶段的实现范围。

第二阶段要先把主链路封住：**输入审过只是第一道门，输出审过才允许展示。**

## 13. 当前返修优先级

当前不要把所有可优化项都塞进同一轮。本节只服务一个目标：让当前 Sightengine 输入审核 + 输出审核主链路稳定提交。

1. 修正 candidate fallback 重复输入审核。

   当前 `moderateGenerationInput()` 如果还在候选模型循环里，provider fallback 失败后会重复审核同一请求。应先把所有候选的 `finalOptions`、URL 安全校验和 pricing consistency 校验收敛完成，再对同一请求审核一次，然后进入候选 provider 调用循环。

2. 验收输出审核主链路。

   输出审核只需要覆盖 `/api/ai/generate` 同步成功路径和 `/api/ai/query` 轮询成功路径。验收重点是：allow 后才返回图片 / 视频 URL；block 后写入 `moderation_blocked`；`taskInfo/taskResult` 不保存原始 output URL；终态任务再次 query 不再请求 provider，也不重复审核；`/api/ai/query` 在 `status / taskInfo / taskResult` 任一变化时都会落库。


第二阶段最小验收标准：

- candidate fallback 场景同一请求只调用一次输入审核。
- provider 在 `/api/ai/generate` 或 `/api/ai/query` 返回图片 / 视频成功时，输出 allow 后前端才能看到 URL。
- 任一输出 block 时，任务进入 `moderation_blocked`，前端看不到原始 output URL。
- `moderation_blocked` 不会误走 provider failed 的自动退款逻辑。
- 同一终态任务再次轮询时，不会重复请求 provider，也不会重复调用审核服务。

## 14. 第三阶段：工厂 + 适配器与 Wavespeed

第三阶段不是当前返修的一部分。它承接第 7 节的 Wavespeed 判断，也依赖第 13 节的主链路返修先完成。只有在 Sightengine 输入审核、输出审核、`moderation_blocked`、query 终态短路和 candidate fallback 单次审核都稳定后，再进入这一阶段。

第三阶段拆成三轮，不要一次性完成工厂重构、配置迁移、Wavespeed text/image 和 Wavespeed video。每一轮都必须保持上一轮行为可验证。

### 14A 行为保持型重构：只做 Sightengine provider 抽象

14A 的目标是把当前 Sightengine-only 审核实现收口成 `ModerationProvider` 接口，但不改变业务语义，不新增 Wavespeed 运行逻辑，也不迁移到通用配置。

14A 执行范围：

1. 把业务层使用的 `checkVideoUrlSync()` 改成 `checkVideoUrl()`；Sightengine adapter 内部仍然走同步视频接口。
2. 新增 `src/extensions/moderation/types.ts`，放 `ModerationProviderName`、`ModerationResult`、`ModerationProvider`。
3. 改造 `sightengine.ts`，让它实现 `ModerationProvider`，输出行为保持不变。
4. 新增 `src/extensions/moderation/index.ts` 或 `factory.ts`，提供只返回 Sightengine provider 的工厂函数。
5. 改 `moderation.ts`，只通过 provider 接口调用 `checkText / checkImageUrl / checkVideoUrl`。
6. 继续使用现有 `sightengine_moderation_enabled / sightengine_fail_closed / sightengine_*` 配置，不新增 `MODERATION_PROVIDER`、`MODERATION_ENABLED`、`MODERATION_FAIL_CLOSED`。

14A 验收标准：

- Sightengine 输入审核和输出审核行为与重构前一致。
- `moderation.ts` 不直接 import `@/extensions/moderation/sightengine`。
- `MODERATION_PROVIDER` 还不存在，也不影响现有部署。
- `ContentPolicyViolationError`、`moderation_blocked`、fail closed 语义保持不变。
- 如果当前 provider 没有 `checkVideoUrl`，视频输出审核不能静默放行，应继续按 fail closed 策略处理。

### 14B 新增 Wavespeed text/image

14B 在 14A 跑通后再做。这个阶段才新增通用配置和 Wavespeed adapter，但只接文本和图片，不接视频，不做自动 fallback。

14B 轻量设计目标：

- 让业务层仍然只调用 `ModerationProvider.checkText()` / `checkImageUrl()`，不感知 Wavespeed 的 prediction 协议。
- 只补一条新的 provider 分支：`moderation_provider=wavespeed`。
- 文本和图片使用 Molmo2 默认模型，优先解析结构化 JSON boolean 输出。
- 如果 Wavespeed 返回普通 `content-moderator/*` 风格输出，也只在 adapter 内做保守兼容，不把解析细节泄漏到业务层。

14B 执行范围：

1. 新增 `moderation_enabled / moderation_provider / moderation_fail_closed` 通用配置。
2. `moderation_enabled` 未配置时，回退读取 `sightengine_moderation_enabled`。
3. `moderation_fail_closed` 未配置时，回退读取 `sightengine_fail_closed`。
4. `moderation_provider` 未配置时，默认 `sightengine`，保持旧行为。
5. 新增 `wavespeed.ts`，实现 `checkText / checkImageUrl`。
6. Wavespeed 默认使用 Molmo2 text/image content moderator。
7. Wavespeed adapter 即使开启 `enable_sync_mode`，也必须兼容 prediction id + polling。

14B 建议配置：

```env
MODERATION_ENABLED="true"
MODERATION_PROVIDER="wavespeed"
MODERATION_FAIL_CLOSED="true"

WAVESPEED_API_KEY=""
WAVESPEED_TEXT_MODEL="wavespeed-ai/molmo2/text-content-moderator"
WAVESPEED_IMAGE_MODEL="wavespeed-ai/molmo2/image-content-moderator"
WAVESPEED_REQUEST_TIMEOUT_MS="30000"
WAVESPEED_POLL_INTERVAL_MS="1000"
```

配置读取规则：

- `MODERATION_ENABLED / MODERATION_PROVIDER / MODERATION_FAIL_CLOSED` 放进 `settings.ts` 的通用审核分组。
- `WAVESPEED_API_KEY / WAVESPEED_TEXT_MODEL / WAVESPEED_IMAGE_MODEL / WAVESPEED_REQUEST_TIMEOUT_MS / WAVESPEED_POLL_INTERVAL_MS` 放进 Wavespeed 分组。
- `MODERATION_PROVIDER` 只允许 `sightengine | wavespeed`；非法值按配置错误处理，并交给统一 fail closed。
- 14B 不新增 `WAVESPEED_VIDEO_MODEL` 的运行依赖；即使 `.env` 提前配置，也不在 14B 调用视频模型。
- 旧的 `sightengine_moderation_enabled / sightengine_fail_closed` 只作为通用配置缺失时的过渡 fallback，不反向覆盖通用配置。

14B adapter 结构：

```ts
export function createWavespeedModerationProvider(options: {
  apiKey: string;
  textModel: string;
  imageModel: string;
  requestTimeoutMs: number;
  pollIntervalMs: number;
}): ModerationProvider;
```

`wavespeed.ts` 内部建议拆 4 个小函数：

- `submitPrediction(model, payload)`：POST `https://api.wavespeed.ai/api/v3/${model}`，使用 `Authorization: Bearer ${WAVESPEED_API_KEY}`。
- `pollPrediction(requestId)`：GET `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`，直到 `completed`、失败状态或超时。
- `resolvePredictionOutput(response)`：兼容同步返回和轮询返回，只返回 `data.outputs[0]` 或抛出结构异常。
- `normalizeWavespeedOutput(output)`：把供应商输出归一成项目内的 `ModerationResult`。

14B 请求参数：

```ts
// checkText(text)
{
  text,
  enable_sync_mode: true,
}

// checkImageUrl(imageUrl, text?)
{
  image: imageUrl,
  text, // 可选，有 prompt 或业务上下文时才传
  enable_sync_mode: true,
}
```

`enable_sync_mode: true` 只是降低文本 / 图片的轮询概率，不是协议保证。adapter 必须同时支持：

- 直接返回 `data.outputs[0]`。
- 返回 prediction id，需要继续 polling。
- 返回 completed 但 `outputs[0]` 缺失，按供应商结构异常处理。

14B 归一化规则：

- `outputs[0]` 是对象：收集值为 `true` 的风险类别，任一 true 即 `block`，全部 false 即 `allow`。
- `outputs[0]` 是字符串：先尝试 `JSON.parse()`；解析后仍按对象规则处理。
- `outputs[0]` 是 URL 或不可解析字符串：14B 不再二次下载内容解析，按结构异常处理。
- 如果真实 API smoke test 发现 `outputs[0]` 固定返回 JSON 文件 URL，则另起 14B 补丁实现受限 JSON 下载解析；下载结果仍只在服务端归一化，不记录原始响应，也不暴露给前端。
- 可识别类别只进入服务端内部 `categories`，例如 `harassment / hate / sexual / sexual/minors / violence`。
- 不把 Wavespeed 原始输出、原始类别、score、request id 返回给前端。

14B 视频边界：

- 14B 不实现 `checkVideoUrl` 的 Wavespeed 能力。
- 如果 `MODERATION_PROVIDER=wavespeed` 且业务路径触发视频输出审核，adapter 应明确返回“不支持视频审核”的 provider error，由业务层按 `MODERATION_FAIL_CLOSED` 处理。
- 不因为视频未接入就 fallback 到 Sightengine；否则 14B 会变成隐式多 provider 审核。
- provider 创建、配置校验、能力检查都应落入统一 moderation provider error 处理路径，避免 `createModerationProvider()` 异常绕过 fail closed / fail open。

14B 验收标准：

- `MODERATION_PROVIDER=sightengine` 时，行为和 14A 完全一致。
- `MODERATION_PROVIDER=sightengine` 时，不应创建或调用 Wavespeed provider。
- `MODERATION_PROVIDER=wavespeed` 时，只启用 Wavespeed 文本 / 图片审核。
- Wavespeed 不和 Sightengine 同时审核，也不做 Sightengine -> Wavespeed 自动 fallback。
- Wavespeed block 后沿用相同的 `ContentPolicyViolationError` 和 `moderation_blocked` 语义。
- Wavespeed 原始 category、score、raw response 不返回给前端。
- `MODERATION_PROVIDER=wavespeed` 且视频审核被触发时，不静默 allow，应按 fail closed 或 fail open 配置得到明确结果。
- Wavespeed API key 缺失、模型缺失、HTTP 非 2xx、prediction 失败、输出结构异常，都进入统一供应商异常路径。

### 14C Wavespeed video

14C 最后做。视频比文本 / 图片更容易出现 polling、超时、失败状态和输出解析问题，不要和 14B 同轮落地。

14C 轻量设计目标：

- 只在 14B 的 Wavespeed adapter 上补 `checkVideoUrl()`，不改业务层审核编排。
- 视频模型只用于输出 URL 复检，不做输入 prompt 文本审核替代。
- polling、超时、失败状态和输出结构解析全部封装在 `wavespeed.ts` 内部。
- 视频审核结果仍然只输出项目统一的 `allow/block/error` 语义。

14C 执行范围：

1. 在 `wavespeed.ts` 中实现 `checkVideoUrl`。
2. adapter 内部处理 prediction polling、超时、失败、取消状态。
3. 视频缺少可用审核能力时，继续遵守统一 fail closed 策略。

14C 建议新增配置：

```env
WAVESPEED_VIDEO_MODEL="wavespeed-ai/molmo2/video-content-moderator"
WAVESPEED_VIDEO_TIMEOUT_MS="120000"
WAVESPEED_VIDEO_POLL_INTERVAL_MS="2000"
```

配置读取规则：

- `WAVESPEED_VIDEO_MODEL` 为空时，`checkVideoUrl()` 返回 provider error，不放行。
- `WAVESPEED_VIDEO_TIMEOUT_MS` 单独设置，不复用 text/image 的短超时。
- `WAVESPEED_VIDEO_POLL_INTERVAL_MS` 可以默认回退到 `WAVESPEED_POLL_INTERVAL_MS`，但建议视频单独配置，避免过度频繁轮询。

14C 请求参数：

```ts
// checkVideoUrl(videoUrl, text?)
{
  video: videoUrl,
  text, // 可选，有生成 prompt 或业务上下文时才传
}
```

Molmo2 video 页面没有把 `enable_sync_mode` 作为主要输入项展示，14C 不依赖同步模式。实现时直接按异步 prediction 流程处理：

1. POST `https://api.wavespeed.ai/api/v3/${WAVESPEED_VIDEO_MODEL}`。
2. 读取返回中的 prediction id。
3. GET `https://api.wavespeed.ai/api/v3/predictions/{request_id}/result` 轮询。
4. `status=completed` 后解析 `data.outputs[0]`。
5. `failed / canceled / timeout / missing output / malformed output` 都交给统一 fail closed 策略。

14C 状态处理：

| Wavespeed 状态 | 项目处理 |
|---|---|
| `completed` 且输出可解析 | 按风险类别归一成 `allow` 或 `block` |
| `completed` 但无 `outputs[0]` | provider error |
| `failed` / `canceled` | provider error |
| 长时间 `queued` / `processing` | 超时后 provider error |
| 未知状态 | provider error，并记录脱敏日志 |

14C 归一化规则与 14B 一致：

- 任一 boolean 风险类别为 `true`，视频 block。
- 全部已知风险类别为 `false`，视频 allow。
- 输出不是对象，也不是可解析 JSON 字符串，按结构异常处理。
- `sexual/minors` 必须和其他类别一样保留在内部 categories 中，但不返回前端。

14C 与任务状态的关系：

- `/api/ai/generate` 同步成功返回视频 URL 时，必须先完成 `checkVideoUrl()`；allow 后才返回 URL。
- `/api/ai/query` 轮询到视频任务成功时，必须先完成 `checkVideoUrl()`；allow 后才落库并返回成功结果。
- block 时写入 `moderation_blocked`，`taskInfo/taskResult` 只能保存脱敏错误信息，不能保存原始视频 URL 或 Wavespeed 原始 response。
- 终态短路继续生效：已经是 `moderation_blocked` 的任务再次 query，不重复请求 Wavespeed。

14C 验收标准：

- `MODERATION_PROVIDER=wavespeed` 且视频审核开启时，视频输出 allow 后才返回 URL。
- Wavespeed video block 后进入 `moderation_blocked`，不暴露原始 output URL。
- Wavespeed video 未启用时，不影响 Sightengine 视频审核。
- Wavespeed video 超时、失败、取消、输出结构异常时，按 `MODERATION_FAIL_CLOSED` 得到一致行为。
- 同一视频任务进入终态后，再次 query 不重复调用 Wavespeed video moderator。
- 14C 不新增多 provider fallback，也不改变 14B 的 text/image 行为。

第三阶段不处理这些事项：

- 不做多 provider 同时审核。
- 不做 Sightengine -> Wavespeed 自动 fallback。
- 不做人工审核后台。
- 不做新的审核日志表。
- 不改变 `moderation_blocked` 的积分语义。
- 不把 Wavespeed 的命中类别、分数或原始响应暴露给前端。

参考文档：

- Sightengine Text Moderation: https://sightengine.com/text-moderation-api
- Sightengine Image Moderation: https://sightengine.com/docs/image-moderation-principles
- Sightengine Visual Models: https://sightengine.com/docs/models
- Sightengine Stored Video Moderation (sync): https://sightengine.com/docs/moderate-stored-video
- Wavespeed Content Moderation Models: https://wavespeed.ai/models?typeList=content-moderation
- Wavespeed Content Moderator Image: https://wavespeed.ai/models/wavespeed-ai/content-moderator/image
- Wavespeed Content Moderator Text: https://wavespeed.ai/models/wavespeed-ai/content-moderator/text
- Wavespeed Molmo2 Text Content Moderator: https://wavespeed.ai/models/wavespeed-ai/molmo2/text-content-moderator
- Wavespeed Molmo2 Image Content Moderator: https://wavespeed.ai/models/wavespeed-ai/molmo2/image-content-moderator
- Wavespeed Molmo2 Video Content Moderator: https://wavespeed.ai/models/wavespeed-ai/molmo2/video-content-moderator
