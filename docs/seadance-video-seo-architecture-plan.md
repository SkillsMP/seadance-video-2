# Seadance.video SEO 架构重构与页面补充规划

> 目标：参考 `minimaxh3.co` 以及 Seedance 赛道中做得较好的竞品，把关键词从“文章层面”升级为“网站信息架构层面”，让核心关键词、功能词、版本词、商业词、对比词、教程词分别拥有清晰、稳定、可扩展的 URL。
>
> 适用站点：`https://seadance.video/`

---

# 1. 核心结论

目前 `seadance.video` 已经具备不错的 SEO 骨架，尤其已经覆盖：

- What is Seedance
- How to use Seedance
- Pricing
- Seedance API
- Seedance 2.5
- Seedance 2.5 API
- Seedance 2.5 vs Seedance 2.0
- Prompt
- Compare
- Seedance vs MiniMax H3
- Seedance vs Veo
- Open Source
- Watermark / Copyright

当前最大问题不是“没有 SEO 页面”，而是：

> **核心产品能力关键词还没有完全产品化成独立 Landing Page。**

最优先应该补：

```text
/text-to-video
/image-to-video
/video-to-video
/reference-to-video
```

这是最值得参考 `minimaxh3.co` 的地方。

最终目标不是做“一堆 Seedance 文章”，而是建立完整的：

> **Seedance Search Intent Map**

即：

```text
实体词
→ 功能词
→ 版本词
→ 商业词
→ 教程词
→ Prompt 词
→ 对比词
→ Use Case 词
→ 技术词
```

---

# 2. 为什么 minimaxh3.co 值得学习

`minimaxh3.co` 做得好的核心并不是文章数量，而是：

> **把关键词直接变成网站架构。**

典型结构可以概括为：

```text
MiniMax H3
│
├── Text to Video
├── Image to Video
├── Video to Video
├── Reference to Video
│
├── Prompt Guide
├── Prompt Enhancer
├── Prompts
├── How to Use
│
├── Review
├── Free
│
├── Alternatives
├── Comparisons
│
└── Technical
    ├── ComfyUI
    ├── GGUF
    ├── License
    └── Open Source
```

它真正建立的是：

```text
实体词
├── 功能词
├── 教程词
├── 商业词
├── 对比词
└── 技术词
```

这种方式比单纯写大量 Blog 更稳定，因为高价值关键词拥有自己的长期 URL。

---

# 3. Seedance 竞品中值得学习的模式

## 3.1 seedvideo.net

### 最值得学

它是目前比较接近 `minimaxh3.co` 思路的 Seedance 站之一。

特点：

- 核心功能独立页面
- Prompt 独立 Hub
- Comparison 独立 Hub
- Use Case 独立页面
- 商业关键词产品化

典型思路：

```text
/
├── /seedance-2-workflows
├── /seedance-2-prompts
├── /seedance-2-image-to-video
├── /seedance-2-text-to-video
├── /seedance-2-pricing-calculator
│
├── /seedance-2-comparisons
│   ├── seedance-vs-veo
│   ├── seedance-vs-kling
│   ├── seedance-vs-runway
│   └── seedance-vs-hailuo
│
├── /seedance-2-use-cases
├── /seedance-2-for-ugc-ads
├── /seedance-2-ai-video-batch-production
│
└── /seedance-2-prompt-hub
```

### 可借鉴

不是照抄 URL，而是学习：

> **把高搜索意图关键词升级成永久 Landing Page。**

---

## 3.2 seedance.tv

### 最值得学

它更像：

> **Seedance + AI Video Tool 长尾扩张机器**

主要模式：

```text
Seedance
→ Feature
→ Tool
→ Use Case
→ Blog
→ Docs
```

例如工具型关键词不只写成 Blog：

```text
/blog/how-to-create-product-ad
```

而是直接建立工具页：

```text
/ai-product-ad-video-generator
```

这非常重要。

因为两种页面搜索意图不同：

### Blog

```text
how to make product ads with ai
```

偏：

- Informational
- 教程
- 学习

### Tool Landing Page

```text
ai product ad video generator
```

偏：

- Transactional
- Tool Intent
- 转化

### 对 Seadance.video 的启发

以后不要所有长尾都做 Blog。

高商业价值关键词应该考虑：

