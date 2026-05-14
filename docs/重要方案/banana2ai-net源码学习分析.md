# banana2ai-net 源码学习分析

分析对象：`D:\project3\shipany-2\banana2ai-net`

当前项目：`D:\project3\shipany-2\bananapro-org`

分析日期：2026-05-04

> 本文只分析本地 `banana2ai-net` 源码，以及它和当前项目 `bananapro-org` 的可迁移关系。`gptimg2.art`、`tool.video`、`nanobanana.im` 属于线上站点，后续要单独联网分析，避免把过期或猜测信息写进方案。

## 一句话结论

`banana2ai-net` 的价值不在文案，而在它已经把 ShipAny Two 改成了一个“多模型图片/视频工具站”的产品雏形：固定左侧导航、模型工具矩阵、图片生成器、视频生成器、素材库、每日签到、Kie key pool、gallery、provider callback、工具详情页都已经打通了一部分。

但它不是可以整包复制的成熟方案。里面有大量硬编码品牌、静态资源、中文/英文混写、重复页面、静态 sitemap、缺少标准 metadata、定价/签到文案和实际逻辑不一致等问题。当前 `bananapro-org` 已经有更好的 prompt/showcase 数据表、`/create?prompt=` 入口、结构化数据和 hreflang 修复方向，所以更合适的路线是“吸收架构和局部代码”，不是替换当前项目。

## 源码结构观察

### 核心产品目录

值得关注的目录和文件：

- `src/components/banana/*`
  - Banana 专属 UI 和业务组件，已经把产品逻辑从 ShipAny 默认 block 里抽出来。
  - 重点：`LandingShell.tsx`、`TopNavbar.tsx`、`Sidebar.tsx`、`ImageGenerator.tsx`、`VideoGeneratorPanel.tsx`、`ModelDetailPage.tsx`、`AssetsClient.tsx`、`PricingClient.tsx`、`CheckInModal.tsx`。
- `src/data/image-tools.ts`
  - 33 个图片工具/长尾页数据。
  - 每个工具包含 `heroTitle`、`heroDescription`、`features`、`steps`、`useCases`、`testimonials`、`faqs`、`cta`。
- `src/data/video-tools.ts`
  - 4 个视频工具详情页数据：`veo-3-1`、`veo-3-video-generator`、`seedance-1-5-pro`、`sora-2`。
- `src/data/page-examples.ts`
  - 生成器示例图和 prompt 数据，供模型页复用。
- `src/app/[locale]/(landing)/image/*`
  - 图片列表页、动态工具页、若干手写模型页。
- `src/app/[locale]/(landing)/video/*`
  - 视频列表页、动态工具页、若干手写视频模型页。
- `src/app/api/ai/generate/route.ts`
  - 统一生成入口，服务端计算积分并创建 `ai_task`。
- `src/extensions/ai/kie.ts`
  - Kie 图片、视频、音乐 provider。
- `src/extensions/ai/key-pool.ts`
  - 多 API key 负载、冷却、错误熔断的雏形。
- `src/app/api/user/tasks/route.ts`
  - 用户生成历史。
- `src/app/api/upload/route.ts`
  - 用户上传素材。
- `src/app/api/gallery/route.ts`
  - 公开 gallery。
- `src/app/api/user/checkin/route.ts`
  - 每日签到送积分。

### 和当前项目的差异

当前 `bananapro-org` 的基础更偏“图片生成 + prompt/showcase”：

- 当前已经有 `prompt`、`showcase` 表和后台管理页。
- 当前 `ImageGenerator` 已支持 `promptKey`，可以通过 `/api/prompts/by-title` 回填完整 prompt 和预览图。
- 当前 `/api/showcases/latest?usePrompts=true` 已经能把 prompt 表转换成 showcase 流。
- 当前已有 `getMetadata()` 的 canonical/hreflang 修复方向，以及 `JsonLd`/schema 相关实现。
- 当前 AI 生成入口支持候选 provider fallback：`kie`、`replicate`、`fal` 等。

`banana2ai-net` 强在产品化页面和视频矩阵；当前项目强在 prompt 数据化、SEO 修复思路和现有图片生成链路。两边应该合并优点。

## 值得学习的部分

### 1. Banana 专属产品层

