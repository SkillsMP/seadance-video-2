# Seadance Video — Seedance SEO 关键词、页面架构与“烧火模型”执行规划

> **用途：** 直接交给 Codex 执行  
> **仓库：** `SkillsMP/seadance-video-2`  
> **项目：** Seadance Video / ShipAny Template Two / Next.js App Router  
> **规划日期：** 2026-08-29  
> **核心原则：** **出单靠木块，点火靠叶子；叶子不是 Blog 的同义词。** 页面形态由搜索意图决定。

---

## 0. Codex：先读这里

这是一次 **SEO 架构 + 页面意图重分配 + 内容实现任务**，不是大范围代码重构。

### 不可违反的规则

1. 不破坏现有 Generator、支付、审核、登录、i18n、model registry。
2. 不删除、不改名 `/seedance-2-0`。
3. 首页不再作为 Seedance 2.5 专属落地页；首页守泛 `seedance` / `seedance ai` / `seedance video generator`。
4. 每个主要查询簇只能有一个 canonical owner；支持页可以通过内链形成 Topic Cluster，但不能多个页面用同一个主 Title/H1 抢同一主词。
5. **信息词不等于 Blog。** 对长期稳定的信息需求，优先使用普通 SEO 子页面、Guide、Review、Examples、Comparison、Support、Use Case；Blog 主要用于时效/新闻/已有 URL 资产。
6. 已存在的 2.5 Blog URL 优先刷新复用，避免换 URL 损失历史信号。
7. ByteDance 模型名统一写 `Seedance`；本站品牌写 `Seadance Video`。不得暗示本站是 ByteDance 官方网站。
8. 如果当前代码/provider 没有真实支持，不能声称本站已提供 Seedance 2.5 Generator 或自有 Public Seedance API。
9. `free`、`free trial`、`unlimited`、`4K`、`open source`、`Hugging Face`、`ComfyUI`、weights、pricing、availability、duration、resolution、API capability 等必须在发布时重新核实。
10. Typo 词保留搜索需求，但**绝不创建 typo URL，也不把错误拼写放进主 Title/H1**。
11. 不把 CSV 的所有词机械塞进 `metadata.keywords` 或正文。

---

# 1. 数据来源

- `similarweb_keywords_seedance_1787961382234.csv`：主要需求信号，包含 period volume、average volume、KD、CPC、leading site。
- `seedance_keyword_panorama_2026-08-26.xlsx`：语义全景、Observed、Roots、Sources。
- `谷歌下拉，相关.txt`：Google autocomplete / related searches 的真实表达。
- `gpt拓词-8-27.md`：用于发现新母词、工作流和 emerging intent；**不能把拓词本身当搜索量证据。**
- `seedance_keywords_cleaned_page_map.csv`：13,081 个去重词的最终底表。
- `seedance_site_keyword_targets.csv`：可用于生产 SEO 的精简候选库。
- `seedance_page_keyword_brief.csv`：按 URL 聚合的 Codex 页面施工表。

> **注意：** Similarweb 中同义词、变体、长尾可能重叠，不能把所有 period volume 简单相加成“页面总搜索量”。数字用于判断强弱和方向，不做机械求和。

---

# 2. 本项目采用的“烧火模型”

这是 **SEO 运营与页面架构工作模型**，不是要写给公开页面的 Google 算法宣言。

| 烧火元素 | SEO 载体 | 本项目定义 | 操作原则 |
|---|---|---|---|
| 树叶 | 信息页、Guide、Review、Examples、Comparison、Support、Use Case、Blog、工具/资源页 | `LEAF` | 选真实查询、独立回答、容易进 SERP 的页面；先拿展示/点击，再内链核心页 |
| 木块 | 首页、Generator、核心 Model Page、最终交易页 | `WOOD` | 守核心产品/版本/交易词；难点燃但价值长期，不要被大量信息长尾稀释 |
| 过渡燃料 | Pricing SEO 页、API Guide、Prompt Hub、Platforms、How-to、Use Case | `BRIDGE` | 同时完成搜索承接和产品导流；把叶子流量送到木块 |
| 助燃剂 | Backlinks | 站外权威/相关链接 | 优先加到已经有内容与搜索信号的强页/Topic Cluster，不为垃圾页硬堆链接 |
| 鼓风机 | 社媒、品牌流量、广告、KOC、社区 | 搜索外流量 | 为新站提供额外访问和品牌搜索，但最终仍要让站内页面能独立留住搜索流量 |

### 2.1 关键修正：叶子 ≠ Blog

本项目不使用“信息词 → 一律 `/blog/`”的旧逻辑。

选择页面模板时按意图：

