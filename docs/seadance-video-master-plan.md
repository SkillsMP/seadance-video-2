# Seadance.video 产品改版与 SEO 架构总规划 (Master Plan)

> **核心定位**：将 `seadance.video` 打造成围绕 Seedance 搜索意图最完整、转化效率最高的 **“AI 视频生成产品 + 内容流量入口”**。  
> **双轮驱动引擎**：
> 1. **获客引擎（SEO 战略）**：摆脱盲目堆砌博客的旧模式，建立以“搜索意图（Search Intent）”为核心的永久 URL 架构与产品 Landing Page 矩阵。
> 2. **转化引擎（产品体验战术）**：重塑首页前 2~3 屏，彻底解决“平均停留 4 秒、跳出率 80%”的痛点，构建 **“价值主张 → 真实成片 → 立即操作”** 的极速转化漏斗。
>
> **适用站点**：`https://seadance.video/`  
> **技术底座原则**：基于 ShipAny Two 现代化架构，小步快跑、低入侵、零重构负担，不破坏支付、认证与数据库底座。

---

# 目录

- [第一篇：战略定位与核心洞察](#第一篇战略定位与核心洞察)
  - [1. 核心痛点与诊断](#1-核心痛点与诊断)
  - [2. 双轮驱动转化漏斗模型](#2-双轮驱动转化漏斗模型)
- [第二篇：全站 SEO 架构与搜索意图地图](#第二篇全站-seo-架构与搜索意图地图)
  - [3. 竞品经验汲取与模式提炼](#3-竞品经验汲取与模式提炼)
  - [4. 全站信息架构 (Site Map)](#4-全站信息架构-site-map)
  - [5. URL 设计与规范原则](#5-url-设计与规范原则)
  - [6. 核心功能 Landing Page 建设方案 (P0)](#6-核心功能-landing-page-建设方案-p0)
  - [7. 模型版本与对比集群规划 (P1)](#7-模型版本与对比集群规划-p1)
  - [8. 商业与场景关键词规划 (P1~P2)](#8-商业与场景关键词规划-p1p2)
  - [9. 网状内链拓扑规则](#9-网状内链拓扑规则)
  - [10. 标准落地页 SEO 结构规范 (Page Template)](#10-标准落地页-seo-结构规范-page-template)
- [第三篇：首页产品化重塑与跳出率救火方案](#第三篇首页产品化重塑与跳出率救火方案)
  - [11. 首页 4 大致命问题及解决原则](#11-首页-4-大致命问题及解决原则)
  - [12. 最终首页信息流结构](#12-最终首页信息流结构)
  - [13. 首屏 Hero 规范与视觉布局](#13-首屏-hero-规范与视觉布局)
  - [14. 生成器 (Generator) 体验与无缝引导](#14-生成器-generator-体验与无缝引导)
  - [15. 案例展示 (Showcase) 视频化与 Prompt 联动](#15-案例展示-showcase-视频化与-prompt-联动)
  - [16. 导航栏 (Navigation) 极简化重构](#16-导航栏-navigation-极简化重构)
  - [17. 视觉调优策略 (Dark Cinema)](#17-视觉调优策略-dark-cinema)
- [第四篇：总执行路线图 (Master Roadmap)](#第四篇总执行路线图-master-roadmap)
  - [18. 分阶段执行清单与当前进展](#18-分阶段执行清单与当前进展)
- [第五篇：工程规范与反模式指南](#第五篇工程规范与反模式指南)
  - [19. 明确禁止做的事 (Anti-Patterns)](#19-明确禁止做的事-anti-patterns)
- [第六篇：数据监控与效果验证体系](#第六篇数据监控与效果验证体系)
  - [20. 核心验证指标与成功标准](#20-核心验证指标与成功标准)

---

# 第一篇：战略定位与核心洞察

## 1. 核心痛点与诊断

网站上线初期面临两个根本矛盾：
1. **转化端矛盾**：首页充斥着“Seedance 2.5 刚公布”、“内测暂不可用”、“Coming soon”、“读 2.5 FAQ”等新闻资讯。搜索进入的用户在 3~4 秒内误以为这是个“蹭热点的资讯不可用站”，产生极高跳出率（约 80%），未能转化为工具使用者。
2. **获客端矛盾**：已有一定 SEO 页面，但高搜索意图的核心能力词（如 `seedance text to video`、`seedance image to video`）没有独立的产品落地页，而是淹没在博客文章中。博客承载的是 Informational 意图，无法满足用户的 Transactional（直接使用工具）意图。

## 2. 双轮驱动转化漏斗模型

Seadance.video 不做纯粹的内容站，也不做脱离搜索生态的孤立 SaaS，而是打造闭环漏斗：

```text
       【SEO 矩阵精准获客】
       Search Intent Keywords (Google / Bing / AI Search)
               │
      ┌────────┼─────────────────┬────────────────┐
      ↓        ↓                 ↓                ↓
   实体认知   核心功能落地页     版本/对比页     提示词库
  /what-is-   /text-to-video    /seedance-2-5    /prompts
  seedance    /image-to-video   /compare/...
      │        │                 │                │
      └────────┴────────┬────────┴────────────────┘
                        ↓
            【极致转化体验（产品主线）】
            Hero 价值直击 → 真实视频自证
                        ↓
            免登录试用 / 一键带入 Prompt
                        ↓
            生成完成 / 消耗引导 / 账号留存
                        ↓
            【商业变现】
            订阅会员 (/pricing) / API 接入 (/seedance-api)
```

---

# 第二篇：全站 SEO 架构与搜索意图地图

## 3. 竞品经验汲取与模式提炼

本方案深度融合各细分领域标杆竞品的底层逻辑：

1. **学习 `minimaxh3.co` 的架构化思维**：
   - 核心不是海量文章，而是**把关键词直接升级为网站信息架构**。核心功能全部拥有永久独立的 URL。
2. **学习 `seedvideo.net` 的产品化落地页**：
   - 核心功能独立页 + 独立 Prompt Hub + Comparison 对比矩阵 + 商业词落地页。
3. **学习 `seedance.tv` 的长尾工具页思维**：
   - 工具型长尾词不写成弱转化的博客（如 `/blog/how-to-make-product-ads`），而是升级为转化型工具页（如 `/ai-product-ad-video-generator`）。
4. **学习 `tryseedance.ai` 的意图严苛分离**：
   - 商业意图（Pricing / API / Generator / Free）走 Landing Page；信息意图（What is / How to / Guide）走 Blog/Doc。
5. **学习 `seedanceart.com` 的模型 Hub 内链闭环**：
   - 围绕核心模型版本（`/seedance-2-0`, `/seedance-2-5`），由周边测评、对比与教程文章形成强网状内链反哺。

## 4. 全站信息架构 (Site Map)

最终规划形成的清晰、可扩展、互联互通的 URL 拓扑体系：

```text
                           seadance.video/ (首页)
                                     │
    ┌────────────────┬───────────────┼───────────────┬────────────────┐
    ↓                ↓               ↓               ↓                ↓
【CORE TOOLS】  【MODEL HUBS】  【LEARN & DOCS】 【PROMPT HUB】   【COMMERCIAL】
    │                │               │               │                │
 ├── /text-to-    ├── /seedance-  ├── /what-is-   ├── /prompts     ├── /pricing
 │   video        │   2-0         │   seedance    ├── /prompts/    ├── /seedance-
 ├── /image-to-   └── /seedance-  ├── /how-to-    │   seedance-2-0 │   api
 │   video            2-5         │   use-        └── /prompts/    └── /seedance-
 ├── /video-to-       ├── /api    │   seedance        seedance-2-5     free (真实问答)
 │   video            └── /vs-    └── /blog/
 └── /reference-          seedance-   └── (深度长尾)
     to-video             2-0
                                     │
                    ┌────────────────┴────────────────┐
                    ↓                                 ↓
            【COMPARISONS】                     【USE CASES】
                    │                                 │
             ├── /compare/                     ├── /use-cases/product-video
             ├── /compare/seedance-vs-kling    ├── /use-cases/ugc-ads
             ├── /compare/seedance-vs-minimax- ├── /use-cases/social-video
             │   h3                            └── /use-cases/short-film
             ├── /compare/seedance-vs-veo
             └── /compare/seedance-vs-runway
```

## 5. URL 设计与规范原则

1. **简短且自解释**：
   - 推荐 `/text-to-video`、`/image-to-video`、`/pricing`。
   - 严禁 `/ai-tools/seedance-ai-video-generator/text-to-video-tool` 这种层级过深的 URL。
2. **一个核心 Intent 对应唯一 URL（杜绝关键词蚕食 Cannibalization）**：
   - `/text-to-video` 作为站内 Text-to-Video 的权威单页，严禁同时搞 `/seedance-text-to-video`、`/tools/text-to-video` 等内容相似度超过 70% 的近亲页面。
3. **功能 URL 解耦版本号（权重长期积累原则）**：
   - 统一采用 `/text-to-video`，而不是 `/seedance-2-5-text-to-video`。模型会不断演进（2.0 → 2.5 → 3.0），但功能的权威 URL 必须保持不变，内部切换生成引擎即可，永久继承反向链接权重。
4. **版本页承担版本词汇**：
   - `/seedance-2-5` 负责承接 `Seedance 2.5`、`Seedance 2.5 release date` 等版本意图；`/text-to-video` 负责承接 `Seedance text to video` 功能意图。

## 6. 核心功能 Landing Page 建设方案 (P0)

这是除首页救火外，流量获取优先级最高的第一批建设目标：

### 6.1 `/text-to-video`
- **主关键词**：`seedance text to video`, `seedance ai text to video`, `text to video ai`, `seedance text to video generator`
- **意图属性**：Transactional + Tool Intent
- **页面构成**：
  - H1: `Seedance Text to Video AI Generator`
  - 首屏一句话定义 + 嵌入生成器（预置 Text 模式）
  - 核心工作流：Prompt → Generate → 4K/HD Export
  - 专业控制能力说明：运镜语言、多镜头叙事、电影级光影
  - 精选 Text Prompt 示例库及真实视频回放
  - 常见 Use Case（商业广告、社交短剧、电商）
  - FAQ 与 CTA

### 6.2 `/image-to-video`
- **主关键词**：`seedance image to video`, `seedance ai image to video`, `image to video ai`, `seedance image animation`
- **意图属性**：Transactional + Tool Intent
- **差异化焦点**：
  - 首帧参考图控制动画、人物面部与服饰一致性、产品白底图转运镜视频、动漫静态图转运镜。
  - 解决痛点：如何通过微动提示词防止肢体崩坏变形。

### 6.3 `/video-to-video`
- **主关键词**：`seedance video to video`, `seedance ai video to video`, `ai video transformation`, `video restyle ai`
- **差异化焦点**：动作捕捉参考、运镜轨迹重用、场景艺术风格重塑（Restyle）。

### 6.4 `/reference-to-video`
- **主关键词**：`seedance reference to video`, `seedance reference video`, `ai reference to video`
- **战略价值**：Seedance 最具杀伤力的差异化特性。重点展示多模态输入（图片角色、音频情绪、参考视频运镜、白模/粘土空间阻塞图）对最终生成视频的综合控制。

### 6.5 重构 `/what-is-seedance`
- **现状痛点**：回答了抽象概念，但缺少“它能做什么、怎么用、最新版本是什么”。
- **改造重点**：
  - 首段设计针对 Google Featured Snippet（3句话覆盖：字节跳动AI视频模型家族、支持多模态输入生成、聚焦长视频与镜头控制）。
  - 弱化无意义的泛分析模块，替换为核心能力图谱与实操指引。

## 7. 模型版本与对比集群规划 (P1)

### 7.1 版本模型 Hub (`/seedance-2-5`)
- 作为 2.5 的官方权威解说站，支持二级链接 `/seedance-2-5/api`、`/seedance-2-5/vs-seedance-2-0`。
- 绝不因暂未直连而在全站搞“虚假承诺”或“消极劝退”，而是作为技术百科与版本动态追踪中心。

### 7.2 对比集群 (Comparison Cluster)
- 现有已有：`/compare/seedance-vs-minimax-h3`, `/compare/seedance-vs-veo`。
- 待扩建：
  - `/compare/seedance-vs-kling`（快手可灵：时长、运镜控制、3D 阻塞对比）
  - `/compare/seedance-vs-runway`（Runway Gen-3：运镜灵敏度、画质与价格对比）
  - `/compare/seedance-vs-sora`
- **编写原则**：杜绝简单功能参数拼接，必须以 **“帮助用户在不同场景下做选型决策”** 为核心（包含视频画质、运动幅度、提示词顺从度、计费性价比、适用场景）。

## 8. 商业与场景关键词规划 (P1~P2)

### 8.1 商业落地页
- 强化 `/pricing` 与 `/seedance-api`。
- 针对 `seedance free` 搜索意图，构建客观真实的科普问答（解释官方测试额度、本站新人积分机制、第三方 API 计费模式），不搞欺骗性标题党。

### 8.2 商业场景长尾 (Use Cases)
- 优先切入高商业价值赛道：
  - `/use-cases/product-video`（电商产品展示视频）
  - `/use-cases/ugc-ads`（TikTok/Reels 投放素材批量生成）
  - `/use-cases/short-film`（独立短片分镜与概念设计）
  - `/use-cases/social-video`

## 9. 网状内链拓扑规则

打破页面孤岛（Orphan Pages），形成强内链闭环：
- **首页** 必须清晰直达四大功能页、模型 Hub、定价与 API。
- **功能落地页**（如 `/text-to-video`）必须反向链接相关教程、Prompt 推荐、Pricing 与 Seedance 2.5。
- **博客文章 (Blog)** 杜绝单打独斗，每篇必须嵌入 1 个核心功能页链接 + 1 个模型 Hub 链接 + 1 个商业转化入口。

## 10. 标准落地页 SEO 结构规范 (Page Template)

所有新增的 Tool Landing Page 统一遵照此标准架构开发：

```text
┌────────────────────────────────────────────────────────┐
│ Title: [Keyword] AI Video Generator | Seadance Video   │
│ Meta: 50~160 字符，强调“是什么 + 能做什么 + 差异化能力”   │
├────────────────────────────────────────────────────────┤
│ 1. H1: 直接对应核心目标关键词                            │
│ 2. Short Answer / Featured Snippet 定位段落            │
│ 3. Generator 交互生成区（即刻体验）                    │
│ 4. How It Works（3 步简明操作指引）                    │
│ 5. Core Capabilities / Features 核心特性图谱           │
│ 6. Real Video Showcases（带真实 Prompt 示例）           │
│ 7. Use Cases 行业应用场景                              │
│ 8. Models & Workflows（2.0 稳定版 vs 2.5 前沿版说明）  │
│ 9. Frequently Asked Questions (FAQ, 配置 Schema)       │
│ 10. Bottom CTA（终极行动召唤）                         │
└────────────────────────────────────────────────────────┘
```

---

# 第三篇：首页产品化重塑与跳出率救火方案

## 11. 首页 4 大致命问题及解决原则

| 原有问题 | 致命后果 | 重塑原则 |
| :--- | :--- | :--- |
| **Hero 在劝退** | 充斥 2.5 unavailable、企业预览等消极词汇，用户误以为网站不可用 | **首页主角是立即可用的 Seedance AI Video Generator**；2.5 降级为轻量新闻条 |
| **缺少真实视频自证** | 默认预览是 MDN 小花，案例全是静态 JPG，缺乏 AI 视频质感 | **用真实视频结果建立信任**；首屏与案例区全量接入 5~10 秒高质量 WebM 循环视频 |
| **承担过多内容门户职责**| 堆砌长篇 2.5 介绍列表与手风琴折叠面板，信息严重过载 | **首页只做两件事：相信能做好视频 + 立即开始生成**；深度内容完全下沉至独立页 |
| **视觉呈现模板感强** | 标准白底卡片、普通蓝紫渐变，缺乏现代 AI 创意工具的质感 | **向“Premium Dark Cinema”演进**；深黑冷灰背景，大留白，视频提供核心色彩 |

## 12. 最终首页信息流结构

严格按照用户心理流转顺序设计（**价值认知 → 立即体验 → 作品证明 → 核心能力 → 升级预告 → 答疑解惑 → 终极转化**）：

```text
Header Navigation（精简版）
  │
  ├── 1. Hero（价值主张 + 核心双 CTA）
  │
  ├── 2. Generator（嵌入式视频生成工具 + 无水印天鹅视频预览）
  │
  ├── 3. Made with Seedance（4个真实生成视频 + 真实 Prompt + 行动按钮）
  │
  ├── 4. Why Seedance / Features（核心生成能力：文生、图生、视生、画幅与分辨率）
  │
  ├── 5. Seedance 2.5 Update（轻量单卡更新预告 → 引导至独立 /seedance-2-5）
  │
  ├── 6. FAQ（正向产品问答：工作流、计费方式、商用授权、画幅支持）
  │
  └── 7. Bottom CTA（开启创作双按钮：立即生成 + 查看定价）
```

## 13. 首屏 Hero 规范与视觉布局

- **Announcement**：`Seedance 2.5 announced · Track release updates →`（纯文本新闻胶囊，不抢 H1）。
- **H1 主标题**：`Seedance AI Video Generator`（中文：`Seedance AI 视频生成器`）。
- **副标题价值主张**：`Turn text and images into cinematic AI videos with Seedance. Create with the available high-speed Seedance 2.0 workflow today.`
- **核心行动召唤**：
  - Primary CTA: `Generate Video`（锚点平滑滚动至 `/#generator`）
  - Secondary CTA: `Watch Examples`（锚点平滑滚动至 `/#showcases`）
  - 严禁放置 `Read 2.5 FAQ` 等分散主线注意力按钮。

## 14. 生成器 (Generator) 体验与无缝引导

- **演示成片**：彻底删除 MDN `flower.mp4`，采用轻量（268KB）、无水印 CogVideoX 晚霞天鹅视频循环静音播放（`autoPlay muted loop playsInline preload="metadata"`）。
- **未登录门禁保护**：
  - 未登录访客首屏**绝不展示** `Remaining: 0` 与 `Buy credits` 充值按钮，仅展示高亮大按钮 `[ Sign in to generate ]`，消除心理门槛。
  - 仅在用户挂载且登录后，才展示其动态剩余积分与额度不足时的充值引导。

## 15. 案例展示 (Showcase) 视频化与 Prompt 联动

- **板块标题**：`Made with Seedance`（中文：`Made with Seedance 精选作品`）。
- **资产配置**：4 组精选电影质感短片（油画写生、视觉系人物、星空延时、阳光咖啡馆），WebM 格式（体积 200KB~900KB），支持 Poster 图片兜底与 `useReducedMotion` 辅助功能降级。
- **Prompt 真实性**：每个卡片下方印有完整的真实英文生成提示词。
- **卡片行动按钮**：配置 `Create a video` 按钮，后续升级支持“点击自动将该卡片 Prompt 写入上方输入框并聚焦”。

## 16. 导航栏 (Navigation) 极简化重构

当前 Header 堆叠了 6 个大菜单与近 20 个子链接，严重门户化。重构原则：

```text
【精简后一级导航】
Models    Examples    Prompts    Pricing    [ Generate Video ]
  │           │          │          │               │
下拉子项    直达        直达       直达          平滑滚动至
(2.0, 2.5, /#showcases /prompts   /pricing       /#generator
What-is)
```
- `Compare`、`Developers`、`Resources` 收纳至下拉二级菜单或统一沉底至 Footer，确保主航道聚焦在“看效果 → 用产品”。

## 17. 视觉调优策略 (Dark Cinema)

- **核心原则**：视频负责提供色彩，UI 负责克制衬托。
- **色彩规范**：
  - Background: `#08090D` / `#0B0D12`（深邃黑/冷黑）
  - Surface: `#11131A`
  - Foreground: 高对比度冷白
  - Accent/Primary: 少量电光蓝（Electric Blue）与靛蓝微光高光
- **避免**：泛滥的大面积紫色渐变、过度的毛玻璃拟态、过度的卡片嵌套。

---

# 第四篇：总执行路线图 (Master Roadmap)

## 18. 分阶段执行清单与当前进展

```text
======================= 阶段执行看板 =======================

【Milestone 1：首页跳出率救火 MVP】─── 【100% 全部完成 ✅】
  ├─ [x] P0-1: Hero 去除 2.5 抢占与劝退文案，双 CTA 导向工具与作品
  ├─ [x] P0-2: MDN 替换为 CogVideoX 天鹅成片，Showcase 视频化与 Prompt 注入
  ├─ [x] P0-3: 首页 2.5 深度内容清理下沉，重构 show_sections 紧凑流
  └─ [x] P1-提早项: Video & Image 生成器未登录积分门禁实现

【Milestone 2：导航收敛与交互增强】─── 【进行中 ⏳】
  ├─ [x] P1-1: Header Navigation 精简重构 (landing.json)
  │            收敛为 Models, Examples, Prompts, Pricing; 右上角纠偏指向 /#generator; 多余深度链接全部下沉至 Footer
  └─ [ ] P1-2: Showcase 卡片 "Try this prompt" 一键自动填入输入框交互联动

【Milestone 3：核心功能 SEO Landing Page】─── 【即将启动 🚀】
  ├─ [ ] P0-SEO-1: 新建 /text-to-video 专属落地页
  ├─ [ ] P0-SEO-2: 新建 /image-to-video 专属落地页
  ├─ [ ] P0-SEO-3: 新建 /video-to-video 专属落地页
  ├─ [ ] P0-SEO-4: 新建 /reference-to-video 差异化落地页
  └─ [ ] P0-SEO-5: 重构 /what-is-seedance (强化 Featured Snippet 答案引擎)

【Milestone 4：版本词与对比词集群强化】
  ├─ [ ] P1-SEO-1: 完善 /seedance-2-5 深度页与 API 子页
  ├─ [ ] P1-SEO-2: 扩展对比页 (Seedance vs Kling, Seedance vs Runway)
  ├─ [ ] P1-SEO-3: 扩充 /prompts 提示词专区分类
  └─ [ ] P1-SEO-4: 商业落地页检查 (/pricing, /seedance-api, /seedance-free 真实问答)

【Milestone 5：长尾商业场景与主题视觉抛光】
  ├─ [ ] P2-SEO-1: 落地 Use Cases 页面 (Product Video, UGC Ads, Short Film)
  └─ [ ] P1-Visual: 落地 Dark Cinema 沉浸式暗色主题微调
```

---

# 第五篇：工程规范与反模式指南

## 19. 明确禁止做的事 (Anti-Patterns)

1. **禁止破坏 ShipAny 底座**：
   - 不重构认证系统（Better Auth）、不碰数据库 Schema、不改 Stripe/Creem 支付、不碰积分计算引擎。
2. **禁止盲目为了 SEO 泛滥发文**：
   - 不准一次性用 AI 生成 100 篇内容高度重叠的垃圾博客。必须先建立 Search Intent 架构，再开发页面。
3. **禁止关键词 URL 重叠冲突 (Cannibalization)**：
   - 一个核心意图只保留一个永久 URL，功能词绝不绑定版本号。
4. **禁止过度设计与重度重构**：
   - 优先通过配置（JSON）、静态资产与局部展示组件优化解决问题，避免引入多余全局状态。
5. **禁止制造虚假或误导性承诺**：
   - 不以“免费”为诱饵做虚假宣传，不宣称本站已直连尚未开放公测的 2.5 接口，保持透明可靠。

---

# 第六篇：数据监控与效果验证体系

## 20. 核心验证指标与成功标准

全套方案上线后，通过 Google Search Console、GA4 与 PostHog 持续追踪两套核心指标：

### 1. 站内体验与转化指标（战术成效）
- **首页平均停留时长**：从目前的约 4 秒提升至健康水平（15s~30s+）。
- **首页跳出率 (Bounce Rate)**：从约 80% 明显回落。
- **核心操作点击率**：`/#generator` 滚动率、生成表单交互率、注册/登录弹窗唤起率。
- **商业意图转化**：Pricing 页面访问量与订阅转化率。

### 2. 搜索获客与排名指标（战略成效）
- **核心功能词展现量与排名**：`seedance text to video`、`seedance image to video` 等进入 Google 前 3 页并持续爬升。
- **实体词展现份额**：`what is seedance` 争取命中 Google 搜索结果顶部的精选摘要（Featured Snippet）。
- **长尾搜索捕获量**：模型对比词与应用场景词的自然入站流量增长。

---

# 终极指导原则 (North Star)

> **“战略上，以精准的搜索意图架构筑起流量护城河；战术上，以真实的成片质感与丝滑的极速体验留住每一位访客。”**
