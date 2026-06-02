# ShipAny Quick Start (Project Bootstrap) 深度学习手册

这个 Skill 是为 **ShipAny Nano Banana (AI 图像生成器)** 打造的自动化定制流。它的核心思路是：**用一份“项目简报 (Project Brief)”驱动全站 9 个维度的自动化替换。**

---
## 第一轮（v1）的自动化定制后，哪些还未完成

### 1. 业务逻辑与付费 (关键)
*   **配置定价方案**: 
    - 修改 `src/config/locale/messages/*/pages/pricing.json`。
    - 你需要在这里填入正式的套餐名称、积分数量以及 **Stripe Price ID**（如果你打算开启支付）。
*   **填补环境变量 (Secrets)**:
    - 我只帮你改了应用名称和域名，但核心密钥需要你填入 `.env.production`：
        - `STRIPE_SECRET_KEY`: 支付密钥。
        - 各类 AI 密钥: `KIE_API_KEY`, `REPLICATE_API_TOKEN` 等。
*   **配置登录 Provider**:
    - 登录功能目前是关闭的（禁用了登录入口（header.show_sign = false）），你需要在多语言配置中的 `landing.json` 中设置 `show_sign: true` 来开启它。


### 2. 内容与视觉 (收尾)
*   **替换正式图片**:
    - 目前落地页 (`pages/index.json`) 使用的是 `https://picsum.photos/` 的随机图。
    - **建议**: 生成几张 Banana Pro 真实的 AI 作品，上传到 `public/imgs/brand/`，然后把 JSON 里的 URL 改成指向这些本地文件。
*   **Logo 与 Favicon**:
    - 如你所说，目前的 `/public/logo.png` 是脚本生成的占位图。请将你设计的矢量 Logo 导出为 512x512 的 PNG 覆盖它；Favicon 同理。


### 3. 页面适配 (细节)
*   **首页文案微调**:
    - 修改 `pages/index.json`。
    
*   **Create 页面微调**:
    - 修改 `src/config/locale/messages/*/pages/create.json`。
    - 这里的 `prompt_suggestions`（提示词建议）目前可能还是通用的，你可以改成更符合“Banana Pro”调性的词，例如“A hyper-realistic banana-shaped spaceship in deep space”。
*   **完善导航栏**:
    - 我为了快速上线，在 `landing.json` 中隐藏了除“功能介绍”外的所有链接。当你准备好“定价”或“案例展示”页面后，记得在 `landing.json` 的 `header.nav.items` 中把它们加回来。
*   **法律页面最终核对**:
    - 虽然我更新了 `privacy-policy.mdx` 和 `terms-of-service.mdx`，但法律条款建议你根据最终选用的支付工具（如 Stripe 或 Creem）的合规要求做一下最后的文本校对。


-------------------

## Step 0 — 项目简报 (Project Brief Normalization)
### 核心目标
将用户模糊的需求描述转化为 AI 可识别的、确定的 **标准化字段**（Source of Truth）。

### 核心字段拆解
- **projectName**: 项目正式名称。
- **tagline**: 一句话 Slogan。
- **description**: 1-2 句核心功能描述。
- **branding**: 包含 `primaryColor` (Hex 格式) 和图片路径。
- **socialLinks**: 包含推特链接、Discord 链接、支持邮箱等。

### 关键规则 (Rules)
1. **安全第一**：V1 阶段绝对不开启 Auth（登录）、Database（数据库）或 Payment（支付）等私密配置，除非用户明确要求。
2. **TODO 标记**：如果简报里缺信息（比如还没想好域名），AI 会插入 `TODO: set your domain` 而不是胡编乱造。
3. **确定执行**：这个简报定稿后，后续所有步骤都必须严格引用这里的数据。

---

## Step 1 — 应用基础配置 (App Basics)
### 核心目标
通过环境变量 (.env) 确定项目的“身份证”信息，使其在代码中生效。

### 关键文件
- `.env.development` (本地开发)
- `.env.production` (生产环境)

### 必须执行的动作
1. **复制模板**：从 `.env.example` 复制出对应的环境文件。
2. **设置三要素**：
   - `NEXT_PUBLIC_APP_NAME` = 项目名
   - `NEXT_PUBLIC_APP_URL` = 域名（如 https://acme.ai）
   - `NEXT_PUBLIC_APP_LOGO` = 默认标志路径 (通常为 `/logo.png`)

### 学习建议
环境变量是整个项目的“开关”，改了它可以让全站的名称和图片路径瞬间切换。

---

## Step 2 — 全局 SEO 优化 (SEO Metadata)
### 核心目标
设置网页的“搜索引擎名片”，让 Google 能正确收录你的品牌。

### 关键文件
- `src/config/locale/messages/zh/common.json`
- `src/config/locale/messages/en/common.json`

### 必改字段 (TDK)
- **Title**: 建议格式为“项目名 — 标语”。
- **Description**: 简短的描述。
- **Keywords**: 项目名 + 3-8 个领域关键词。

### 核心逻辑
这里设置的是 **全局兜底**。如果某个页面（如隐私协议页）没有专门写 SEO，搜索引擎就会降级显示这里的全局信息。

---

## Step 3 — 落地页文案定制 (Landing Copy)
### 核心目标
通过 JSON 快速堆砌出专业的落地页内容，无需触碰 React 代码。

### 关键文件
- `pages/index.json`: 首页内容（Hero、功能、FAQ 等）。
- `landing.json`: 导航栏和页脚。

