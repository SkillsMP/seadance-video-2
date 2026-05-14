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

只加一处调用：

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

不要改 `createProviderTask()`、candidate fallback、`createAITask()`。

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
SIGHTENGINE_FAIL_CLOSED="true"
```

说明：

- `SIGHTENGINE_MODERATION_ENABLED=false` 方便上线前灰度和紧急回滚。
- `SIGHTENGINE_FAIL_CLOSED=true` 更符合支付渠道风控目标；审核服务异常时拒绝生成。
- `SIGHTENGINE_TIMEOUT_MS=3500` 先保守控制在 3.5 秒内，后续按真实延迟再调。

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

## 10. 第二阶段再做什么

第一版稳定后，再按实际风险补：

1. 在 `/api/ai/query` 做生成结果复检，并缓存审核结果，避免轮询重复调用。
2. 对 `video_input` 做视频审核。
3. 增加轻量 `moderation_logs` 表，只存 hash、用户、类别、决策、时间，不存原文。
4. 对公开 showcase 发布前做结果审核。
5. 当审核量和误杀数据足够后，再考虑 review 状态、人工后台、用户风险分。
6. 需要成本或可用性优化时，再评估 Wavespeed 作为备用。

## 11. 最终推荐方案

首版落地顺序：

1. 新增 Sightengine adapter。
2. 新增 `moderateGenerationInput()`。
3. 在 `generate/route.ts` 的积分检查后、provider 调用前接入。
4. 增加 `.env.example` 和后台 AI settings 配置。
5. 加最小单元测试或 mock 测试。

明确不做大重构。这个方案的边界是“生成前输入安全闸门”，不是一次性建设完整 Trust & Safety 平台。

参考文档：

- Sightengine Text Moderation: https://sightengine.com/text-moderation-api
- Sightengine Image Moderation: https://sightengine.com/docs/image-moderation-principles
- Sightengine Visual Models: https://sightengine.com/docs/models
- Wavespeed Content Detection Models: https://wavespeed.ai/collections/content-detection-models
