# SEEDANCE SEO 关键词与页面规划（Codex 执行版）

> 说明：本文档中的关键词、URL、代码路径、SEO Title/H1 建议保持英文；面向人的解释与执行要求使用中文。

## 1. 本版核心原则

页面只按真实搜索意图和最合适的载体来规划：

- **CORE**：首页、核心模型页等现有核心页面。
- **SUBPAGE**：普通 SEO 子页面。适合稳定、长期、功能型、商业型、教程型或明确独立意图。
- **BLOG**：博客文章。适合时效性、Release/News、Review/Reddit、实验性新主题、观点型内容，以及不值得扩张主站结构但值得提前占位的相关词。
- **WATCH**：主题不够明确、未来未证实版本、暂时不值得建页的词。
- **EXCLUDE**：与 Seedance 主题明显无关或不适合本站的词。

### 搜索量规则

**搜索量不是建页的硬门槛。** 高度相关的关键词即使 `period_volume = 0`，只要有独立意图、内容可写出信息增量、能自然链接到核心产品，就可以进入 SUBPAGE 或 BLOG。

反过来，搜索量再高，如果主题明显不相关，也不为了流量强行建页，而是保留在底表中作为 WATCH/EXCLUDE。

### Typo 规则

- `seadance / seeddance / sedance / seed dance / seedence ...` 等有流量的拼写变体保留。
- 这些词必须绑定正确 canonical 页面。
- **禁止**创建 `/seadance-*`、`/sedance-*` 等错误拼写 URL。
- 不要把错误拼写堆进主 Title/H1；只在自然文本、FAQ、品牌语境或搜索语义中适量覆盖。

## 2. 页面载体怎么选

### 优先做普通子页面（SUBPAGE）

适合以下类型：API、Pricing、Platforms、Open Source、Examples、How-to、What Is、稳定工作流、Use Case、Support、长期 Comparison。普通子页面应成为站点信息架构的一部分，可持续更新。

### 优先做 Blog

适合以下类型：Release Date、最新可用状态、Review/Reddit、版本历史、实验性新母词、低量但强相关的新工作流，以及更像“文章”而不是产品功能页的专题。

Blog 不是低质词的兜底页；每篇仍需有明确查询意图、事实依据、信息增量和内链目标。

## 3. 当前代码/事实约束

- 当前站点已有 `/seedance-2-0`，继续作为 Seedance 2.0 核心交易/生成页面。
- 当前运行时已确认的是 Seedance 2.0 Fast / Standard；**不要因为 SEO 页面存在就声称 Seedance 2.5 已在本站 Generator 中可选**。
- 新建 `/seedance-2-5` 可以先做模型/能力/可用性 Hub；真正集成 2.5 后再在同一 URL 升级 Generator，不另建重复 generator URL。
- 已有 2.5 Blog URL 应复用，不要为了新结构改 URL 造成重复和内耗。

## 4. 已有 Blog：保留 URL 并刷新

- `/blog/seedance-2-5-release-date-and-overview` — 承接 `seedance 2.5 release date / release / availability`。
- `/blog/seedance-2-5-prompt-engineering-guide` — 承接 `seedance 2.5 prompt / prompts / prompt guide`。
- `/blog/seedance-2-5-1080p-guide` — 承接 `seedance 2.5 1080p / resolution / 4k` 等规格查询；所有规格必须按最新可验证事实写。
- `/blog/seedance-2-5-features-vs-sora-runway` — 承接 Sora / Runway 对比意图。

## 5. 页面建设清单

以下为当前词库重新归类后的 owner 页面。`相关词数`包含有量词和 0 量但高度相关词；不要把它理解成独立搜索量之和。