`banana2ai-net` 没有继续完全依赖 ShipAny 默认的动态 landing block，而是新增了 `src/components/banana`。这点值得学。

好处：

- 产品逻辑不会散落在 `themes/default/blocks`、`shared/blocks` 和 locale JSON 里。
- 图片/视频/素材库/签到/价格弹窗可以按产品域组织。
- 后续要模仿 `tool.video` 做工具矩阵时，有一个自然的承载层。

建议当前项目采用类似边界，但不要命名成 `banana2ai`：

- `src/features/bananapro/generator`
- `src/features/bananapro/tools`
- `src/features/bananapro/assets`
- `src/features/bananapro/credits`
- `src/features/bananapro/marketing`

短期如果不想大重构，也可以先放到 `src/components/bananapro`。

### 2. App Shell 和工具站导航

相关文件：

- `src/components/banana/LandingShell.tsx`
- `src/shared/components/layout/TopNavbar.tsx`
- `src/shared/components/layout/Sidebar.tsx`
- `src/components/banana/MobileBottomNav.tsx`

它的页面不像默认营销页，而像一个工具站：

- 顶部固定导航。
- 左侧可折叠菜单。
- 移动端底部导航。
- 主入口分成 Home、Banana Prompts、AI Workflow Studio、AI Image、AI Video、Assets Library、Models。
- 右侧长期展示积分、语言、登录、签到、充值。

这套结构适合“图片 + 视频 + prompt + 素材库”的工具型产品。当前项目如果继续做单一图片生成站，不必全部搬；如果要做工具矩阵，它是很好的参考。

建议迁移方式：

- P0 不迁移完整 Shell，只先调整现有 header 导航。
- P1 新增 `AI Image / Prompts / Showcases / Pricing / Blog`。
- P2 如果开始做视频矩阵，再引入侧边栏和素材库入口。

### 3. 图片工具矩阵

相关文件：

- `src/data/image-tools.ts`
- `src/app/[locale]/(landing)/image/[slug]/page.tsx`
- `src/components/banana/ModelDetailPage.tsx`

`image-tools.ts` 把 33 个长尾工具页抽象成同一套数据结构，动态路由通过 `generateStaticParams()` 批量生成页面。

可学习点：

- 用数据驱动长尾页，而不是每个工具写一个完整页面。
- 每个工具页固定包含：Hero、生成器、Features、Steps、Use Cases、Testimonials、FAQ、CTA。
- 同一套 `ModelDetailPage` 可以快速复制页面结构。
- `page-examples.ts` 给不同 slug 分配不同示例图，降低页面重复感。

不建议照搬点：

- 很多工具文案质量一般，有些带敏感或不适合当前品牌的长尾词。
- `testimonials` 很多是虚构感很强的用户评价，不应直接使用。
- 部分页面宣传“100% Free”“No limits”等，必须和真实定价、积分逻辑一致。
- 大量图片来自 `https://static.banana2ai.net/...`，不能作为当前项目长期资源依赖。

当前项目迁移建议：

- 不要一口气上 33 个页面。
- 先做 6 到 10 个最相关的工具页：
  - `ai-product-photo-generator`
  - `ai-headshot-generator`
  - `ai-logo-generator`
  - `ai-poster-generator`
  - `image-to-image-generator`
  - `remove-background` 或 `background-replacer`
  - `ai-avatar-generator`
  - `ai-image-upscaler` 如果真实支持
- 每个页面都必须连接当前 `ImageGenerator` 和 prompt 模板库。

### 4. 视频工具矩阵

相关文件：

- `src/data/video-tools.ts`
- `src/app/[locale]/(landing)/video/page.tsx`
- `src/app/[locale]/(landing)/video/[slug]/page.tsx`
- `src/components/banana/VideoGeneratorPanel.tsx`

这是当前项目最缺的部分。`banana2ai-net` 已经搭出了视频工具的基本商业词矩阵：

- AI Video Generator
- Text to Video
- Image to Video
- Veo 3 / Veo 3.1
- Sora 2
- Seedance 1.5 Pro
- Native audio-video generation
- Motion control
- Cinematic video
- Brand video marketing
- Social media video
- Product demos

可学习点：