```text
/ai-product-video-generator
/ai-ugc-ad-generator
/ai-social-video-generator
/ai-short-film-generator
```

---

# 4. tryseedance.ai 值得学习的地方

它最大的优点是：

> **商业意图和信息意图分得非常清楚。**

类似：

```text
/pricing
/seedance-api
/seedance-2-0-free
/seedance-2-0
/seedance-2-5
```

然后：

```text
/blog/what-is-seedance
/blog/how-to-use-seedance
/blog/seedance-prompt-guide
```

可以总结为：

## 商业词

直接 Landing Page：

```text
pricing
free
api
generator
model
```

## 信息词

进入 Blog / Guide：

```text
what is
how to
tutorial
guide
tips
```

这是 `seadance.video` 后续 URL 规划应该长期遵守的原则。

---

# 5. seedanceart.com 值得学习的地方

它比较值得参考的是：

> **模型版本做 Product Hub。**

例如：

```text
/seedance-2
/seedance-2-5
```

然后通过大量相关文章支撑模型页面：

```text
/blog/seedance-2-5-vs-seedance-2-0
/blog/seedance-2-0-guide
/blog/seedance-prompts
```

形成：

```text
Blog
 ↓
Model Hub
 ↓
Generator / CTA
```

这个内链方向是正确的。

---

# 6. Seadance.video 建议的最终 SEO 架构

建议最终形成以下结构。

```text
                         SEEDANCE
                            │
       ┌────────────────────┼────────────────────┐
       ↓                    ↓                    ↓
     CREATE                LEARN                MODELS
       │                    │                    │
       │                    │               /seedance-2-0
       │                    │               /seedance-2-5
       │                    │                    │
       │                    │             ┌──────┼──────┐
       │                    │             ↓      ↓      ↓
       │                    │            API   Prompt  Compare
       │                    │
       ↓                    ↓
/text-to-video       /what-is-seedance
/image-to-video      /how-to-use-seedance
/video-to-video      /prompts
/reference-to-video  /guides
       │
       │
       ↓
    COMMERCIAL
       │
 ┌─────┼─────┐
 ↓     ↓     ↓
Free Pricing API


                    COMPARISONS
                         │
            ┌────────────┼────────────┐
            ↓            ↓            ↓
      Seedance vs     Seedance vs    Seedance vs
         Kling            Veo        MiniMax H3


                      USE CASES
                         │
                  Product Video
                     UGC Ads
                   Short Film
                  Music Video
                  Social Video


                     TECHNICAL
                         │
                    Open Source
                     Copyright
                     Watermark
                        API
```

---

# 7. P0：现在最应该补的页面

优先级最高。

---

## P0-1 `/text-to-video`

### 主关键词

```text
seedance text to video
seedance ai text to video
text to video ai
seedance text to video generator
```

### 页面意图

Transactional + Product

用户不是来看科普，而是：

> 我要把文字直接生成视频。

### 页面应包含

```text
H1: Seedance Text to Video

Intro
→ Seedance Text to Video 是什么

Generator
→ 直接生成区域

How it works
→ Prompt
→ Generate
→ Download / Continue Editing

Capabilities
→ Camera movement
→ Multi-shot
→ Native audio
→ Motion
→ Character consistency

Prompt examples

Use cases
→ Ads
→ Social
→ Film
→ Ecommerce

Seedance 2.5 / 2.0 differences

FAQ

CTA
```

---

## P0-2 `/image-to-video`

### 主关键词

```text
seedance image to video
seedance ai image to video
image to video ai
seedance image animation
```

### 页面重点

重点不是重复 Text-to-Video 文案。

需要回答：

- 上传什么图片
- 图片如何变成视频
- 如何控制运动
- 人物一致性
- 摄像机运动
- 产品图动画
- 首帧参考
- Prompt 怎么写

### Use Case

重点覆盖：

```text
portrait animation
product image animation
anime image to video
cinematic image animation
ecommerce product video
```

---

## P0-3 `/video-to-video`

### 主关键词

```text
seedance video to video
seedance ai video to video
ai video transformation
video restyle ai
```

### 页面重点

解释清楚：

```text
Reference Video
→ Motion
→ Camera
→ Composition
→ Style
→ Generated Video
```

适合：

- Restyle
- Camera reference
- Motion reference
- Character / Scene transformation