| 优先级 | 载体 | URL | 页面类型 | 状态 | 相关词数 | 0量相关词 | 代表词 |
|---|---|---|---|---|---:|---:|---|
| P0 | CORE | `/` | HOME | EXISTING | 636 | 220 | `seedance` |
| P0 | BLOG | `/blog/seedance-2-5-1080p-guide` | GUIDE | EXISTING_REFRESH | 37 | 7 | `seedance 2.5 1080p` |
| P0 | BLOG | `/blog/seedance-2-5-prompt-engineering-guide` | GUIDE | EXISTING_REFRESH | 145 | 5 | `seedance 2.5 prompt guide` |
| P0 | BLOG | `/blog/seedance-2-5-release-date-and-overview` | BLOG_NEWS | EXISTING_REFRESH | 106 | 39 | `seedance 2.5 release date` |
| P0 | SUBPAGE | `/how-to-use-seedance` | GUIDE | NEW | 119 | 41 | `how to use seedance 2.0` |
| P0 | SUBPAGE | `/prompts` | PROMPT_HUB | EXISTING | 248 | 97 | `seedance prompts` |
| P0 | SUBPAGE | `/prompts/seedance-2-0` | GUIDE | NEW | 151 | 77 | `seedance 2.0 prompt guide` |
| P0 | CORE | `/seedance-2-0` | MODEL_PRODUCT | EXISTING | 1634 | 806 | `seedance 2.0` |
| P0 | CORE | `/seedance-2-5` | MODEL_HUB | NEW | 907 | 138 | `seedance 2.5` |
| P0 | SUBPAGE | `/seedance-2-5/api` | API | NEW | 65 | 10 | `seedance 2.5 api` |
| P0 | SUBPAGE | `/seedance-2-5/pricing` | PRICING | NEW | 364 | 17 | `seedance 2.5 free` |
| P0 | SUBPAGE | `/seedance-2-5/vs-seedance-2-0` | COMPARISON | NEW | 21 | 2 | `seedance 2.5 vs 2.0` |
| P0 | SUBPAGE | `/seedance-api` | API | NEW | 395 | 169 | `seedance api` |
| P0 | SUBPAGE | `/seedance-pricing` | PRICING | NEW | 819 | 348 | `seedance free` |
| P0 | SUBPAGE | `/what-is-seedance` | SEO_SUBPAGE | NEW | 67 | 19 | `what is seedance` |
| P1 | BLOG | `/blog/seedance-2-0-mini-vs-fast` | COMPARISON | NEW | 190 | 109 | `seedance 2.0 mini` |
| P1 | BLOG | `/blog/seedance-2-0-resolution-guide` | GUIDE | NEW | 79 | 43 | `seedance 2.0 4k` |
| P1 | BLOG | `/blog/seedance-2-5-review-reddit` | REVIEW | NEW | 75 | 14 | `seedance 2.5 reddit` |
| P1 | BLOG | `/blog/seedance-mcp-skill-guide` | GUIDE | NEW | 227 | 91 | `seedance mcp` |
| P1 | BLOG | `/blog/seedance-review-reddit` | REVIEW | NEW | 260 | 132 | `seedance 2.0 reddit` |
| P1 | SUBPAGE | `/seedance-2-5/examples` | EXAMPLES | NEW | 16 | 3 | `seedance 2.5 examples` |
| P1 | SUBPAGE | `/seedance-2-5/platforms` | PLATFORM_HUB | NEW | 193 | 14 | `seedance 2.5 higgsfield` |
| P1 | SUBPAGE | `/seedance-2-5/reference-to-video` | WORKFLOW | NEW | 18 | 9 | `seedance 2.5 reference to video` |
| P1 | SUBPAGE | `/seedance-examples` | EXAMPLES | NEW | 29 | 13 | `seedance showcase` |
| P1 | SUBPAGE | `/seedance/open-source` | SEO_SUBPAGE | NEW | 180 | 75 | `is seedance 2.0 open source` |
| P1 | SUBPAGE | `/seedance/platforms` | PLATFORM_HUB | NEW | 538 | 241 | `dreamina seedance 2.0` |
| P1 | SUBPAGE | `/seedance/troubleshooting` | SUPPORT | NEW | 44 | 19 | `seedance prominent people error` |
| P1 | SUBPAGE | `/seedance/versions` | SEO_SUBPAGE | NEW | 13 | 6 | `seedance 1.5` |
| P1 | SUBPAGE | `/seedance/video-to-video` | WORKFLOW | NEW | 20 | 7 | `seedance video to video` |
| P1 | SUBPAGE | `/seedance/watermark-copyright` | SEO_SUBPAGE | NEW | 40 | 12 | `seedance watermark remover` |
| P2 | BLOG | `/blog/seedance-2-5-features-vs-sora-runway` | COMPARISON | EXISTING_REFRESH | 13 | 5 | `seedance vs runway vs kling vs midjourney` |
| P2 | BLOG | `/blog/seedance-2-5-greybox-blockout-guide` | GUIDE | NEW | 8 | 4 | `seedance 2.5渲染插件，让白模视频即刻出片` |
| P2 | BLOG | `/blog/seedance-2-5-long-video-extension-guide` | GUIDE | NEW | 9 | 1 | `seedance 2.5 30 seconds` |
| P2 | BLOG | `/blog/seedance-first-last-frame-guide` | GUIDE | NEW | 12 | 5 | `seedance has no keyframes on higgsfield?` |
| P2 | BLOG | `/blog/seedance-release-history` | BLOG_NEWS | NEW | 23 | 13 | `seedance 2.0 release date` |
| P2 | SUBPAGE | `/compare` | COMPARISON_HUB | EXISTING_OR_NEW | 117 | 37 | `seedream vs seedance` |
| P2 | SUBPAGE | `/compare/seedance-vs-kling` | COMPARISON | NEW | 50 | 18 | `kling vs seedance` |
| P2 | SUBPAGE | `/compare/seedance-vs-minimax-h3` | COMPARISON | NEW | 22 | 0 | `minimax h3 vs seedance` |
| P2 | SUBPAGE | `/compare/seedance-vs-veo` | COMPARISON | NEW | 25 | 11 | `veo 3.1 vs seedance 2.0` |
| P2 | SUBPAGE | `/use-cases/seedance-ugc-video` | USE_CASE | NEW | 69 | 33 | `seedance 2.5 ugc` |