- 时效/发布/新闻 → `BLOG_NEWS`
- 长期定义/事实解释 → `SEO_SUBPAGE`
- 操作步骤 → `GUIDE`
- 用户评价/Reddit → `REVIEW`
- 成果展示 → `EXAMPLES`
- A vs B → `COMPARISON`
- 故障与限制 → `SUPPORT`
- 场景词 → `USE_CASE`
- Provider/Where to use → `PLATFORM_HUB`
- API → `API`
- 价格/免费/无限量 → `PRICING`

URL 是否含 `/blog/` 不决定它是不是叶子。已有 `/blog/...` Guide 因历史 URL 资产继续保留。

### 2.2 小流量页也是需求探针

低量页面的价值不只是直接 UV。它可以帮助判断：

- 用户是不是同一类人；
- 相邻问题是否持续出现；
- 哪个查询簇正在扩大；
- 哪类用户最终会进入 Generator / API / Pricing；
- 哪个“小叶子”应该升级成更强的 Pillar / Product feature。

因此：**不追求无脑铺几百篇，而是让每个叶子页都对应明确查询簇和明确产品连接。**

---

# 3. Page Type 与 Fire Role 字段

三个 CSV 已统一新增/重算以下字段：

- `intent_family`：搜索意图簇。
- `page_type`：页面形态，如 `GUIDE`、`REVIEW`、`EXAMPLES`、`API`、`PRICING`。
- `fire_role`：`LEAF` / `BRIDGE` / `WOOD`。
- `page_build_priority`：`P0` / `P1` / `P2` / `P2_TEST`。
- `page_status`：`EXISTING` / `EXISTING_REFRESH` / `NEW` / `NEW_AFTER_DATA` / `WATCH_TEST`。
- `target_url`：该查询簇的 canonical owner。
- `supporting_url`：该页面应自然导向的木块/桥梁页。
- `recommended_action`：Build / Refresh / Keep / Watch / Exclude。
- `usage_guidance`：特别是 typo 词如何利用。

---

# 4. Typo 词策略：有流量就利用，但不造错误页面

例如：

- `seaddance` / `seeddance`
- `sedance`
- `seed dance`
- `seadance`
- `seadance 2 api`

处理规则：

1. `keyword` 保留用户真实原始拼写。
2. `canonical_keyword` 保存纠正后的正确意图。
3. 用纠正后的意图决定 `target_url`。
4. 不创建 `/seadance-*`、`/sedance-*` 等 typo URL。
5. 不在主 Title/H1 把 ByteDance 模型写错。
6. `Seadance` 与本站品牌 **Seadance Video** 重叠时，可通过真实品牌文案自然覆盖。
7. 高意图 typo（API / pricing / free / prompt / review 等）即使 period volume 很低，只要有可见 average demand，也保留在施工 brief。

例：`seadance 2 api` → `canonical_keyword = seedance 2 api` → `/seedance-api`。

---

# 5. P0：先点火，同时守住木块

## 5.1 P0 页面矩阵