---

## P0-4 `/reference-to-video`

这是很值得提前占的页面。

### 主关键词

```text
seedance reference to video
seedance reference video
reference video generator
ai reference to video
```

这个页面应该强调 Seedance 的 Reference 能力：

```text
Image reference
Video reference
Audio reference
Character reference
Style reference
Camera reference
```

这个词目前竞争可能比普通 Text-to-Video 小，但非常符合 Seedance 产品差异化。

---

# 8. P0：修改 `/what-is-seedance`

当前页面不用推倒重写。

问题主要是：

> 回答了“Seedance 是什么”，但没有完全回答“它能做什么、怎么用、现在最新版是什么”。

推荐结构：

```text
H1 What Is Seedance?

一句话 Featured Snippet 定义

Seedance in Plain Language

Who Created Seedance?

Seedance vs Seedream

What Can Seedance Do?

Seedance Versions

Seedance 2.0 vs Seedance 2.5

How Does Seedance Work?

What Is Seedance Used For?

Where Can You Use Seedance?

Is Seedance Free?

Is Seedance Open Source?

FAQ
```

---

## 建议删弱的模块

目前类似：

```text
What to check when researching Seedance
```

不是 `what is seedance` 的核心搜索意图。

建议弱化或删除。

替换成：

```text
What Can Seedance Do?
```

---

## 建议首段

方向：

```text
Seedance is ByteDance's AI video generation model family.

It can create and edit videos from text, images, audio, and reference videos.

The latest Seedance generation focuses on multimodal video creation, multi-shot storytelling, reference control, and synchronized audio-video generation.
```

目的：

前三句话分别解决：

1. 是什么
2. 能做什么
3. 为什么现在值得关注

---

# 9. P1：版本词集群

建议强化：

```text
/seedance-2-0
/seedance-2-5
```

并形成独立 Cluster。

---

## `/seedance-2-5`

建议支持：

```text
/seedance-2-5
├── /api
├── /prompts
├── /pricing
├── /vs-seedance-2-0
├── /text-to-video
├── /image-to-video
└── /how-to-use
```

注意：

不要为了 SEO 机械创建大量近似页面。

只有当搜索意图明显不同才建立 URL。

---

# 10. P1：Comparison Cluster

你已经有：

```text
/compare
/compare/seedance-vs-minimax-h3
/compare/seedance-vs-veo
```

可以继续补：

```text
/compare/seedance-vs-kling
/compare/seedance-vs-runway
/compare/seedance-vs-sora
/compare/seedance-vs-hailuo
```

---

## Comparison 页面模板

每页应该回答：

```text
Quick Answer

Model overview

Video quality

Prompt adherence

Motion

Character consistency

Audio

Video length

Reference support

Speed

Pricing

API

Best for

Final recommendation
```

不要写成：

> 两个模型功能介绍拼起来。

核心必须是：

> **帮助用户做选择。**

---

# 11. P1：Prompt Cluster

现有 Prompt 页面应该继续发展。

推荐：

```text
/prompts
/prompts/seedance-2-0
/prompts/seedance-2-5
```

后续可以扩：

```text
/prompts/cinematic
/prompts/product-video
/prompts/ugc-ads
/prompts/camera-movement
/prompts/character-consistency
/prompts/image-to-video
```

但不要一次全上。

优先看：

- 搜索量
- Search Console impressions
- 真实用户需求
- 产品使用数据

再扩展。

---

# 12. P1：商业关键词

必须持续强化：

```text
/pricing
/seedance-api
```

可以研究是否值得建立：

```text
/seedance-free
```

但要注意：

如果页面实际上不能真正免费使用，不要为了关键词制造误导页面。

可以做：

```text
Is Seedance Free?
```

然后真实解释：

- 官方渠道
- 第三方渠道
- 免费 credits
- Trial
- API pricing

---

# 13. P2：Use Case 页面

这是后续扩张阶段。

不要一开始做 50 个。

优先做最接近付费用户的。

推荐：

```text
/use-cases/product-video
/use-cases/ugc-ads
/use-cases/social-video
/use-cases/short-film
/use-cases/music-video
```

也可以直接使用更强关键词 URL：

```text
/ai-product-video-generator
/ai-ugc-ad-generator
/ai-social-video-generator
```

---