## 6. 重点普通子页面

### P0 / P1 推荐优先做

- `/seedance-2-5`：Seedance 2.5 核心 Hub。
- `/seedance-pricing`：generic Seedance pricing/free/unlimited。实际站内付费 checkout 仍由 `/pricing` 承接。
- `/seedance-2-5/pricing`：2.5 price/free/unlimited/trial。
- `/seedance-api`：generic Seedance API + 2.0 API。
- `/seedance-2-5/api`：2.5 API。
- `/what-is-seedance`：what is / company / owner / creator。
- `/how-to-use-seedance`：how to use / tutorial / access。
- `/prompts/seedance-2-0`：2.0 prompt guide。
- `/seedance-2-5/examples` 与 `/seedance-examples`：examples / showcase / demo。
- `/seedance/platforms` 与 `/seedance-2-5/platforms`：Dreamina、Higgsfield、BytePlus、fal、Replicate 等 provider/navigation 查询。
- `/seedance/open-source`：open source / GitHub / Hugging Face / ComfyUI / local，必须如实回答，不伪造下载。
- `/seedance/video-to-video`、`/seedance/troubleshooting`、`/seedance/watermark-copyright`：稳定功能/支持型长尾。
- `/seedance-2-5/reference-to-video`：相关性强，即使部分词当前量很小也可以提前布局。

## 7. 推荐 Blog 新增专题

- `/blog/seedance-review-reddit`
- `/blog/seedance-2-5-review-reddit`
- `/blog/seedance-2-0-mini-vs-fast`
- `/blog/seedance-2-0-resolution-guide`
- `/blog/seedance-release-history`
- `/blog/seedance-mcp-skill-guide`
- `/blog/seedance-first-last-frame-guide`
- `/blog/seedance-2-5-long-video-extension-guide`
- `/blog/seedance-2-5-greybox-blockout-guide`

