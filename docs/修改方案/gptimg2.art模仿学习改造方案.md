# gptimg2.art 模仿学习改造方案

同时也要学习 gptimg2.art和tool.video，以及nanobanana.im 以及banana2ai.net（已经有banana2ai.net源码）
banana2ai = 学代码实现和 ShipAny 迁移
gptimg2.art = 学页面叙事、Prompt/Workflow SEO
tool.video = 学视频工具矩阵、API/MCP 包装、视频商业词
nanobanana.im = 学 LoRA/风格页矩阵、多语言和海量长尾页



参考站点：<https://gptimg2.art/>

本文只讨论如何学习 `gptimg2.art` 的产品结构、页面组织、转化路径和内容策略，并给出本项目 `bananapro-org` 的改造方向。不建议复制对方品牌、素材、价格、外部徽章、用户数量或未经验证的宣传承诺。

## 结论

`gptimg2.art` 做得好的地方，不是某一个组件特别复杂，而是把 ShipAny Two 模板改成了一个更完整的“AI 图片工具增长闭环”：

1. 首页第一屏直接讲清楚工具价值，并把生成器入口放得很近。
2. 案例区不只是展示图片，而是变成 prompt 模板库，用户可以直接套用、复制、分享。
3. 定价页把“订阅、点数包、单张成本、点数消耗规则、FAQ”一次讲清楚，降低购买犹豫。
4. `/models/gpt-image-2` 这类模型详情页不是普通介绍页，而是 SEO 页面、模板入口、工作流教育页和转化页的组合。
5. Blog 内容围绕 prompt、商品图、图片转视频工作流做主题集群，而不是泛泛发文章。

本项目已经具备对应基础：`ImageGenerator`、`ShowcasesFlowDynamic`、`prompts` 表、`/create?prompt=`、`/pricing`、`/blog`、多语言 JSON 和动态区块系统都在。更合适的路线是“集中改造 landing 内容和少量关键组件”，而不是重写模板。

## 参考页面观察

参考范围：

- 首页：<https://gptimg2.art/>
- 定价页：<https://gptimg2.art/pricing>
- 展示页：<https://gptimg2.art/showcases>
- 图片生成页：<https://gptimg2.art/ai-image>
- 图片模型页：<https://gptimg2.art/models/gpt-image-2>
- 视频页：<https://gptimg2.art/ai-video>
- Blog：<https://gptimg2.art/blog>

观察到的页面结构：

- 首页导航包含 `Prompts / Pricing / Showcases / Blog`，不是只放功能锚点。
- 首页 hero 使用真实视觉图作为整屏背景，文字和 CTA 覆盖在图片上，第一 CTA 指向具体生成器，第二 CTA 指向 AI Video。
- hero 后面马上接生成器区域，降低“看完介绍还要找入口”的成本。
- 首页 showcases 使用瀑布流图片墙，hover 后出现 prompt 标题和动作按钮：`Use template`、`Copy prompt`、`Share`。
- 首页后半段用场景卡片解释电商图、试穿、头像、草图编辑、背景替换、表情包等具体用途。
- 定价页先放信任点：可取消、安全支付、点数有效期，再放套餐。
- 定价页把套餐分成订阅和一次性点数包，并附带“每张图大约多少钱”和“点数消耗规则”。
- 模型页把“生成器、模板想法、图片到视频工作流、素材规格、常见失败原因、FAQ”串成一页。
- Blog 文章主题围绕 prompt guide、product photo prompts、image-to-video workflow，和产品入口强相关。

## 不应该照搬的部分

这些内容需要避免直接模仿：

- 不复制 `GPT Image 2` 品牌名、图像素材、外部徽章和目录站 badge。
- 不照搬“5,000+ creators”这类数据，除非本项目有真实依据。
- 不复制价格。价格必须跟本项目真实模型成本、支付配置和 `ImageGenerator` 中的点数消耗一致。
- 不使用“ChatGPT Image model”等可能引发模型归属误解的说法，除非实际 provider 和授权描述支持。
- 不把长尾 SEO 文案堆得过重。当前 `pages/index.json` 已经有偏长、偏堆关键词的问题，改造时应变得更像产品说明，而不是继续加长。

## 本项目现状对照