### 执行细节
1. **控制开关 (`show_sections`)**：在 JSON 中通过一个数组控制首页哪些模块显示（如 `["hero", "features", "faq"]`）。
2. **内容重写**：
   - **Hero**: 改标题、副标题、按钮颜色。
   - **Navigation**: 全局搜索并替换品牌名，隐藏掉暂时用不到的“登录”入口。
3. **禁止诱导**：V1 阶段必须删除所有关于“支持 Stripe 支付”、“谷歌一键登录”的虚假承诺，除非你已经配置好了。

---

## Step 4 — 主题颜色与风格 (Theme Styles)
### 核心目标
生成一套符合品牌行业属性的视觉方案，达到类似专业 UI 编辑器（Tweakcn）的效果。

### 关键文件
- `src/config/style/theme.css`

### 核心技巧 (Vibe Check)
- **开发者工具**：选蓝色/青色（专业、清晰）。
- **AI/创意类**：选紫色/粉色（充满能量）。
- **金融合规**：选深蓝/灰（稳定）。

### 关键规则
使用 **OKLCH** 颜色模型进行配置。你可以只改 `--primary`（主色），AI 会自动帮你推演出对应的 Accent（强调色）、Ring（光环）和背景色，确保亮暗模式下都有极佳的对比度。

---

## Step 5 — Logo 与 Favicon
### 核心目标
通过自动化脚本制作属于你自己的 Logo，彻底告别“香蕉”图标。

### 关键文件
- `public/logo.png`
- `public/favicon.ico`

### 自动化操作 (Shell)
Skill 内部自带一个 `generate-logo.py` 脚本：
- **逻辑**：提取品牌名称的首字母（如 Acme -> A），结合简报里的主色调，生成一个极简风格的 Logo。
- **校验**：生成后必须检查 `public/` 下是否存在新文件。

---

## Step 6 — 站点地图 (Sitemap)
### 核心目标
告诉搜索引擎爬虫，你的网站有哪些合法路径。

### 关键文件
- `public/sitemap.xml`

### 必须动作
- 将模板里的 `your-domain.com` 全局替换为简报里的 `appUrl`。
- 更新 `<lastmod>`（最后修改日期）为今天。

---

## Step 7 — 法律条款自动化 (Legal Pages)
### 核心目标
快速生成合规的隐私协议和用户协议。

### 关键文件
- `content/pages/privacy-policy.mdx` (及 .zh.mdx)
- `content/pages/terms-of-service.mdx`

### 执行细节
全局自动搜索并替换：
- `YourAppName` -> 你的项目名
- `your-domain.com` -> 你的域名
- `support@your-domain.com` -> 你的支持邮箱

---

## Step 8 — 图像内容替换 (Images)
### 核心目标
去模板化，用真实图片或 Picsum 占位图建立品牌视觉。

### 关键逻辑 (由高到低优先)
1. **链接抓取**：AI 会运行 `fetch_og_image.py` 从你给的参考链接抓图。
2. **Picsum 占位**：如果没有实拍图，使用 `https://picsum.photos/`。
3. **黑技术 (Seed 技巧)**：在 URL 中加入 `seed=my-hero`，图片在刷新页面时就不会乱变，保证视觉稳定。

### 关键位置
主要在 `pages/index.json` 中更新所有的 `src` 路径。

详细版：
核心目标是：在项目启动的 V1 阶段，彻底替换掉模板自带的默认截图，换成与你项目相关的真实图片或安全的占位图。

以下是该模块的关键点概括，方便你快速掌握：

1. 核心铁律：禁止保留模板默认图
绝对不能在上线版本中看到模板自带的 /imgs/features/admin.png 或 shipany 的相关截图。这会让产品看起来非常不专业。

2. 图片获取的优先级 (由高到低)
优先提取引用链接：如果你在简报中提供了参考网站或竞品链接，我会优先尝试抓取它们的 og:image（社交分享图）或产品截图。
使用 Picsum 占位图：如果没有真实图片，我会使用 https://picsum.photos/。
技巧：使用“种子 (Seed)”模式（例如 seed=my-app-hero），这样图片在刷新后依然保持固定，不会随机跳变。
品牌标识：Logo 和 Favicon 必须是全新的（参考 Step 5）。
3. 图片配置在哪里？
图片路径主要写在以下两个 JSON 翻译文件中：

pages/index.json：存放首页各个区块（Hero, Features, Benefits 等）的图片路径。
landing.json：存放 Header 和 Footer 的品牌 Logo 路径。
4. 建议的图片尺寸
Hero 主图：1200 × 800
功能区块图：960 × 640
小卡片缩略图：640 × 480
建议格式：优先使用 .webp 以减小体积。
5. 自动化脚本支持
该 Skill 附带了一个脚本 scripts/fetch_og_image.py。

它的作用是：你给我一个 URL，它能自动帮你把该网页的预览图爬取下来并保存到项目中，这在参考竞品风格时非常高效。
学习建议： 在实际操作时，你不需要手动去改图片文件，只需要告诉我你的参考链接。我会运行脚本抓取图片，或者为你配置好带 Seed 的 Picsum 链接，并自动填入到 index.json 中。

这就是“Images”步骤的精髓：去模板化，快速建立品牌视觉。
---

## Step 9 — 终极核对与清理 (Checklist)
### 核心目标
在交卷前，确保没有任何“灵异 Bug”和缓存残留。

### 必须执行的命令 (Windows 版)
1. **安装依赖**：`pnpm install`
2. **彻底清理缓存**（最重要！）：`Remove-Item -Recurse -Force .next`
3. **本地完整编译**：`pnpm build`

### 毕业标准
- **无 Lint 报错**：没有拼写或语法警告。
- **无模版残留**：全站搜索不到 "ShipAny" 这个单词（除非你自己要留着）。