- 视频列表页不是简单放一个生成器，而是按模型、行业、功能、FAQ 铺页面。
- 视频详情页在 Hero 后直接嵌入 `VideoGeneratorPanel`，转化路径短。
- `VideoGeneratorPanel` 把模型能力差异显式建模：是否支持 text/image/frames/reference、ratio、duration、audio、translation、resolution。

当前项目迁移建议：

- 先不要急着全量上视频生成。
- 先做 `/video` 工具落地页和 `/video/veo-3-video-generator` 这类 SEO 页。
- 视频生成器可以从 `VideoGeneratorPanel` 抽取模型配置和 UI 思路，但要接当前项目的 provider/fallback/积分体系。
- 等视频 API 和成本稳定后，再加 `/video/[slug]` 动态工具页。

### 5. 图片生成器配置

相关文件：

- `src/components/banana/ImageGenerator.tsx`

`banana2ai-net` 的 `ImageGenerator` 做得比当前项目更像“多模型控制台”：

- 11 个图片模型配置。
- 模型字段包含 `apiModel`、`modes`、`imageUpload`、`maxFiles`、`maxSizeMB`、`ratios`、`resolutions`、`hasNegativePrompt`、`hasGuidanceScale`、`hasSteps`、`hasSafetyChecker`。
- 支持文本生成和图生图。
- 支持素材库选择上传图和已生成图片。
- 支持生成历史轮询。
- 支持画布水印预览和“带水印/无水印下载”区分。

当前项目已有自己的 `src/shared/blocks/generator/image.tsx`，不建议直接替换。更合适的是吸收这些能力：

- 把当前 `MODEL_OPTIONS` 扩展成 capability 配置。
- 把不同模型的上传字段映射抽到 provider 层，不要在 UI 层散落判断。
- 增加素材库入口，但先复用当前 `prompt/showcase` 数据，不要新引入过多表。
- 如果引入水印下载，要先确定付费权益和隐私政策。

### 6. 视频生成器模型能力建模

相关文件：

- `src/components/banana/VideoGeneratorPanel.tsx`

值得学的是 `VIDEO_MODELS` 的建模方式，而不是 UI 原样复制。

它区分了：

- `apiEndpoint: 'veo' | 'market'`
- `modes: ['text', 'image', 'frames', 'reference']`
- `ratios`
- `durations`
- `hasAudio`
- `hasTranslation`
- `hasCameraFixed`
- `hasResolution`
- `resolutions`

这个结构适合将来学习 `tool.video` 的工具矩阵。建议当前项目后续做视频时，把模型能力做成服务端和前端共享配置，避免 UI 展示支持某能力、后端却没有映射。

### 7. 服务端积分计算

相关文件：

- `src/extensions/ai/credit-calculator.ts`
- `src/app/api/ai/generate/route.ts`

`banana2ai-net` 的生成入口不再相信前端传来的点数，而是在服务端按模型、分辨率、数量、时长计算：

- 图片：Nano Banana、Nano Banana Pro、Nano Banana 2、GPT Image、Flux、Seedream、Qwen、Grok、Z-Image 等不同价格。
- 视频：Veo 固定价格，Seedance 按时长和分辨率，Sora 按时长和质量。

这点值得迁移。当前项目后端目前更偏 scene 固定扣费：

- text-to-image: 4
- image-to-image: 6
- text-to-video: 6
- image-to-video: 8
- video-to-video: 10

如果当前项目增加多模型，固定 scene 扣费会越来越不准。建议做一个当前项目版 `credit-calculator.ts`，先只覆盖真实接入模型。

### 8. Kie provider 和 Key Pool

相关文件：

- `src/extensions/ai/kie.ts`
- `src/extensions/ai/key-pool.ts`
- `src/shared/services/ai.ts`
- `src/config/db/schema.postgres.ts` 中的 `providerKey`
- `src/app/api/admin/provider-keys/route.ts`

这是最有工程价值的部分之一。

`banana2ai-net` 的 key pool 支持：

- 从 `provider_key` 表读取 active key。
- 多 key 按 priority 排序。
- 同 priority 选择 activeCount 最低的 key。
- RPM 计数。
- 429/5xx 错误冷却。
- 连续错误熔断。
- 没有 DB key 时回退到旧的 env config。

当前项目如果要正式跑视频或多模型，这个能力非常值得迁移。建议迁移时补齐：