| 模块 | gptimg2.art 做法 | 本项目现状 | 改造方向 |
| --- | --- | --- | --- |
| Header | Prompts、Pricing、Showcases、Blog 形成主导航 | `landing.json` 里主要只有 Features | 改成产品闭环导航，并加入明显的 Create CTA |
| 首页 Hero | 真实图片背景，短标题，双 CTA | `pages/index.json` 文案很长，背景资源较弱 | 收短标题和描述，换成真实生成效果图或高质量 hero 图 |
| 首页生成器 | hero 后立刻出现生成器 | `page.tsx` 已注入 `ImageGenerator` | 保留，并优化首屏视觉和默认 prompt |
| Showcases | 瀑布流 + Use template + Copy prompt + Share | 已有 `ShowcasesFlowDynamic`，但主要是 Create Similar | 增加复制、分享、模板套用动作 |
| Prompts | prompt 展示就是获客资产 | 已有 `prompt` 模型和 `/api/prompts` | 把 prompt 数据标准化，做成正式入口 |
| Pricing | 信任点、订阅、点数包、消耗规则、FAQ | 已有 `pricing` block 和 JSON | 增加信任点、点数消耗表、价格解释 |
| Model Page | `/models/gpt-image-2` 承载 SEO 和工作流教育 | 当前有 `/ai-image-generator`，但较薄 | 新增或重构 `/models/nano-banana-pro` |
| Blog | 围绕 prompt 和工作流做内容集群 | 目前 Blog 文案较泛 | 改成 prompt、商品图、头像、图片转视频等主题 |
| AI Video | 从 image 页面交叉导流 video | 项目已有 video generator 页面 | 作为次级转化，不抢首页主目标 |

## 推荐目标信息架构

### 顶部导航

建议把 `src/config/locale/messages/en/landing.json` 和 `zh/landing.json` 的导航改成：

- `AI Image` -> `/ai-image-generator` 或 `/create`
- `Prompts` -> `/showcases`，短期先复用现有 showcases 页
- `Pricing` -> `/pricing`
- `Showcases` -> `/showcases`
- `Blog` -> `/blog`
- 右侧主按钮：`Start Creating` -> `/create`

如果导航过多，移动端可以保留 `Prompts / Pricing / Blog`，把 `AI Image` 放主按钮。

### 首页区块顺序

建议首页顺序：

1. `hero`：一句话定位 + 真实视觉背景 + 双 CTA。
2. `generator`：直接生成，不让用户跳转后才看到工具。
3. `showcases`：精选 prompt 模板瀑布流，6 到 12 个即可。
4. `workflows`：按用途讲清楚能做什么，例如商品图、头像、UI mockup、海报、图片编辑。
5. `features`：只讲关键能力，不堆模型术语。
6. `pricing_preview`：展示最低门槛、点数有效期、商业使用说明，链接到 `/pricing`。
7. `faq`：回答免费、点数、商用、上传图片、生成失败等问题。
8. `cta`：回到 `/create`。

当前 `src/app/[locale]/(landing)/page.tsx` 已经会把 `generator` 注入动态页面，所以第一阶段主要改 `src/config/locale/messages/en/pages/index.json` 和中文对应文件即可。

## 首页文案改造建议

当前首页英文描述过长，关键词堆叠较明显。建议改成更短、更可信、更面向用户动作。

示例方向：

```text
H1:
Nano Banana Pro AI Image Generator

Description:
Create product photos, portraits, posters, UI mockups, and reference-guided edits with a fast AI image workflow. Start from a prompt or upload images, then turn the result into a reusable visual asset.

Primary CTA:
Start Creating

Secondary CTA:
Explore Prompt Templates
```

中文方向：

```text
H1:
Nano Banana Pro AI 图片生成器

Description:
用提示词或参考图快速生成商品图、头像、海报、UI mockup 和图片编辑结果。先做出可用的第一张图，再继续优化成可发布的视觉素材。

Primary CTA:
开始生成

Secondary CTA:
查看提示词模板
```

注意：不要继续把所有长尾关键词塞进 hero。长尾词应该分配到模型页、prompt 页和 blog 文章。

## Showcases / Prompts 改造

这是最值得优先模仿的部分。

### 当前基础

相关文件：

- `src/themes/default/blocks/showcases-flow-dynamic.tsx`
- `src/app/[locale]/(landing)/showcases/page.tsx`
- `src/app/api/showcases/latest/route.ts`
- `src/app/api/prompts/route.ts`
- `src/app/api/prompts/by-title/route.ts`
- `src/shared/models/prompt.ts`
- `src/app/[locale]/(landing)/create/page.tsx`
- `src/shared/blocks/generator/image.tsx`

已有能力：