| URL | Page Type | 烧火角色 | 状态 | 主要关键词（保留原拼写） | 页面职责 |
|---|---|---|---|---|---|
| `/` | `HOME` | `WOOD` | `EXISTING` | `seedance` (1453980), `seedance ai` (53030), `seedance 2` (52440), `seedance logo` (16050), `seedance official website` (8550), `bytedance seedance` (7930) | 泛 Seedance 产品/品牌核心页；守大词，不承担所有信息长尾 |
| `/seedance-2-0` | `MODEL_PRODUCT` | `WOOD` | `EXISTING_REFRESH` | `seedance 2.0` (1130190), `seedance 2.0 free` (173510), `seedance 2.0 ai` (27130), `seedance2.0` (23910), `seedance2` (11880), `free seedance 2.0` (9630) | 当前真实 Generator / 交易页 |
| `/seedance-2-5` | `MODEL_HUB` | `WOOD` | `NEW` | `seedance 2.5` (1144140), `seedance2.5` (86310), `seedance 2.5 logo` (7180), `bytedance seedance 2.5` (6580), `seedance 2.5 ai` (6290), `seedance 2.5 bytedance` (6060) | Seedance 2.5 核心版本 Hub；未来接入后原地升级 Generator |
| `/seedance-pricing` | `PRICING` | `BRIDGE` | `NEW` | `seedance free` (19340), `seedance pricing` (15990), `seedance unlimited` (10720), `is seedance free` (8630), `free seedance` (7350), `seedance 2 free` (6530) | 泛 Seedance pricing/free/unlimited 信息商业页 |
| `/seedance-2-5/pricing` | `PRICING` | `BRIDGE` | `NEW` | `seedance 2.5 free` (43270), `seedance 2.5 unlimited` (40570), `seedance 2.5 pricing` (22980), `unlimited seedance 2.5` (20780), `free seedance 2.5` (13010), `seedance 2.5 price` (10370) | 2.5 专属 pricing/free/unlimited 页 |
| `/seedance-api` | `API` | `BRIDGE` | `NEW` | `seedance api` (22010), `seedance 2.0 api` (11060), `seedance api pricing` (4280), `seedance api price` (2510), `seedance 2 api` (2350), `seedance 2.0 api pricing` (2030) | 泛 Seedance / 2.0 API 信息与 provider guide |
| `/seedance-2-5/api` | `API` | `BRIDGE` | `NEW` | `seedance 2.5 api` (33390), `seedance2.5 api` (1980), `seedance 2.5 documentation` (1850), `api seedance 2.5` (1770), `seedance2.5 api 料金` (1710), `seedance 2.5 api pricing` (1700) | 2.5 API 专属页 |
| `/what-is-seedance` | `SEO_SUBPAGE` | `LEAF` | `NEW` | `what is seedance` (6860), `seedance company` (4930), `what is seedance 2.5` (3180), `what is seedance 2.0` (3120), `who created seedance` (2730), `who owns seedance` (2400) | 品牌解释/公司/owner/what-is 叶子页 |
| `/how-to-use-seedance` | `GUIDE` | `BRIDGE` | `NEW` | `how to use seedance 2.0` (4710), `how to use seedance` (3250), `how to access seedance 2.0` (2670), `seedance tutorial` (1250), `how to use seedance 2.0 without being blocked` (1040), `comfy ui seedance 2.0 tutorial` (640) | 通用 + 当前 2.0 使用教程；信息流量导向 Generator |
| `/prompts` | `PROMPT_HUB` | `BRIDGE` | `EXISTING_REFRESH` | `seedance prompts` (4430), `seedance 2 prompts` (2730), `seedance prompt guide` (2650), `seedance prompt` (2010), `seedance prompt library` (1350), `claude skill for seedance prompt` (1080) | 泛 Seedance Prompt Hub |
| `/prompts/seedance-2-0` | `GUIDE` | `BRIDGE` | `NEW` | `seedance 2.0 prompt guide` (3250), `best seedance 2.0 prompts` (2730), `seedance 2.0 prompt` (2640), `prompt seedance 2.0` (1620), `seedance 2.0 prompts` (1600), `seedance 2.0 ai prompt` (1420) | Seedance 2.0 Prompt 专页 |
| `/seedance-2-5/review` | `REVIEW` | `LEAF` | `NEW` | `seedance 2.5 reddit` (11840), `seedance 2.5 review` (1230), `seedance 2.5 censorship reddit` (710), `seedance 2.5 preview` (640), `seedance 2.5 venice ai reddit` (550), `seedance 2.5 is frustrating reddit` (530) | 2.5 review / reddit / user feedback 叶子页 |
| `/seedance-2-5/examples` | `EXAMPLES` | `BRIDGE` | `NEW` | `seedance 2.5 examples` (3670), `seedance 2.5 demo` (1410), `seedance 2.5 showcase` (680), `seedance 2.5  video examples` (390), `seedance 2.5 example` (150), `seedance 2.5 demo 林悦己` (120) | 2.5 examples/showcase 桥梁页 |
| `/seedance/platforms` | `PLATFORM_HUB` | `BRIDGE` | `NEW` | `dreamina seedance 2.0` (20620), `higgsfield seedance 2.0` (10020), `dreamina seedance` (7660), `capcut seedance 2.0` (6180), `seedance higgsfield` (5800), `capcut seedance` (4800) | 泛 Seedance / 2.0 where-to-use/provider Hub |
| `/seedance-2-5/platforms` | `PLATFORM_HUB` | `BRIDGE` | `NEW` | `seedance 2.5 higgsfield` (25550), `dreamina seedance 2.5` (24790), `higgsfield seedance 2.5` (20370), `capcut seedance 2.5` (5460), `artlist seedance 2.5` (5160), `fal seedance 2.5` (4610) | 2.5 provider/platform Hub |
| `/seedance-2-5/vs-seedance-2-0` | `COMPARISON` | `BRIDGE` | `NEW` | `seedance 2.5 vs 2.0` (6660), `seedance 2.0 vs 2.5` (6120), `seedance 2.0 and seedance 2.5 which is better` (2790), `seedance 2.5 vs 2.0 reddit` (2160), `is seedance 2.5 better than 2.0` (1410), `gemini omni flash vs seedance 2.0 vs seedance 2.5` (690) | 版本对比页 |
| `/blog/seedance-2-5-release-date-and-overview` | `BLOG_NEWS` | `LEAF` | `EXISTING_REFRESH` | `seedance 2.5 release date` (30000), `when is seedance 2.5 coming out` (2340), `when is seedance 2.5 coming to higgsfield` (1260), `when is seedance 2.5 coming to united states?` (1070), `when is seedance 2.5 coming to higgsfield?` (730), `seedance 2.5 availability` (570) | 现有时效文章，刷新复用 |
| `/blog/seedance-2-5-prompt-engineering-guide` | `GUIDE` | `BRIDGE` | `EXISTING_REFRESH` | `seedance 2.5 prompt guide` (7870), `seedance 2.5 prompts` (6320), `seedance 2.5 prompting guide` (5540), `seedance 2.5 prompt` (5380), `prompt seedance 2.5` (1390), `qual o maximo de caracteres para um prompt no seedance 2.5` (1240) | 现有 2.5 Prompt Guide，刷新复用 |
| `/blog/seedance-2-5-1080p-guide` | `GUIDE` | `LEAF` | `EXISTING_REFRESH` | `seedance 2.5 1080p` (3200), `seedance 2.5 video length` (1630), `seedance 2.5 480p` (940), `seedance 2.5 480p reddit` (940), `seedance 2.5 480p ai to enhanced hd` (910), `seedance 2.5 only in 720p?` (730) | 现有 1080p Guide，刷新复用 |