- 后台管理 UI。`banana2ai-net` 只有 `/api/admin/provider-keys`，没有完整管理页。
- daily limit 真正扣减。当前 key pool 定义了 `dailyLimit`，但核心 acquire 逻辑没有实际按天限制。
- 请求统计更准确。当前 `totalRequests` 没有完整递增。
- provider key 加密存储。不要明文长期保存在 DB。
- 失败 refund 逻辑。notify 里失败退款还是 TODO。

### 9. 任务回调、查询和素材库

相关文件：

- `src/app/api/ai/query/route.ts`
- `src/app/api/ai/notify/[provider]/route.ts`
- `src/app/api/user/tasks/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/gallery/route.ts`
- `src/components/banana/AssetsClient.tsx`

`banana2ai-net` 已经形成生成资产闭环：

1. 用户发起生成。
2. 创建 `ai_task` 并扣积分。
3. 前端轮询 `/api/ai/query`。
4. provider callback 到 `/api/ai/notify/[provider]`。
5. 成功后保存到 R2。
6. 如果公开，则写入 `gallery`。
7. 用户在 `/assets` 查看自己上传和生成的素材。

这套闭环适合当前项目中期吸收。但要注意当前项目已经有 `showcase` 和 `prompt` 表，不要直接再引入一个语义冲突的 `gallery`。建议：

- 用户私人生成历史：沿用 `ai_task`。
- 用户素材库：新增 `user_asset` 或等价表。
- 公开展示：当前已有 `showcase`，短期继续用 `showcase`。
- 如果要做公共 gallery，再设计 `gallery` 与 `showcase` 的边界。

### 10. 每日签到送积分

相关文件：

- `src/app/api/user/checkin/route.ts`
- `src/components/banana/CheckInModal.tsx`
- `src/shared/components/layout/TopNavbar.tsx`

它通过 7 天 streak 提高免费用户留存：

- 第 1/2 天：3 credits
- 第 3/4 天：5 credits
- 第 5/6 天：8 credits
- 第 7 天：15 credits
- 一周合计 47 credits

值得学的是“免费积分运营机制”，不是原样复制文案。

风险：

- `TopNavbar` 文案写了 `Get 20 Free Credits` 和 `claim 10 credits`，但后端实际给 3/5/8/15。这里不一致。
- 如果当前项目采用签到，定价页、登录弹窗、TopNavbar、后端奖励必须统一。
- 免费积分会增加真实 API 成本，必须有风控、频率限制、邮箱验证或 CAPTCHA 策略。

### 11. Pricing 页面和弹窗

相关文件：

- `src/components/banana/PricingClient.tsx`
- `src/components/banana/PricingModal.tsx`
- `src/app/[locale]/(landing)/pricing/page.tsx`

可学习点：

- 定价页把不同模型可生成数量讲清楚。
- 弹窗可以从导航/下载/积分不足等位置直接打开。
- 价格页加入 FAQ 和权益说明。

风险：

- `PricingClient` 页面里的付费 CTA 是普通 `<a>`，没有调用 checkout；真正调用 checkout 的逻辑在 `PricingModal`。
- 页面价格、弹窗价格、支付产品 ID、后台商品配置可能不同步。
- 文案中的图片/视频数量需要和 `credit-calculator.ts` 保持一致。

当前项目迁移建议：

- 先保留当前支付系统。
- 只学习“点数消耗解释”和“模型可生成数量”的展示方式。
- 后续统一抽一个 `plans` 配置，页面和弹窗共用，避免两套价格。

### 12. Banana Prompts 和 Studio

相关文件：

- `src/app/[locale]/(landing)/banana-prompts/page.tsx`
- `src/app/[locale]/(landing)/banana-prompts/BananaPromptsClient.tsx`
- `src/app/[locale]/(landing)/studio/page.tsx`
- `src/app/[locale]/(landing)/studio/StudioClient.tsx`

`banana-prompts` 是一个静态 prompt 营销页，包含 8 条示例 prompt、搜索、复制和“Use It”。但它没有接数据库，也没有把 prompt 预填到生成器；`Use It` 只是跳到 `/zh/image/banana-pro-ai/`。

当前项目已经有 `prompt` 表和 `/create?prompt=`，所以当前项目比它更适合做真正的 Prompt SEO。建议不要复制它的静态实现，而是把已有 prompt 表升级成正式页面。