- `/showcases` 可以通过 `usePrompts=true` 从 `prompts` 表拿公开 prompt。
- `ShowcasesFlowDynamic` 已经有瀑布流、图片预览、创建相似按钮。
- `/create?prompt=xxx` 会把 `promptKey` 传给 `ImageGenerator`。
- `ImageGenerator` 会通过 `/api/prompts/by-title?title=` 加载 `promptDescription` 和图片。

### 建议补齐动作

把 showcases 卡片动作升级为：

- `Use template`：跳转 `/create?prompt=${promptTitle}`。
- `Copy prompt`：复制完整 `promptDescription`，复制成功给 toast。
- `Share`：优先用 `navigator.share`，不支持时复制当前模板链接。
- 图片点击：仍然打开大图预览。

当前代码里 `Link href={`/create?prompt=${item.title}`}` 使用的是标题字段。短期可以继续，但更稳妥的是让 API 返回一个稳定字段，例如 `promptKey` 或 `slug`。否则 prompt 标题一改，旧链接会失效。

### Prompt 数据建议

短期继续使用现有字段：

- `title`：展示标题，例如 `E-commerce Product Photo`
- `description`：卡片短说明
- `image`：展示图
- `promptTitle`：稳定模板 key，短期也可用英文短标题
- `promptDescription`：完整可复制 prompt
- `status`：`published`
- `sort`：排序

中期建议给 prompt 增加：

- `slug`：模板 URL 或查询参数稳定值
- `category`：`product / portrait / poster / ui / edit / video-source`
- `locale`：多语言内容隔离
- `usageCount`：模板使用次数

## 定价页改造

`gptimg2.art/pricing` 的强点是把购买前问题提前讲清楚。可以学习结构，但价格必须重新测算。

### 建议结构

1. 顶部标题：`Simple credits for AI image creation`
2. 三个信任点：`Cancel anytime`、`Secure checkout`、`Credits valid for 12 months`
3. 订阅套餐：适合高频用户。
4. 一次性点数包：适合测试和偶尔使用。
5. 点数消耗表：明确 text-to-image、image-to-image、高清、批量模式消耗。
6. FAQ：取消、退款、点数过期、商业使用、失败扣费。

### 必须同步的地方

当前 `src/shared/blocks/generator/image.tsx` 里有前端点数消耗：

- text-to-image：`4` credits
- image-to-image：`6` credits

定价页里的“每张图成本”和“点数消耗规则”必须跟真实后端扣费一致。如果后端扣费另有规则，应以服务端为准，并把前端展示也同步。

相关文件：

- `src/config/locale/messages/en/pages/pricing.json`
- `src/config/locale/messages/zh/pages/pricing.json`
- `src/themes/default/blocks/pricing.tsx`
- `src/app/[locale]/(landing)/pricing/page.tsx`
- 支付 provider 配置和后台商品 ID 映射

## 模型页 / 工作流页改造

建议新增一个类似 `/models/nano-banana-pro` 的页面，承接 SEO 和工作流教育。

参考 `gptimg2.art/models/gpt-image-2`，但要用 Banana Pro 的真实定位。

页面结构建议：

1. Hero：模型名 + 适合什么任务 + `Generate Now` / `Use a Template`
2. Generator：嵌入 `ImageGenerator`
3. Template Ideas：商品图、头像、海报、UI mockup、参考图编辑
4. Workflows：图片生成到广告图、头像到社媒素材、产品图到电商详情页、图片到视频首帧
5. Asset Spec：比例、清晰主体、背景、文字、参考图数量
6. Failure Prevention：避免过长 prompt、多主体、复杂背景、文字过多、比例混乱
7. FAQ：点数、商用、上传图片、生成失败、提示词写法

推荐文件位置：

- `src/app/[locale]/(landing)/models/nano-banana-pro/page.tsx`
- `src/config/locale/messages/en/pages/models/nano-banana-pro.json`
- `src/config/locale/messages/zh/pages/models/nano-banana-pro.json`

如果不想新增目录，也可以先增强现有 `/ai-image-generator`，但长期 SEO 上模型页更清晰。

## Blog 内容集群

当前 Blog 更像模板默认内容。建议学习对方的主题集群方式，先做 6 篇和产品强绑定的文章。

优先级建议：

1. `Nano Banana Pro Prompt Guide: 12 Reusable Patterns`
2. `Product Photo Prompts for Ecommerce Listings and Ads`
3. `AI Headshot Prompt Templates for Professional Profiles`
4. `How to Use Reference Images for Better AI Edits`
5. `Image to Video Workflow: Storyboards, First Frames, and Product Shots`
6. `Readable Text in AI Images: Prompt Patterns and Limits`