### P0 执行逻辑

P0 不是“先做所有产品页，再做文章”。正确顺序是并行：

- **木块：** `/`、`/seedance-2-0`、`/seedance-2-5`
- **高意图桥梁：** Pricing、API、Prompt、Platforms、Comparison、How-to
- **最快叶子：** What Is、2.5 Review/Reddit、2.5 Examples、Release、1080p

这样新站不是守着木块等待，而是让高概率信息查询持续把搜索入口送回核心页面。

---

# 6. P1：扩大“叶子面”，找下一批需求集群

| URL | Page Type | 烧火角色 | 状态 | 主要关键词（保留原拼写） | 页面职责 |
|---|---|---|---|---|---|
| `/seedance/review` | `REVIEW` | `LEAF` | `NEW` | `seedance 2.0 reddit` (3120), `seedance reddit` (2260), `mini max h3 or seedance 2.0 reddit` (770), `increase volume seedance video reddit` (490), `seedance matrix video reddit` (480), `seedance 2.0 fast worth it difference` (420) | 泛 Seedance + 2.0 Reddit/review 叶子页 |
| `/seedance-examples` | `EXAMPLES` | `BRIDGE` | `NEW` | `seedance showcase` (1230), `seedance 2.0 examples` (980), `seedance 2.0 positive constraint examples` (350), `heygen seedance 2 video examples` (310), `bytedance: seedance 1.5 pro video generation example demo` (270), `seedance 2.0 example` (230) | 泛 Seedance + 2.0 examples/showcase |
| `/seedance-2-0/resolution` | `GUIDE` | `LEAF` | `NEW` | `seedance 2.0 4k` (2280), `seedance 2.0 1080p` (900), `15s de seedance 2.0 higgisfield 1080p preco` (520), `seedance 2.0 max duration` (450), `seedance 2.0 mini 480p` (410), `seedance 2.0 fast 1080p` (230) | 2.0 720p/1080p/4K/duration 事实型 Guide |
| `/compare/seedance-2-0-mini-vs-fast` | `COMPARISON` | `BRIDGE` | `NEW` | `seedance 2.0 mini vs fast` (1900), `seedance 2.0 fast vs seedance 2.0 mini` (520), `seedance 2.0 fast and seedance mini which is better for voice` (230), `seedance 2.0 vs seedance 2.0 mini vs seedance 2.0 fast` (220), `seedance 2.0 vs 2.0 fast vs mini` (190), `seedance 2.0 vs mini vs fast` (130) | Mini / Fast 对比；事实需先核实 |
| `/seedance/open-source` | `SEO_SUBPAGE` | `LEAF` | `NEW` | `is seedance 2.0 open source` (4010), `is seedance 2.5 open source` (4000), `seedance open source` (3720), `seedance 2.5 huggingface` (3610), `seedance 2.5 open source` (3170), `is seedance open source` (3040) | open source / GitHub / Hugging Face / ComfyUI / local 事实澄清 |
| `/seedance/troubleshooting` | `SUPPORT` | `LEAF` | `NEW` | `artcraft seedance 2.0 contain real person error` (730), `seedance 2.0 issues` (210), `seedance 2.0 sensitive content error` (100) | 失败、质量、错误、限制等问题型叶子页 |
| `/seedance/video-to-video` | `GUIDE` | `BRIDGE` | `NEW` | `seedance video to video` (1070), `ia seedance 2.0 video to video prova` (1060), `seedance 2.5 video inpaint` (490), `seedance 2 5 video editing` (430), `seedance 2.5 claude video editing` (400), `video to video seedance 2 frame drop` (350) | video-to-video / editing workflow |
| `/seedance/versions` | `SEO_SUBPAGE` | `LEAF` | `NEW` | `seedance 1.5` (3280), `seedance 2.0 release date` (3130), `seedance 1.5 pro` (2390), `seedance 1` (1980), `seedance 1.0` (1280), `seedance 1 existe til ?` (1000) | 1.0 / 1.5 Pro / 2.0 release history 等版本信息 |
| `/guides/seedance-mcp` | `GUIDE` | `LEAF` | `NEW` | `seedance mcp` (2420), `seedance skill` (1840), `seedance skill claude` (1550), `claude seedance skill` (1440), `seedance 2.5 mcp` (920), `seedance 2.0 mini mode higsfiled mcp` (580) | MCP / Skill / agent workflow 需求探针 |
| `/seedance/watermark-copyright` | `SEO_SUBPAGE` | `LEAF` | `NEW` | `seedance watermark remover` (2290), `seedance 2.0 copyright bypass` (880), `can seedance 2.0 create copyright characters` (580), `remove seedance 2.5 watermark` (500), `seedance 2.0 copyright bypass githjub` (310), `seedance2.0 rejected due to copyright restrictions bypass` (310) | watermark / copyright / commercial-use 事实说明；禁止提供绕过方案 |
| `/use-cases/seedance-ugc-video` | `USE_CASE` | `BRIDGE` | `NEW` | `seedance 2.5 ugc` (3800), `ugc seedance 2.0` (1230), `does create ugc . ai have seedance 2.5?` (880), `does create ugc have seedance 2.5?` (880), `seedance 2.5 reels` (860), `ai ugc seedance 2.5` (760) | UGC / product ads / social video use case |
| `/seedance-2-5/reference-to-video` | `WORKFLOW` | `BRIDGE` | `NEW` | `seedance 2.5 reference to video` (400), `seedance 2.5 change reference video style` (290), `seedance 2.5 avatar reference video` (280), `how do reference images work in seedance 2.5` (180) | 2.5 Reference-to-Video workflow |