# 14. Blog 与 Landing Page 的边界

这是以后必须统一的规则。

---

## 应该做 Landing Page 的关键词

用户明显想：

> 直接使用一个功能。

例如：

```text
Seedance Text to Video
Seedance Image to Video
Seedance API
AI Product Video Generator
Seedance Pricing
```

对应：

```text
/text-to-video
/image-to-video
/seedance-api
/ai-product-video-generator
/pricing
```

---

## 应该做 Blog / Guide 的关键词

用户明显想：

> 学习、了解、比较、解决问题。

例如：

```text
what is seedance
how to use seedance
seedance prompt guide
how to animate product images
best seedance prompts
```

可以做：

```text
/what-is-seedance
/how-to-use-seedance
/blog/...
/guides/...
```

---

# 15. URL 设计原则

以后新增页面尽量遵守。

---

## 原则 1：短 URL

推荐：

```text
/text-to-video
/image-to-video
/pricing
/seedance-api
```

避免：

```text
/ai-tools/seedance-ai-video-generator/text-to-video-tool
```

---

## 原则 2：一个核心 Intent 一个 URL

例如：

```text
/text-to-video
```

就应该成为站内：

> Seedance Text to Video 的主页面。

不要同时存在：

```text
/seedance-text-to-video
/text-to-video
/tools/text-to-video
```

三个高度相似页面。

避免 Cannibalization。

---

## 原则 3：功能 URL 不要绑定版本

优先：

```text
/text-to-video
```

而不是：

```text
/seedance-2-5-text-to-video
```

原因：

版本会变化。

未来 Seedance 3 出来后：

```text
/text-to-video
```

仍然可以保留 authority。

页面内部更新模型版本即可。

---

## 原则 4：版本页面负责版本关键词

例如：

```text
/seedance-2-5
```

负责：

```text
Seedance 2.5
Seedance 2.5 AI
Seedance 2.5 video model
```

而：

```text
/text-to-video
```

负责：

```text
Seedance text to video
```

不要混淆。

---

# 16. 内链架构

推荐形成稳定的内部链接流。

---

## 首页

链接：

```text
Homepage
│
├── Text to Video
├── Image to Video
├── Video to Video
├── Seedance 2.5
├── Pricing
├── API
└── What is Seedance
```

---

## 功能页

例如：

```text
/text-to-video
```

内部链接：

```text
→ Seedance 2.5
→ Image to Video
→ Prompt Guide
→ How to Use Seedance
→ Pricing
→ API
```

---

## What Is Seedance

链接：

```text
→ Seedance 2.5
→ Text to Video
→ Image to Video
→ How to Use
→ Pricing
→ API
→ Compare
```

---

## Blog

Blog 不应该成为孤岛。

每篇文章至少链接：

```text
1 个核心模型页
1 个功能页
1 个相关教程/比较页
```

---

# 17. 页面 SEO Template

每个产品 Landing Page 尽量保持统一结构。

---

## Title

例如：

```text
Seedance Text to Video AI Generator | Seadance Video
```

---

## Meta Description

回答：

```text
是什么 + 能做什么 + 差异化能力
```

而不是堆关键词。

---

## H1

必须直接对应关键词：

```text
Seedance Text to Video
```

---

## 首屏

应该在 5–10 秒内让用户知道：

```text
这是什么
能做什么
为什么用
怎么开始
```

---

## 页面主体

建议：

```text
H1

Short answer

Generator

What it does

How it works

Features

Examples

Prompt examples

Use cases

Model/version information

FAQ

CTA
```

---

# 18. 不建议做的事情

---

## 18.1 不要一次铺 100 个 AI SEO 页面

先完成：

```text
4 个 Feature Page
+ 版本页
+ 商业页
+ Compare
+ Prompt
```

这是最重要的骨架。

---

## 18.2 不要为了关键词重复页面

避免：

```text
/seedance-image-to-video
/image-to-video
/ai-image-to-video
```

三个页面内容 80% 一样。

---

## 18.3 不要所有关键词都塞 Blog

高商业 Intent 必须 Landing Page 化。

---

## 18.4 不要所有页面都只讲 Seedance 历史

功能页必须：

> 产品能力 + 真实使用 + Generator + Prompt + Use Case

---

## 18.5 不要只盯 Search Volume