相关文件：

- `content/posts/*.mdx`
- `src/config/locale/messages/en/pages/blog.json`
- `src/config/locale/messages/zh/pages/blog.json`

每篇文章底部都应导向：

- `/create`
- `/showcases`
- 相关 prompt 模板
- `/pricing`

## 分阶段执行计划

### P0：先做最小可见改造

目标：不用大改组件，先让网站从“模板站”变成“工具站”。

改动：

- 更新 `landing.json` 导航。
- 重写 `pages/index.json` 首页文案和区块顺序。
- 重写 `pages/pricing.json`，补信任点、套餐解释和点数消耗表。
- 整理 20 到 40 条高质量 prompt 数据，发布到 `prompts` 表。
- 把 `/showcases` 文案改成 `Prompt Templates & Showcases`。

验收：

- 用户从首页 1 次点击可到生成器。
- 用户从任意 showcase 模板 1 次点击可进入 `/create?prompt=...`。
- 定价页能解释一个新用户最关心的 5 个问题。

### P1：补关键交互

目标：让 showcases 真正变成模板库。

改动：

- `ShowcasesFlowDynamic` 增加 `Use template / Copy prompt / Share`。
- `/api/showcases/latest?usePrompts=true` 返回稳定 `promptKey`。
- `/api/prompts/by-title` 中期改为 `/api/prompts/by-slug`。
- `ImageGenerator` 根据 prompt 模板自动填入 prompt、预览图、推荐模式。

验收：

- 复制 prompt 可用。
- 分享链接可打开同一个模板。
- 模板标题修改不影响旧链接，或至少有迁移方案。

### P2：新增模型页和内容页

目标：承接长尾 SEO，减少首页关键词堆叠。

改动：

- 新增 `/models/nano-banana-pro`。
- 新增 6 篇 blog。
- prompt 模板按场景分类。
- 首页只保留精选内容，把长内容放到详情页。

验收：

- 首页更短、更清楚。
- 模型页覆盖核心长尾词。
- Blog 每篇都有明确产品 CTA。

### P3：视觉和信任增强

目标：让站点看起来更像成熟产品，而不是默认模板。

改动：

- hero 使用真实生成效果图，避免纯渐变或占位图。
- showcases 图片统一质量标准。
- pricing 卡片加入可信但真实的说明。
- 页脚补齐 About、AI Image、Pricing、Showcases、Blog、FAQ、Privacy、Terms。

验收：

- 首页首屏品牌和产品一眼明确。
- 移动端 hero、生成器、showcases 不拥挤。
- 没有虚假 badge、虚假用户数、虚假模型归属。

## 推荐文件清单

第一阶段优先涉及：

- `src/config/locale/messages/en/landing.json`
- `src/config/locale/messages/zh/landing.json`
- `src/config/locale/messages/en/pages/index.json`
- `src/config/locale/messages/zh/pages/index.json`
- `src/config/locale/messages/en/pages/showcases.json`
- `src/config/locale/messages/zh/pages/showcases.json`
- `src/config/locale/messages/en/pages/pricing.json`
- `src/config/locale/messages/zh/pages/pricing.json`
- `content/posts/*.mdx`

第二阶段再动组件：

- `src/themes/default/blocks/showcases-flow-dynamic.tsx`
- `src/app/api/showcases/latest/route.ts`
- `src/app/api/prompts/by-title/route.ts`
- `src/shared/blocks/generator/image.tsx`

第三阶段新增页面：

- `src/app/[locale]/(landing)/models/nano-banana-pro/page.tsx`
- `src/config/locale/messages/en/pages/models/nano-banana-pro.json`
- `src/config/locale/messages/zh/pages/models/nano-banana-pro.json`

## 风险点

- 定价页不能只改文案。点数价格、套餐、扣费逻辑、支付商品 ID 必须一致。
- `promptTitle` 目前承担模板 key 的作用，长期不够稳，建议后续加 `slug`。
- 首页英文 SEO 文案不要再继续变长，否则用户体验会下降。
- 多语言站点要同步处理 canonical、hreflang 和 URL 结构，避免之前 hreflang 问题反复出现。
- AI Video 可以作为交叉销售，但 Banana Pro 首页主目标仍应是图片生成和图片编辑。

## 一句话路线

先学习 `gptimg2.art` 的“工具入口 + prompt 模板 + 定价解释 + 内容集群”闭环；短期用现有 ShipAny Two 能力快速改首页、导航、showcases 和 pricing；中期再补模型页、模板 slug、复制分享和 Blog 集群。