### P1 特别说明

- `/seedance/open-source`：是事实澄清页，不是假下载页；不得虚构 weights/local availability。
- `/seedance/watermark-copyright`：只能解释 watermark、copyright、commercial use 和合规限制，**不得写绕过版权/审核限制的方法**。
- `/guides/seedance-mcp`：属于需求探针；如果 Seadance Video 自身没有 MCP，只能写生态/工作流说明，不得伪装成本站已有 MCP 产品。
- `/seedance/troubleshooting`：问题型长尾可以做叶子，但不能写成规避内容审核或安全策略的教程。

---

# 7. P2 / Watch：有方向，但先用数据控制节奏

| URL | Page Type | 烧火角色 | 状态 | 主要关键词（保留原拼写） | 页面职责 |
|---|---|---|---|---|---|
| `/compare/seedance-vs-kling` | `COMPARISON` | `BRIDGE` | `NEW` | `kling vs seedance` (4380), `seedance vs kling` (3770), `kling 3.0 vs seedance 2.0` (3370), `seedance 2.0 vs kling 3.0` (2670), `kling 3 omni vs seedance 2 omni` (1850), `seedance 2 vs kling 3` (1150) | 竞品比较 |
| `/compare/seedance-vs-minimax-h3` | `COMPARISON` | `BRIDGE` | `NEW` | `minimax h3 vs seedance` (4540), `minimax h3 vs seedance 2.0` (2670), `minimax h3 vs seedance 2.5` (2090), `seedance vs minimax h3` (1160), `minimax h3 vs seedance 2.5 cual es mejor` (1010), `seedance 2.0 vs minimax h3` (860) | 竞品比较 |
| `/compare/seedance-vs-veo` | `COMPARISON` | `BRIDGE` | `NEW` | `veo 3.1 vs seedance 2.0` (3100), `seedance 2.0 vs veo 3.1` (1640), `seedance 2.0 vs veo 3.1 diferencias` (1600), `seedance vs veo 3` (970), `veo 4 vs seedance 2.5` (970), `seedance 2.5 vs veo 3.1` (640) | 竞品比较 |
| `/blog/seedance-2-5-features-vs-sora-runway` | `COMPARISON` | `BRIDGE` | `EXISTING_REFRESH` | `sora 2 vs seedance 2.0` (450), `seedance 2 vs sora vs pika pro b roll` (430), `runway ai vs seedance` (420), `sora 2 vs seedance 2.55` (120), `runway vs seedance` (70), `sora vs seedance` (0) | 现有 Sora/Runway 对比文，刷新复用 |
| `/seedance-2-5/long-video` | `GUIDE` | `LEAF` | `NEW_AFTER_DATA` | `seedance 2.5 30 seconds` (910), `seedance 2.5 long form mode` (490), `hoggsfield 30 second seedance 2.5` (290) | Long video / 30s / extension；先核实再建 |
| `/seedance/first-last-frame` | `` | `` | `` | 研究词 / GSC 验证后补充 | First/Last Frame / Keyframe；等更多 GSC 信号 |
| `/seedance-2-5/greybox-blockout` | `LEAF_TEST` | `LEAF` | `WATCH_TEST` | 研究词 / GSC 验证后补充 | Greybox/Blockout/Previs 测试页；先 Watch/Test |