这些 Blog 中允许存在当前 `period_volume = 0` 的关键词，只要主题与 Seedance 强相关，并且对应明确场景/工作流。

## 8. 0 搜索量关键词的使用方式

不要因为 0 量就给每个词建独立页面。处理顺序：

1. 先判断是否和 Seedance 强相关。
2. 判断是否属于已有页面主题；属于则作为该页二级/三级语义覆盖。
3. 如果形成独立、稳定意图，放普通 SUBPAGE。
4. 如果是新兴、实验、时效、观点或小专题，优先放 BLOG。
5. 如果只是单个模糊词、未来版本或事实不可验证，保留 WATCH。

## 9. 防关键词内耗

- `seedance` / `seedance ai` / `seedance video generator` → `/`
- `seedance 2.0` / `seedance 2.0 free` → `/seedance-2-0`
- `seedance 2.5` → `/seedance-2-5`
- `seedance 2.5 release date` → existing release blog
- `seedance 2.5 prompts` → existing prompt blog
- `seedance 2.5 1080p` → existing 1080p blog
- generic pricing/free/unlimited → `/seedance-pricing`
- 2.5 pricing/free/unlimited → `/seedance-2-5/pricing`
- generic/2.0 API → `/seedance-api`
- 2.5 API → `/seedance-2-5/api`
- typo → 对应正确 owner URL，不建 typo 页。

## 10. 三个 CSV 怎么用

### `seedance_page_keyword_brief.csv`
Codex 做具体页面时优先看这个。每个 owner URL 提供高价值关键词，以及一批 0 量但高度相关的支持词。`keyword_role` 包括 `PRIMARY / SECONDARY / ZERO_VOLUME_SUPPORT / TYPO_SUPPORT`。

### `seedance_site_keyword_targets.csv`
生产关键词总库。现在**不再过滤掉所有 0 volume 词**：只要被判断为相关且已有明确 owner，就会保留。

### `seedance_keywords_cleaned_page_map.csv`
完整 13k+ 关键词底表。主题不相关、未来版本、模糊词也保留在这里作为 WATCH/EXCLUDE，方便后续监控。

## 11. Codex 执行要求

1. 先读取仓库当前路由、i18n、dynamic page、Blog/MDX 结构，不另造一套 SEO 框架。
2. 已有页面优先增量修改；已有 Blog URL 不复制创建。
3. 新页按 `page_surface` 决定放普通子页面还是 Blog。
4. Title/H1 围绕 PRIMARY keyword，自然覆盖 SECONDARY；不要把 CSV 关键词批量堆进正文或 metadata keywords。
5. `ZERO_VOLUME_SUPPORT` 用于补全主题、抢新兴查询，不要求逐词精确匹配。
6. `TYPO_SUPPORT` 只能自然融入，不得写错官方模型名，不得创建 typo URL。
7. 所有 Seedance 2.5 发布状态、规格、价格、API、平台可用性在发布前必须重新核实最新来源。
8. 保留 EN/ZH 结构，新增页面同步考虑 locale、canonical、sitemap、内部链接和 JSON-LD。
9. 不重构无关代码；完成后跑仓库已有 lint/type/build 检查。

## 12. 数据摘要

- 完整关键词：**13,081**
- 生产关键词：**7,984**
- 其中 0 搜索量但相关并保留：**2,910**
- 生产 typo 变体：**149**
- 页面 brief 行数：**2,262**
- 页面载体（生产词）：CORE=3,177 / SUBPAGE=3,623 / BLOG=1,184

> 注意：Similarweb 等关键词量存在变体重叠，不能把各行 volume 简单求和当作总市场规模。页面规划以查询意图、相关性和 SERP 适配为优先。