`studio` 更像一个工作流画布的营销页，页面展示的是 mockup 和文案，没有真实节点编辑器。它适合作为中长期产品叙事参考，不适合作为当前短期开发目标。

## SEO 和多语言问题

`banana2ai-net` 的 SEO 方向值得学，但实现还比较粗糙。

可学习：

- 图片和视频都有列表页、模型页、工具详情页。
- 页面文案围绕具体商业场景，而不是只说“AI generator”。
- FAQ、Steps、Use Cases 是长尾页的标准模块。
- public sitemap 包含核心工具 URL。

主要问题：

- root layout 里全站注入首页级 alternate，容易复现当前项目已经在修的 hreflang 问题。
- 很多手写页面是 `'use client'` 页面，没有 `generateMetadata()`。
- `banana-prompts`、`studio` 等页面使用静态 `metadata`，中文标题可能对英文页也生效。
- 动态 `/image/[slug]` 和 `/video/[slug]` 只有 title/description，没有 canonical、languages、Open Graph 完整信息。
- 公开 `public/sitemap.xml` 是静态文件，后续动态工具页变化时容易漏。
- 没看到 FAQPage、BreadcrumbList、SoftwareApplication 等 JSON-LD 输出。

当前项目已有 `hreflang修复方案.md`，不建议倒退到它的全站 alternate 写法。

## 当前项目推荐吸收路线

### P0：先吸收产品信息架构，不动底层

目标：让当前站更像工具站，而不是模板营销站。

建议改动：

- 继续执行已有 `gptimg2.art模仿学习改造方案.md` 里的首页、showcases、pricing 改造。
- 导航增加 `Prompts / Showcases / Pricing / Blog / Create`。
- 首页文案缩短，避免继续堆长尾词。
- prompt 表补 20 到 40 条高质量模板。
- showcases 卡片加 `Use template / Copy prompt / Share`。

不建议此阶段迁移 `LandingShell`、`Sidebar`、`VideoGeneratorPanel`。

### P1：迁移服务端可复用能力

目标：提高生成链路稳定性。

建议改动：

- 新增当前项目版 `src/extensions/ai/credit-calculator.ts`。
- 把后端扣费从 scene 固定值逐步改成模型配置计算。
- 迁移 `key-pool.ts` 思路，支持 Kie 多 key。
- 增加 `provider_key` 表和后台管理页，但 key 要加密存储。
- 保留当前项目的 provider fallback，不要被 `banana2ai-net` 的 Kie-only 实现替换掉。

### P2：做图片工具矩阵

目标：学习 `nanobanana.im` 的长尾页矩阵之前，先建立本项目可维护的工具页框架。

建议改动：

- 新增 `src/features/bananapro/tools/image-tools.ts`。
- 新增 `/tools/[slug]` 或 `/image/[slug]` 动态页。
- 首批只做 6 到 10 个高价值页面。
- 每个页面接当前 `ImageGenerator`，并连接 prompt 模板。
- 所有页面使用 `getMetadata({ canonicalUrl })` 或当前 SEO 工具生成 canonical/hreflang。

### P3：做视频工具矩阵

目标：学习 `tool.video` 的视频商业词和工具矩阵。

建议改动：

- 新增 `/video` 落地页。
- 新增 `/video/veo-3-video-generator`、`/video/sora-2-video-generator`、`/video/image-to-video`。
- 从 `VideoGeneratorPanel.tsx` 抽取模型能力配置。
- 先实现页面和待接入状态，再接真实生成 API。
- 视频模型成本、点数、失败退款必须先设计清楚。

### P4：素材库和公开 gallery

目标：让用户生成结果可复用、可管理、可转化。

建议改动：

- 增加用户素材库 `/assets`。
- 上传文件写入 `user_asset`。
- 生成结果从 `ai_task` 解析展示。
- 当前公开案例继续用 `showcase`，不要先引入语义重复的 `gallery`。
- 后续如果需要社区 gallery，再单独设计。

## 不能直接照搬的清单

不要直接复制：