`Greybox / Blockout / Previs`、First/Last Frame 等词在研究源中有明显 emerging 信号，但当前 Similarweb 实测量还没有核心页强，因此先进入 `P2_TEST` / watch，不用一次铺大量薄页。

---

# 8. 核心页面职责重新划分

## 8.1 首页 `/` — WOOD

**只守泛产品/品牌意图。**

核心词：`seedance` (1453980), `seedance ai` (53030), `seedance 2` (52440), `seedance logo` (16050), `seedance official website` (8550), `bytedance seedance` (7930), `seedance video generator` (5920), `seedance ai video generator` (5400), `seedance 官网` (4600), `seedance 2,5` (4170)

推荐：

- Title: `Seedance AI Video Generator | Seadance Video`
- H1: `Seedance AI Video Generator`

首页保留：Generator、Examples 入口、Models、核心能力、How it works、Prompt/Use Case 入口、FAQ、CTA。

首页不再塞：owner/company 深度解释、2.0 Prompt 大教程、2.5 Reddit Review、所有 provider 比较、所有 resolution 问题。

这些全部交给叶子/桥梁页，再内链回来。

## 8.2 `/seedance-2-0` — WOOD

核心词：`seedance 2.0` (1130190), `seedance 2.0 free` (173510), `seedance 2.0 ai` (27130), `seedance2.0` (23910), `seedance2` (11880), `free seedance 2.0` (9630), `seedance 2.0 mini` (9050), `seedance 2.0 free unlimited` (7870), `unlimited seedance 2.0` (7220), `seedance 2.0 pricing` (7180), `bytedance seedance 2.0` (6880), `seedance 2.0 price` (6020)

继续承担：

- Seedance 2.0 Generator；
- free/price/try 等交易意图；
- model selector / Fast / Standard 等当前真实产品信息；
- 轻量 FAQ。

移出去：

- Prompt 深度词 → `/prompts/seedance-2-0`
- 4K / 1080p / resolution → `/seedance-2-0/resolution`
- release history → `/seedance/versions`
- provider/where-to-use → `/seedance/platforms`
- API → `/seedance-api`

## 8.3 `/seedance-2-5` — WOOD / Version Hub

核心词：`seedance 2.5` (1144140), `seedance2.5` (86310), `seedance 2.5 logo` (7180), `bytedance seedance 2.5` (6580), `seedance 2.5 ai` (6290), `seedance 2.5 bytedance` (6060), `seedance 2.5 official website` (4850), `seedance 2.5 video` (4660), `seedance 2.5 ai video generator` (3890), `seedance 2.5 guide` (3610), `seedance 2.5 edit` (2370), `where to use seedance 2.5` (1970)

当前本站若未接入真实 2.5 Generator，这里是核心 Hub，不得放假 Generator。

把搜索意图拆给：

- pricing → `/seedance-2-5/pricing`
- API → `/seedance-2-5/api`
- review/reddit → `/seedance-2-5/review`
- examples/demo → `/seedance-2-5/examples`
- provider → `/seedance-2-5/platforms`
- prompt → existing 2.5 prompt guide
- 1080p/resolution → existing 1080p guide
- release/availability → existing release article
- vs 2.0 → version comparison page

未来真实接入 2.5 后，**直接把 `/seedance-2-5` 升级成 Generator 页面，不新建 `/seedance-2-5-generator`。**

---

# 9. “树叶 → 桥梁 → 木块”内链结构

```text
LEAF
├── /what-is-seedance
├── /seedance-2-5/review
├── /seedance/review
├── /seedance-2-0/resolution
├── /seedance/open-source
├── /seedance/troubleshooting
├── /seedance/versions
├── /guides/seedance-mcp
├── existing release article
└── existing 1080p guide
        │
        ▼
BRIDGE
├── /how-to-use-seedance
├── /prompts
├── /prompts/seedance-2-0
├── existing 2.5 prompt guide
├── /seedance/platforms
├── /seedance-2-5/platforms
├── /seedance-api
├── /seedance-2-5/api
├── /seedance-pricing
├── /seedance-2-5/pricing
├── /seedance-2-5/examples
├── /seedance/video-to-video
└── comparisons / use cases
        │
        ▼
WOOD
├── /
├── /seedance-2-0
├── /seedance-2-5
└── /pricing (本站真实 checkout)
```

### 内链要求

- 叶子页正文前半段回答问题，后半段必须有**自然的下一步**，不能只在 Footer 放链接。
- Review/Examples/How-to/Prompt/Use Case 优先导向对应 Generator。
- API 叶子/桥梁导向 API Hub；Pricing 意图导向 pricing owner；最终本站套餐导向 `/pricing`。
- Anchor text 自然变化，不全站重复 exact money keyword。