新模型关键词最大机会之一就是：

> Keyword tools 还没来得及显示搜索量。

所以 Seedance 新版本发布后：

```text
Feature
API
Prompts
Pricing
How to Use
Compare
```

应该快速跟进。

---

# 19. 推荐执行顺序

## 第一阶段：P0

先做这 5 个动作：

```text
1. /text-to-video
2. /image-to-video
3. /video-to-video
4. /reference-to-video
5. 重构 /what-is-seedance
```

---

## 第二阶段：P1

```text
6. 强化 /seedance-2-5
7. 强化 /seedance-api
8. 强化 /pricing
9. 新增 Seedance vs Kling
10. 新增 Seedance vs Runway
11. 扩 Prompt Cluster
```

---

## 第三阶段：P2

```text
12. Product Video
13. UGC Ads
14. Social Video
15. Short Film
16. Music Video
```

---

# 20. 推荐 Site Map

第一版可以收敛成：

```text
/
│
├── text-to-video
├── image-to-video
├── video-to-video
├── reference-to-video
│
├── seedance-2-0
├── seedance-2-5
│   ├── api
│   └── vs-seedance-2-0
│
├── what-is-seedance
├── how-to-use-seedance
│
├── prompts
│   ├── seedance-2-0
│   └── seedance-2-5
│
├── pricing
├── seedance-api
│
├── compare
│   ├── seedance-vs-minimax-h3
│   ├── seedance-vs-veo
│   ├── seedance-vs-kling
│   └── seedance-vs-runway
│
├── seedance
│   ├── open-source
│   └── watermark-copyright
│
└── blog
```

---

# 21. 最重要的 SEO 思维变化

以前容易变成：

```text
找到关键词
→ 写文章
```

以后应该变成：

```text
找到关键词
↓
判断搜索意图
↓
决定页面类型
↓
决定 URL
↓
决定它在网站架构中的位置
↓
建立内部链接
↓
最后才写内容
```

也就是说：

> **先做 Search Intent Architecture，再做 Content。**

---

# 22. 最终策略

Seadance.video 不应该复制某一家竞品。

建议组合学习：

### 网站骨架

学习：

```text
minimaxh3.co
+
seedvideo.net
```

核心：

> Keyword → URL → Cluster

---

### 商业关键词

学习：

```text
tryseedance.ai
```

核心：

> Pricing / API / Free / Model 页面独立。

---

### 长尾扩张

学习：

```text
seedance.tv
```

核心：

> 高商业价值长尾从 Blog 升级成 Tool Page。

---

### Model Hub

学习：

```text
seedanceart.com
```

核心：

> Model Page + Supporting Content Cluster。

---

# 23. Seadance.video 的最终定位

目标不是：

> “一个可以生成 Seedance 视频的网站。”

而应该逐渐成为：

> **围绕 Seedance 搜索需求最完整的产品 + 内容入口。**

形成：

```text
What is Seedance
        ↓
How to Use
        ↓
Choose Version
        ↓
Choose Mode
        ↓
Text / Image / Video / Reference
        ↓
Prompt
        ↓
Generate
        ↓
Pricing / API
        ↓
Compare
        ↓
Use Cases
```

这样用户从：

> “Seedance 是什么？”

一路可以走到：

> “我要开始生成 / 我要购买 / 我要接 API。”

这才是完整的 SEO + Product Funnel。

---

# 24. 当前最高优先级清单

如果只做最重要的事情：

- [ ] 新增 `/text-to-video`
- [ ] 新增 `/image-to-video`
- [ ] 新增 `/video-to-video`
- [ ] 新增 `/reference-to-video`
- [ ] 重构 `/what-is-seedance`
- [ ] 检查 `/seedance-2-5` 内容完整度
- [ ] 检查 `/pricing` 是否覆盖 Seedance pricing 意图
- [ ] 检查 `/seedance-api` 是否覆盖 API intent
- [ ] 补 `/compare/seedance-vs-kling`
- [ ] 补 `/compare/seedance-vs-runway`
- [ ] 建立统一内部链接规则
- [ ] 后续再扩 Use Case 页面

---

# 25. 一句话执行原则

> **不要继续无序堆 Blog。先把 Seedance 的核心搜索意图，变成一套清晰、可扩展、互相内链的 URL 架构。**