- `static.banana2ai.net` 的图片、视频、头像、示例素材。
- `banana2ai.net` 的邮箱、sitemap、法律页、免责声明中的品牌信息。
- 虚构用户评价、用户数量、永久免费、无限制、商用承诺。
- `public/sitemap.xml` 静态站点地图。
- root layout 的全站首页级 alternate。
- `PricingClient` 里未接 checkout 的 CTA。
- `TopNavbar` 中和后端奖励不一致的签到文案。
- `ImageGenerator` 整个文件。它太大，且和当前项目的 prompt/showcase/fallback 体系不一致。
- `VideoGeneratorPanel` 整个文件。它适合参考模型能力配置，但需要按当前 API 重接。

## 风险和技术债

### 1. 页面重复

同一个路径体系里同时存在：

- 动态页：`image/[slug]/page.tsx`
- 手写页：`image/banana-pro-ai/page.tsx`、`image/z-image-turbo/page.tsx` 等

这会导致内容维护双轨化。当前项目如果做工具矩阵，应优先数据驱动，只有核心页面才手写。

### 2. SEO 不完整

很多页面没有 page-specific canonical/hreflang/JSON-LD。当前项目已经在处理 hreflang，不要把这部分实现带回来。

### 3. 支付和权益不一致

页面、弹窗、TopNavbar、后端扣费各自有文案和数字。迁移时必须先统一：

- 模型点数
- 免费积分
- 套餐点数
- 视频成本
- 无水印下载权益
- 私密生成权益

### 4. API Key 明文和统计不足

`provider_key` 表是好方向，但需要补：

- 加密存储。
- 后台 UI。
- daily limit 真正生效。
- total requests/total errors 递增。
- key 删除/禁用/冷却解除。

### 5. 免费积分成本

签到和免费试用能提高转化，但会带来刷量成本。上线前至少要有：

- 登录限制。
- 邮箱验证限制。
- IP / user rate limit。
- 一次性账号风控。
- 生成失败退款策略。

## 推荐文件迁移优先级

### 高优先级参考

- `src/extensions/ai/credit-calculator.ts`
- `src/extensions/ai/key-pool.ts`
- `src/shared/services/ai.ts`
- `src/components/banana/VideoGeneratorPanel.tsx` 中的 `VIDEO_MODELS` 配置思想
- `src/components/banana/ImageGenerator.tsx` 中的 `AI_MODELS` 和 `imageUpload` 能力配置思想
- `src/data/image-tools.ts`
- `src/data/video-tools.ts`
- `src/components/banana/AssetsClient.tsx`

### 中优先级参考

- `src/components/banana/LandingShell.tsx`
- `src/shared/components/layout/TopNavbar.tsx`
- `src/shared/components/layout/Sidebar.tsx`
- `src/components/banana/CheckInModal.tsx`
- `src/components/banana/PricingModal.tsx`
- `src/app/api/upload/route.ts`
- `src/app/api/user/tasks/route.ts`
- `src/app/api/gallery/route.ts`

### 低优先级或只看思路

- `src/app/[locale]/(landing)/banana-prompts/*`
- `src/app/[locale]/(landing)/studio/*`
- `src/components/banana/*Section.tsx` 营销组件
- `public/sitemap.xml`
- 具体 testimonials、features、faq 文案

## 和已有文档的关系

当前 `docs/修改方案/gptimg2.art模仿学习改造方案.md` 已经把 Prompt/Workflow SEO、showcases、pricing、模型页方向讲得比较完整。本文件补的是 `banana2ai-net` 源码侧的工程实现视角：

- `gptimg2.art`：学页面叙事、Prompt/Workflow SEO。
- `banana2ai-net`：学 ShipAny 改造方式、多模型生成器、视频入口、素材库、key pool、积分计算。
- `tool.video`：下一步重点看视频工具矩阵、API/MCP 包装、视频商业词。
- `nanobanana.im`：下一步重点看 LoRA/风格页矩阵、多语言和海量长尾页。

## 建议下一步

建议下一轮先做两件事：

1. 对 `banana2ai-net` 的 `credit-calculator + key-pool + providerKey` 做一次迁移设计，确定是否引入到当前项目。
2. 联网分析 `tool.video`，把视频工具矩阵和商业关键词整理成 `/video` 页面和 `/video/[slug]` 的栏目方案。

短期不要直接搬 `banana2ai-net` 的 UI。先把当前项目已有的 prompt/showcase/generator 体系做深，再把视频矩阵和素材库接上。