---

# 10. 防关键词内耗矩阵

| Query family | Canonical owner | 支持页 / 内链方向 |
|---|---|---|
| `seedance` / `seedance ai` / `seedance video generator` | `/` | What Is / Examples / Platforms → `/` |
| `what is seedance` / company / owner / who created | `/what-is-seedance` | → `/`, model pages |
| `how to use seedance` / `how to use seedance 2.0` | `/how-to-use-seedance` | → `/seedance-2-0` |
| `seedance 2.0` / `free` / `price` | `/seedance-2-0` | prompt/resolution/platform leaves → 2.0 |
| `seedance 2.0 prompt(s)` | `/prompts/seedance-2-0` | → `/seedance-2-0`, `/prompts` |
| `seedance 2.0 4k` / `1080p` / resolution | `/seedance-2-0/resolution` | → `/seedance-2-0` |
| `seedance 2.0 release date` / old versions | `/seedance/versions` | → model pages |
| `seedance 2.5` | `/seedance-2-5` | 所有 2.5 leaf/bridge → hub |
| `seedance 2.5 review` / `reddit` | `/seedance-2-5/review` | → `/seedance-2-5`, comparison |
| `seedance 2.5 examples` / demo/showcase | `/seedance-2-5/examples` | → `/seedance-2-5`, prompt guide |
| `seedance 2.5 release date` | existing release article | → `/seedance-2-5` |
| `seedance 2.5 prompt(s)` | existing prompt guide | → `/seedance-2-5` |
| `seedance 2.5 1080p` | existing 1080p guide | → `/seedance-2-5` |
| `seedance 2.5 pricing/free/unlimited` | `/seedance-2-5/pricing` | → `/pricing`, `/seedance-2-5` |
| generic `seedance pricing/free/unlimited` | `/seedance-pricing` | → `/pricing`, model pages |
| `seedance api` / `seedance 2.0 api` / typo `seadance 2 api` | `/seedance-api` | → model/API pages |
| `seedance 2.5 api` | `/seedance-2-5/api` | → `/seedance-2-5` |
| generic/2.0 provider queries | `/seedance/platforms` | → `/seedance-2-0` |
| 2.5 provider queries | `/seedance-2-5/platforms` | → `/seedance-2-5` |
| `open source` / Hugging Face / ComfyUI / local | `/seedance/open-source` | → API/model pages |
| `seedance 2.5 vs 2.0` | `/seedance-2-5/vs-seedance-2-0` | → 两模型页 |

---

# 11. 现有 Blog URL：哪些保留，为什么

以下 URL 已存在，因此即使它们本质是 Guide/Comparison，也**不要为了“普通子页面更合理”而换 URL**：

- `/blog/seedance-2-5-release-date-and-overview`
- `/blog/seedance-2-5-prompt-engineering-guide`
- `/blog/seedance-2-5-1080p-guide`
- `/blog/seedance-2-5-features-vs-sora-runway`

原则：**新页面按最佳页面形态建；已有有价值 URL 则优先保留并增强。**

---

# 12. 三个 CSV 怎么用

## 12.1 `seedance_keywords_cleaned_page_map.csv`

全量底表，约 13,081 个去重关键词。

用途：

- 看为什么保留/排除/观察；
- 看 typo → canonical 的纠正关系；
- 看所有 query 最终归哪个 owner；
- 后续重新聚类和 GSC 复盘。

**不要直接把这张表交给内容生成器全量写页面。**

## 12.2 `seedance_site_keyword_targets.csv`

生产候选库。

用途：

- 排页面机会；
- 研究长尾；
- 找新增叶子页；
- 做 GSC query 对照；
- 判断某个页面是否已经长成一个足够大的独立簇。

## 12.3 `seedance_page_keyword_brief.csv`

Codex **逐页施工时优先看这张**。

它已经包含：

- URL
- Page Type
- Fire Role
- Build Priority / Page Status
- Title/H1 建议
- canonical keyword
- typo 原始词
- volume / KD
- supporting URL
- usage guidance

Codex 每做一个页面，只读取该 URL 对应的行，不要跨页面乱拿关键词。

---

# 13. 页面内容模板规则

## LEAF

1. 第一屏直接回答搜索问题。
2. 给出信息增量：真实例子、表格、步骤、验证日期、限制、来源。
3. 不强行塞 Generator。
4. 在用户自然完成问题后给出下一步链接。
5. 页面可以短，但不能薄；必须完成一个独立搜索任务。

## BRIDGE

1. 搜索问题先回答。
2. 中段提供选择/操作/比较。
3. 显式连接产品：Generator / API / Pricing / Prompt / Provider。
4. CTA 必须与当前真实能力一致。

## WOOD

1. 核心价值主张和产品体验优先。
2. 不承担所有百科长尾。
3. 把深度信息拆出去，再用相关模块回链。
4. 保持页面转化效率和主题清晰度。

---

# 14. 事实与质量 Gate

发布前必须重新验证：

- Seedance 2.5 当前 availability；
- 真实 duration / resolution；
- 4K 是否模型原生还是 provider upscale；
- API provider/model identifiers；
- provider pricing；
- Free / trial / unlimited 的真实条件；
- open source / weights / local / ComfyUI 的事实状态；
- Mini / Fast 的真实命名、可用性和差异。

当前站点 registry 若只有 2.0 Fast / Standard，不得因为搜索词有 `Mini` 就在产品页新增不存在的可选项。

---

# 15. Codex 实现规则

- 延续现有 ShipAny / DynamicPage / i18n 架构。
- `/seedance-2-5` 优先复用 `/seedance-2-0` 的页面结构，但没有真实 model support 时不要注入 `VideoGenerator`。
- 普通 SEO 子页面优先复用现有 DynamicPage / catch-all / content system；不要为了“叶子页”重造页面框架。
- EN/ZH 行为保持一致；英文站 SEO keyword 保持英文，中文 locale 用自然中文回答，不机械翻译 keyword。
- canonical、sitemap、Breadcrumb、internal links 完整。
- FAQ Schema 只有页面真实渲染对应 FAQ 时才添加。
- 不做 keyword stuffing。
- 不做 typo doorways。
- 不做 fake official / fake API / fake open-source / fake download 页面。

---

# 16. 执行批次

## Phase 0 — Audit

1. 审核首页 2.5 过度聚焦问题。
2. 审核现有 2.5 release/prompt/comparison 中过时或未经证实事实。
3. 确认 model registry 当前真实支持范围。

## Phase 1A — 木块 + 高商业桥梁

1. `/`
2. `/seedance-2-0`
3. `/seedance-2-5`
4. `/seedance-pricing`
5. `/seedance-2-5/pricing`
6. `/seedance-api`
7. `/seedance-2-5/api`
8. `/seedance-2-5/vs-seedance-2-0`

## Phase 1B — 点火叶子 + 高转化桥梁

1. `/what-is-seedance`
2. `/how-to-use-seedance`
3. `/prompts/seedance-2-0`
4. `/seedance-2-5/review`
5. `/seedance-2-5/examples`
6. `/seedance/platforms`
7. `/seedance-2-5/platforms`
8. refresh 2.5 release / prompt / 1080p existing URLs

## Phase 2 — 扩叶子面

1. `/seedance/review`
2. `/seedance-examples`
3. `/seedance-2-0/resolution`
4. `/seedance/open-source`
5. `/seedance/troubleshooting`
6. `/seedance/video-to-video`
7. `/seedance/versions`
8. `/guides/seedance-mcp`
9. `/seedance/watermark-copyright`
10. `/use-cases/seedance-ugc-video`
11. `/seedance-2-5/reference-to-video`
12. 重点 competitor comparison

## Phase 3 / Test

Long Video、First/Last Frame、Greybox/Blockout 等根据 GSC 新 query、impressions、点击和 provider 事实变化决定是否升级。

---

# 17. 验收标准

- [ ] 首页不再用 2.5 占据主 Title/H1。
- [ ] `/seedance-2-0` Generator 不受影响。
- [ ] `/seedance-2-5` 成为 2.5 核心 owner；未接入时没有假 Generator。
- [ ] 信息词不再默认全部压进首页/产品页。
- [ ] 新建叶子页都有明确 `supporting_url`，没有孤岛页。
- [ ] P0 Blog 只保留已有 URL 或真正时效意图，不把所有新信息页都塞 `/blog/`。
- [ ] typo 有流量的词保留并绑定正确 owner；没有 typo URL / typo H1。
- [ ] `seadance 2 api` 等高意图 typo 可以在 `/seedance-api` 的自然语义/FAQ 中被理解，但模型名不写错。
- [ ] `free/unlimited/4K/open source/API` 没有虚假承诺。
- [ ] watermark/copyright 页面没有规避版权或安全限制的操作指南。
- [ ] EN/ZH locale 正常。
- [ ] canonical / sitemap / internal links 正确。
- [ ] 没有 orphan page。
- [ ] build / type / lint 使用仓库现有脚本通过。
- [ ] 没有无关重构。

---

# 18. 最终一句话

**不是“SEO = 写博客”，也不是“信息词 = Blog”。本项目用大量真实查询驱动的 LEAF 页面获取搜索入口，用 BRIDGE 页面把需求送向产品决策，最终让 `/`、`/seedance-2-0`、`/seedance-2-5` 和真实 `/pricing` 这些 WOOD 页面获得持续的内部流量与主题支持。**
