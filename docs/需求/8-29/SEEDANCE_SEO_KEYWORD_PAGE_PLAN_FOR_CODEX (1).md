# Seadance Video — Seedance SEO 关键词与页面架构执行规划

> **用途：** 直接交给 AI-IDE 执行  
> **仓库：** `SkillsMP/seadance-video-2`  
> **项目：** Seadance Video / ShipAny Template Two / Next.js App Router  
> **规划日期：** 2026-08-29  
> **核心目标：** 清洗 Seedance 关键词库，避免关键词内耗；把 Seedance 2.5 的主词归属从首页迁移到独立页面；建立可持续扩展的模型 / 版本 SEO 架构。

---

## 0. AI-IDE：先读这里

这是一次 **SEO 架构 + 页面实现任务**，不是大范围代码重构。

### 不可违反的规则

1. **不能破坏现有生成器、支付、审核、登录、i18n、model registry。**
2. **不能删除或改名 `/seedance-2-0`。** 这是当前已经存在的 Seedance 2.0 交易/生成页面。
3. **首页不能继续作为 Seedance 2.5 专属落地页。**
4. 每个主要搜索意图只能有一个 canonical owner URL，避免多个页面争抢同一个主词。
5. 已存在的 Seedance 2.5 Blog URL 优先刷新和复用，禁止重复新建同意图页面。
6. 不得暗示 Seadance Video 是 ByteDance 官方网站。
7. 除非当前代码和 provider 配置真实支持，否则不得声称本站已经支持 Seedance 2.5 generation 或提供 Seedance API。
8. `free`、`free trial`、`unlimited`、`4K`、`open source`、`Hugging Face`、`ComfyUI`、model weights、pricing、availability、duration、resolution、API capability 等，都必须先核实最新权威资料后再作为事实写入页面。
9. 修改 release / API / specs / pricing 等事实性内容之前，必须重新核对当前官方资料。仓库里已经存在部分过期或冲突的 Seedance 2.5 文案，不得直接复制扩散。
10. 保持现有 ShipAny / DynamicPage / i18n 架构。优先复用当前 blocks/components，不要为了 SEO 重新造一套页面系统。

---

## 1. 本规划使用的数据和现状

### 关键词数据来源

- `similarweb_keywords_seedance_1787961382234.csv` — 主要需求信号，包含 period volume、average volume、KD、CPC、leading site。
- `seedance_keyword_panorama_2026-08-26.xlsx` — 760 个去重研究词，其中 159 个标记为当前 observed/supported；带来源和证据元数据。
- `谷歌下拉，相关.txt` — Google autocomplete 和 related searches 的真实搜索表达。
- `gpt拓词-8-27.md` — 用于语义扩词和新母词发现。**只能用于发现方向，不能用来证明搜索量或模型能力。**

### 当前仓库实际已有内容

- 首页：`src/app/[locale]/(landing)/page.tsx`
- 首页内容：`src/config/locale/messages/en/pages/index.json` 以及对应 locale 文件
- 已有模型页：`src/app/[locale]/(landing)/(models)/seedance-2-0/page.tsx`
- 已有模型内容：`src/config/locale/messages/en/pages/seedance-2-0.json`
- 已有通用 `/pricing`
- 已有通用 `/prompts`
- 已有 Seedance 2.5 Blog：
  - `content/posts/seedance-2-5-release-date-and-overview.md`
  - `content/posts/seedance-2-5-prompt-engineering-guide.md`
  - `content/posts/seedance-2-5-1080p-guide.md`
  - `content/posts/seedance-2-5-1080p-guide.zh.md`
  - `content/posts/seedance-2-5-features-vs-sora-runway.md`

### 重要内容风险

当前首页明显过度偏向 Seedance 2.5：metadata、Hero、FAQ 都在讲 2.5，但页面中真正可用的 Generator 仍然是 Seedance 2.0。

**必须把 Seedance 2.5 的核心内容归属迁移到 `/seedance-2-5`。**

另外，现有 release 文章需要在继续作为 SEO owner 前重新审核。文中存在类似 native 4K / 60 FPS、旧 rollout date 等强事实陈述，必须重新核实或删除/改写。

现有 1080p Guide 对 provider-dependent availability 的表述相对克制，后续全站事实性内容应采用这种验证优先的写法。

---

## 2. Similarweb 关键词清洗原则

Similarweb CSV 去重标准化后约有 **13,081 个关键词字符串**。

这不代表有 13,081 个页面机会。

Similarweb 导出包含大量 broad-match / related-keyword 噪音。**禁止把所有关键词机械加入可见正文或 metadata。**

关键词数据只用于：

- 判断需求大小；
- 聚类搜索意图；
- 决定 URL owner；
- 决定页面 H2 / FAQ /正文语义覆盖；
- 决定后续 GSC 监控重点。

### 从生产 SEO 中排除

以下内容不要建立独立页面：

- 与 Seedance 实际意图无关的 broad related-keyword 噪音；
- Adult / NSFW / porn / nude / uncensored / spicy 等成人搜索意图；
- 很长的用户 Prompt、影视角色 Prompt、character-vs-character Prompt、一次性创作请求；
- 没有长期价值的浏览器错误、政策提示、错误消息查询；
- 当前站点没有对应 locale 的小语种/脚本；
- `seeddance`、`sedance`、`seed dance` 以及把模型名误写成 `seadance` 的拼写词：只作为内部 alias/watch 信号，不新建 typo 页面，也不要在正文主动拼错 Seedance；
- Seedance 3.x / 4.x / 5.x 等未经官方确认的未来版本：只进入 watchlist；
- 未验证的 `4K` / open weights / local download 等能力词：可以回答用户问题，但不能把搜索词直接转成产品事实。

### 应合并而不是拆页

- Provider 类：`Dreamina`、`Higgsfield`、`CapCut`、`BytePlus`、`fal`、`Runway`、`Artlist` 等 → 先集中到 `/seedance-2-5/platforms`。
- Camera / Prompt 变体 → `/prompts` 或现有 Seedance 2.5 Prompt Guide。
- 泛功能词 → 先由 `/seedance-2-5` 的 H2/FAQ 覆盖，等 GSC 证明有足够独立需求再拆页。
- Greybox / Blockout 等低量但有潜力的新母词 → 先 watchlist / Blog 测试，不立即做大量 landing page。

### 配套关键词文件

执行和复核时使用：

- `seedance_keywords_cleaned_page_map.csv` — Similarweb 去重关键词的 KEEP / WATCH / ALIAS_ONLY / EXCLUDE 分类，以及建议 owner URL。
- `seedance_site_keyword_targets.csv` — 清洗后的站内候选关键词集合。
- `seedance_page_keyword_brief.csv` — 按目标 URL 聚合的高优先级关键词，适合 AI-IDE 逐页使用。

**禁止把 CSV 中的关键词机械塞入 `metadata.keywords` 或正文。** 页面必须围绕一个搜索意图自然展开。

---

# 3. 最终网站关键词归属

## 3.1 首页 `/` — 泛品牌 / 泛产品 owner

**页面职责：** Seadance Video 产品首页，承接泛 Seedance / AI video generator 意图。  
**禁止主打：** `seedance 2.5`。

### 首页主关键词

- `seedance` (1,453,980)
- `seedance ai` (53,030)
- `seedance 2` (52,440)
- `seedance video generator` (5,920)
- `seedance ai video generator` (5,400)
- `seedance video` (3,300)
- `bytedance seedance` (7,930)

### 推荐 SEO 文案（英文站保持英文）

- Title: `Seedance AI Video Generator | Seadance Video`
- H1: `Seedance AI Video Generator`

### 首页结构

1. Hero — 泛 Seedance AI Video Generator 定位。
2. 当前 Generator。
3. Examples / Showcase。
4. Text to Video / Image to Video / Video to Video。
5. **Explore Seedance Models**
   - Seedance 2.0 → `/seedance-2-0`
   - Seedance 2.5 → `/seedance-2-5`
6. 核心产品能力。
7. How it works。
8. Prompts / Use Cases 入口。
9. FAQ。
10. CTA。

### 从当前首页迁移的内容

把当前首页中大段 Seedance 2.5 release / features / FAQ 内容迁移到 `/seedance-2-5`。

首页只保留一个简短、事实准确的 Seedance 2.5 模型卡片/介绍，并链接到 `/seedance-2-5`。

---

## 3.2 `/seedance-2-0` — 当前交易型模型页

**页面职责：** 当前真实可用的 Seedance 2.0 Generator / conversion 页面。  
**保留现有 URL 和 Generator，不从零重建。**

### 高价值关键词

- `seedance 2.0` (1,130,190)
- `seedance 2.0 free` (173,510)
- `seedance 2.0 ai` (27,130)
- `seedance2.0` (23,910)
- `seedance 2.0 pricing` (7,180)
- `seedance 2.0 price` (6,020)
- `seedance 2.0 official website` (3,440)
- `seedance 2.0 prompt guide` (3,250)

### AI-IDE 修改要求

- 保留 H1：`Seedance 2.0 AI Video Generator`。
- Generator 继续位于页面靠前位置。
- 保留现有 free/pricing explanation、prompt examples、how-to-use、FAQ。
- 新增简短 `Seedance 2.0 vs Seedance 2.5` 模块 → `/seedance-2-5/vs-seedance-2-0`。
- 新增模型家族导航 → `/seedance-2-5`。
- 如果搜索词涉及当前 registry 不存在的模型（例如 “Mini”），只在 FAQ 中谨慎解释，禁止假装本站支持。
- API 意图不要塞在 2.0 页正文里，统一导向 `/seedance-api`。

---

## 3.3 `/seedance-2-5` — 新的 Seedance 2.5 核心 Hub

**页面职责：** `seedance 2.5` 核心版本搜索意图的 canonical owner。  
**当前首页中大部分 2.5 内容应迁移到这里。**

### 高价值关键词

- `seedance 2.5` (1,144,140)
- `seedance2.5` (86,310)
- `seedance 2.5 ai` (6,290)
- `seedance 2.5 video` (4,660)
- `seedance 2.5 ai video generator` (3,890)
- `seedance 2.5 examples` (3,670)
- `what is seedance 2.5` (3,180)
- `seedance 2.5 guide` (3,610)
- `bytedance seedance 2.5` (6,580)

### 推荐 SEO 文案（英文站保持英文）

- Title: `Seedance 2.5: AI Video Model, Features, API, Pricing & Prompts`
- H1: `Seedance 2.5`

### 在本站尚未真正接入 Seedance 2.5 Generator 时的页面结构

1. Hero — `Seedance 2.5`
2. Current availability/status — 明确区分“模型是否可用”和“Seadance Video 是否已接入”。
3. What is Seedance 2.5?
4. What's new / key capabilities — 只能使用已验证事实。
5. Examples / workflow showcase。
6. Seedance 2.5 vs Seedance 2.0 → comparison child page。
7. Text / Image / Reference / Video workflows — 只使用验证过的能力描述。
8. API → `/seedance-2-5/api`
9. Pricing / Free / Unlimited → `/seedance-2-5/pricing`
10. Prompts → 现有 Prompt Guide。
11. 1080p / resolution → 现有 1080p Guide。
12. Platforms / where to use → Phase 2 的 `/seedance-2-5/platforms`。
13. FAQ。
14. CTA → 如果本站尚未支持 2.5，则 CTA 指向当前 Seedance 2.0 Generator，而不是假装可生成 2.5。

### 未来接入规则

当 Seedance 2.5 真正进入本站 model registry / provider layer 后：

**禁止再建 `/seedance-2-5-generator`。**

直接把 `/seedance-2-5` 升级成交易型 Generator 页面，把 Generator 放到首屏附近，这样保留已有 SEO 年龄、外链、收录和排名资产。

---

## 3.4 `/seedance-2-5/pricing` — P0 商业意图页

**页面职责：** 真实解释 Seedance 2.5 price / free / unlimited / trial 等高商业意图，并区分 ByteDance、Provider 与本站套餐。

### 高价值关键词

- `seedance 2.5 free` (43,270)
- `seedance 2.5 unlimited` (40,570)
- `seedance 2.5 pricing` (22,980)
- `unlimited seedance 2.5` (20,780)
- `seedance 2.5 price` (10,370)
- `seedance 2.5 free trial` (9,890)

### 推荐 H1（英文站保持英文）

`Seedance 2.5 Pricing: Price, Free Access & Unlimited Plans Explained`

### 必须包含的内容

- 开头直接给 Short answer。
- 当前 official/provider pricing 状态，并标注 verification date。
- 解释 Seadance Video credits/plans 与 ByteDance/provider pricing 的区别。
- Is Seedance 2.5 free?
- Is there a free trial?
- Is there genuinely an unlimited plan?
- 对 `unlimited` 只解释真实情况，不得为了 SEO 宣称本站 unlimited。
- API cost → `/seedance-2-5/api`
- 本站真实套餐 → `/pricing`
- FAQ。

---

## 3.5 `/seedance-pricing` — 泛 Seedance Pricing SEO 页

### 为什么需要这个页面

Similarweb 中存在大量不带版本号的泛 pricing/free/unlimited 意图。

这些词不应全部塞到本站真实支付页 `/pricing`，也不应全部塞到 `/seedance-2-5/pricing`。

### 高价值关键词

- `seedance free` (19,340)
- `seedance pricing` (15,990)
- `seedance unlimited` (10,720)
- `is seedance free` (8,630)
- `free seedance` (7,350)
- `seedance free trial` (6,050)
- `seedance price` (4,170)

### 页面职责必须严格区分

- `/seedance-pricing` = 泛 Seedance cost / free / unlimited 的 SEO 信息页。
- `/seedance-2-5/pricing` = Seedance 2.5 专属价格页。
- `/seedance-2-0` = Seedance 2.0 free/price 搜索意图 owner。
- `/pricing` = Seadance Video 本站真实购买/订阅页，不需要承担所有模型 pricing 关键词。

---

## 3.6 `/seedance-api` — 泛 Seedance API Hub

**页面职责：** 泛 `seedance api` + Seedance 2.0 API 搜索意图。

### 高价值关键词

- `seedance api` (22,010)
- `seedance 2.0 api` (11,060)
- `seedance api pricing` (4,280)
- `seedance api price` (2,510)
- `seedance 2 api` (2,350)
- `seedance 2.0 api pricing` (2,030)
- `seedance api key` (2,000)
- `seedance api cost` (1,560)

### 重要限制

如果 Seadance Video 没有对外提供自己的 Public API，这个页面必须是 **informational integration/provider guide**，不能伪装成本站 API 产品页。

### 推荐内容

- “Seedance API” 这个词可能指什么。
- 当前官方/provider access 路径。
- 版本表：Seedance 2.0 vs Seedance 2.5 API status。
- provider 维度的 authentication / API key 解释。
- Pricing / cost model。
- Text / Image / Reference workflows。
- 只有在当前 provider docs 可验证时才给 request example。
- 2.5 深入页 → `/seedance-2-5/api`
- FAQ。

---

## 3.7 `/seedance-2-5/api` — P0 Seedance 2.5 API 页面

### 高价值关键词

- `seedance 2.5 api` (33,390)
- `seedance2.5 api` (1,980)
- `seedance 2.5 documentation` (1,850)
- `api seedance 2.5` (1,770)
- `seedance 2.5 api pricing` (1,700)
- `seedance 2.5 api price` (1,430)
- `seedance 2.5 docs` (1,370)

### 推荐 H1（英文站保持英文）

`Seedance 2.5 API: Access, Pricing, Docs & Examples`

### 必须包含

- 当前 API availability + verification date。
- official/provider endpoint 或 model identifier 只有验证后才能写。
- 支持的 input mode / reference type。
- Auth / API key 说明。
- Pricing 链接/摘要。
- 当前文档真实支持时，可提供最小 verified cURL / Python / Node example。
- Async / webhook / rate limit 只有官方文档明确写了才加入。
- 明确区分 third-party provider、ByteDance 和 Seadance Video。

---

## 3.8 已有 Release Article — 保留并刷新

**Owner URL：** `/blog/seedance-2-5-release-date-and-overview`  
**主关键词：** `seedance 2.5 release date` (30,000)

**不要新建第二个 release-date 页面。**

AI-IDE 必须：

- 重新研究当前官方 release / availability。
- 删除或更新过期 rollout 描述。
- `4K` / `60 FPS` / public weights 等除非当前权威资料明确支持，否则删除或改成验证型表达。
- 内链 `/seedance-2-5`、API、pricing。

---

## 3.9 已有 Prompt Article — 保留并增强

**Owner URL：** `/blog/seedance-2-5-prompt-engineering-guide`

### 高价值关键词

- `seedance 2.5 prompt guide` (7,870)
- `seedance 2.5 prompts` (6,320)
- `seedance 2.5 prompting guide` (5,540)
- `seedance 2.5 prompt` (5,380)

### 规则

Phase 1 **不要再建 `/seedance-2-5/prompts`**，否则会和已有 Prompt Guide 分权。

AI-IDE 修改要求：

- 清理未经验证的训练数据/技术原理陈述。
- 扩充 verified prompt structure、camera movement、audio/reference、examples、troubleshooting。
- `/prompts` 和 `/seedance-2-5` 都链接到它。
- `/prompts` 继续作为全 Seedance 家族的泛 Prompt Hub。

---

## 3.10 已有 1080p Article — 保留

**Owner URL：** `/blog/seedance-2-5-1080p-guide`

### 高价值关键词

- `seedance 2.5 1080p` (3,200)
- `seedance 2.5 480p` (940)
- `seedance 2.5 1080p resolution` (470)

不要再创建新的 resolution landing page。

保持现有文章的 provider-dependent / verification-first 写法。

所有 `4K` 查询都作为“需要核实的问题”处理，不能直接转成标题和正文中的能力承诺。

---

## 3.11 `/seedance-2-5/vs-seedance-2-0` — P0 对比页

### 高价值关键词

- `seedance 2.5 vs 2.0` (6,660)
- `seedance 2.0 vs 2.5` (6,120)
- `seedance 2.0 and seedance 2.5 which is better` (2,790)
- `seedance 2.5 vs 2.0 reddit` (2,160)
- `is seedance 2.5 better than 2.0` (1,410)

### 推荐 H1（英文站保持英文）

`Seedance 2.5 vs Seedance 2.0: What's Different?`

### 页面结构

- Short decision summary。
- Availability on Seadance Video。
- Input / workflow comparison。
- Duration / resolution / reference / audio differences，只能写 verified facts。
- Pricing / access differences。
- Best use cases。
- Which one should a user choose now?
- CTA → 2.0 Generator + 2.5 Hub。

---

# 4. Phase 2 页面

## 4.1 `/seedance-2-5/platforms`

Provider 搜索簇很大，但导航意图非常明显，所以先合成一个强页面，不要立刻拆十几个薄页。

### 重点关键词

- `seedance 2.5 higgsfield` (25,550)
- `dreamina seedance 2.5` (24,790)
- `higgsfield seedance 2.5` (20,370)
- `dreamina seedance` (7,660)
- `capcut seedance 2.5` (5,460)
- `artlist seedance 2.5` (5,160)
- `capcut seedance` (4,800)
- `byteplus seedance` (3,380)

做一个 current comparison/table 页面，各 provider 用独立 H2。

只有当 GSC 证明某一个 provider 本身已经能形成足够 impressions / query cluster 时，再拆独立 URL。

---

## 4.2 `/blog/is-seedance-open-source`

### 目标关键词

- `is seedance 2.5 open source` (4,000)
- `seedance open source` (3,720)
- `seedance 2.5 huggingface` (3,610)
- `seedance 2.5 open source` (3,170)
- `is seedance open source` (3,040)
- `seedance 2.5 local` (1,630)
- `seedance 2.5 comfyui` (1,520)

这是一个事实澄清 / myth explainer 页面。

**禁止做成 fake download、fake weights 或虚假的 local install 页面。**

---

## 4.3 竞品对比页

优先只做最强的几组：

- `/compare/seedance-vs-kling`
  - `kling vs seedance` (4,380)
  - `seedance vs kling` (3,770)
  - `kling 3.0 vs seedance 2.0` (3,370)
  - `seedance 2.0 vs kling 3.0` (2,670)

- `/compare/seedance-vs-minimax-h3`
  - `minimax h3 vs seedance` (4,540)
  - `minimax h3 vs seedance 2.0` (2,670)
  - `minimax h3 vs seedance 2.5` (2,090)
  - `seedance vs minimax h3` (1,160)

- `/compare/seedance-vs-veo`
  - `veo 3.1 vs seedance 2.0` (3,100)
  - `seedance 2.0 vs veo 3.1` (1,640)
  - `seedance vs veo 3` (970)

已有 Sora / Runway comparison article 优先刷新，不重复创建。

---

## 4.4 `/seedance-2-5/reference-to-video`

Similarweb 当前 exact demand 没有 API / Pricing / Core 那么大，但关键词全景表和 provider 生态已经明显出现：

- `seedance 2.5 reference to video`
- `seedance 2.5 reference to video api`
- `seedance 2.5 multimodal reference api`
- `seedance 2.5 audio reference api`
- `seedance 2.5 video reference api`

因此放在 Core 页面之后建设。

所有能力描述必须基于当前真实 provider / official docs。

---

## 4.5 Use Cases / Long Video / Greybox

- UGC / product / animation：做少数几个强 Use Case 页面，不要一次做几百个 pSEO 薄页。
- Long video / extension：值得做 emerging content，但先核实当前真实 duration / extension limits。
- Greybox / Blockout / Previs：目前先放 watchlist，优先用 Blog Guide 测试，等 GSC 数据增强后再升级成 pillar/landing page。

---

# 5. 防关键词内耗矩阵

| Query family | Canonical owner | 禁止作为主词的页面 |
|---|---|---|
| `seedance` / `seedance ai` / `seedance video generator` | `/` | `/seedance-2-0`, `/seedance-2-5` |
| `seedance 2.0` | `/seedance-2-0` | `/` |
| `seedance 2.5` | `/seedance-2-5` | `/` |
| `seedance 2.5 release date` | existing release blog | `/seedance-2-5` 的 Title/H1 |
| `seedance 2.5 prompt(s)` | existing prompt guide | 新建 `/seedance-2-5/prompts` |
| `seedance 2.5 1080p` | existing 1080p guide | 新建重复 resolution page |
| `seedance 2.5 pricing` / `free` / `unlimited` | `/seedance-2-5/pricing` | 泛 `/pricing` |
| generic `seedance pricing` / `free` / `unlimited` | `/seedance-pricing` | `/seedance-2-5/pricing` |
| `seedance api` / `seedance 2.0 api` | `/seedance-api` | `/seedance-2-0` |
| `seedance 2.5 api` | `/seedance-2-5/api` | `/seedance-api` 的 Title/H1 |
| `seedance 2.5 vs 2.0` | `/seedance-2-5/vs-seedance-2-0` | 两个模型页的 Title/H1 |
| provider / platform queries | `/seedance-2-5/platforms` | 初期 10+ provider 薄页 |
| `open source` / `huggingface` / `comfyui` | `/blog/is-seedance-open-source` | fake download/local pages |

---

# 6. 内链规划

```text
/
├── /seedance-2-0
├── /seedance-2-5
│   ├── /seedance-2-5/pricing
│   ├── /seedance-2-5/api
│   ├── /seedance-2-5/vs-seedance-2-0
│   ├── /seedance-2-5/platforms          [Phase 2]
│   └── /seedance-2-5/reference-to-video [Phase 2]
├── /seedance-pricing
├── /seedance-api
├── /prompts
└── /blog
    ├── seedance-2-5-release-date-and-overview
    ├── seedance-2-5-prompt-engineering-guide
    ├── seedance-2-5-1080p-guide
    └── is-seedance-open-source          [Phase 2]
```

### 必须建立的内链

- 首页 → Seedance 2.0 + Seedance 2.5 model cards。
- `/seedance-2-0` → `/seedance-2-5` + `/seedance-2-5/vs-seedance-2-0` + `/seedance-api`。
- `/seedance-2-5` → pricing + API + prompt article + release article + 1080p article + comparison。
- `/seedance-api` ↔ `/seedance-2-5/api`。
- `/seedance-pricing` → `/pricing`、`/seedance-2-0`、`/seedance-2-5/pricing`。
- 现有 2.5 Blog → `/seedance-2-5`。
- `/prompts` → Seedance 2.5 Prompt Guide。

Anchor text 要自然描述目标页面，不要全站重复使用完全相同的 money keyword anchor。

---

# 7. 导航建议

```text
Generate
Models
  Seedance 2.0
  Seedance 2.5
Prompts
Pricing
Blog
```

如果本站尚未真正支持 Seedance 2.5 generation：

可以写：

- `Seedance 2.5`
- `Seedance 2.5 · New`

不要写：

- `Try Seedance 2.5`

SEO child pages 不要全部塞进主导航，主要依靠 2.5 Hub 和上下文内链分发权重。

---

# 8. AI-IDE 执行顺序

## Phase 0 — 事实与内容安全 Gate

1. 修改任何 Seedance 2.5 事实文案之前，重新检查当前官方资料。
2. 审核当前首页的 Seedance 2.5 status 文案。
3. 审核已有 release / prompt / comparison posts 中未经支持的技术性断言。
4. 不要为了 SEO 修改 Generator / model registry。

### 可优先研究的来源

- ByteDance Seed official: `https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5`
- fal Seedance 2.5: `https://fal.ai/seedance-2.5`
- Replicate model schema: `https://replicate.com/bytedance/seedance-2.5/api/schema`
- Runway help: `https://help.runwayml.com/hc/en-us/articles/53542207042323-Creating-with-Seedance-2-5`
- Luma guide: `https://lumalabs.ai/learning-center/articles/intro-to-seedance-2-5`
- Higgsfield guide: `https://higgsfield.ai/blog/seedance-2-5-prompting-guide`

模型级事实优先使用 ByteDance / BytePlus 官方资料；provider-specific 行为再使用 provider docs。

---

## Phase 1 — 现在执行

1. 把首页重新聚焦到泛 `Seedance AI Video Generator`。
2. 保留并轻量增强 `/seedance-2-0`。
3. 新建 `/seedance-2-5`，并把当前首页的 2.5 主体内容迁移过去。
4. 新建 `/seedance-2-5/pricing`。
5. 新建 `/seedance-pricing`。
6. 新建 `/seedance-api`。
7. 新建 `/seedance-2-5/api`。
8. 新建 `/seedance-2-5/vs-seedance-2-0`。
9. 刷新已有 release article。
10. 刷新已有 prompt article。
11. 保留并 QA 已有 1080p article。
12. 增加 internal links + model navigation。
13. EN/ZH 页面和路由必须遵循当前 locale 结构，不得增加会破坏 locale 行为的 English-only route。

---

## Phase 2 — Phase 1 QA / GSC 数据后执行

1. `/seedance-2-5/platforms`
2. `/blog/is-seedance-open-source`
3. Kling / MiniMax H3 / Veo compare pages
4. `/seedance-2-5/reference-to-video`
5. 强 Use Case 页面
6. Long Video / Extension Guide
7. Greybox / Blockout：只在数据增强后升级

---

# 9. 推荐实现方式

对于 `/seedance-2-5`，优先复用当前 `/seedance-2-0` 的页面架构，不要再发明新的 rendering system。

建议：

- 在现有 `(landing)/(models)` 结构下新增 route；
- 使用 `getMetadata()`；canonical = `/seedance-2-5`；
- 继续使用现有 `dynamic-page` theme；
- 继续使用现有 JSON / i18n 内容模式；
- 加 Breadcrumb JSON-LD；
- 只有页面真实渲染 FAQ 时才加 FAQ JSON-LD；
- **Seedance 2.5 尚未真实进入 model registry 前，不要在该页注入 `VideoGenerator`。**

对于 pricing/API/comparison 等信息页，优先复用项目已有 DynamicPage / catch-all / page-content 模式。

不要创建第二套 SEO 页面框架。

---

# 10. Metadata 与正文写作规则

- 每个 URL 一个 primary query。
- 相近变体自然进入 description / H2 / FAQ / body。
- 不要建立巨大的 `metadata.keywords` 列表。
- exact-match 关键词自然出现即可，不做固定密度重复。
- ByteDance 模型统一写 `Seedance`；本站品牌统一写 `Seadance Video`。
- 遇到 `official website` 查询，明确说明本站是 independent third-party platform。
- `free`、`free trial`、`unlimited` 是用户搜索意图，不等于产品承诺。
- availability / pricing 因 provider / region / plan 不同时，应明确说明并加 verification date。
- comparison 页面必须区分 verified specs 与 provider-specific settings。

---

# 11. 验收标准

AI-IDE 在以下 Phase 1 条目全部通过前，不得声明完成：

- [ ] 首页 Title/H1 不再由 `seedance 2.5` 占据。
- [ ] 首页明确链接 `/seedance-2-0` 和 `/seedance-2-5`。
- [ ] `/seedance-2-0` 原有 Generator 功能正常。
- [ ] `/seedance-2-5` 已存在，并成为 2.5 core terms 的 canonical owner。
- [ ] 如果 model support 不存在，2.5 页没有虚假 Generator。
- [ ] `/seedance-2-5/pricing` 已存在，且没有虚假 free/unlimited 承诺。
- [ ] `/seedance-pricing` 已把泛模型价格意图和本站 `/pricing` checkout 意图区分开。
- [ ] `/seedance-api` 和 `/seedance-2-5/api` 清楚区分 informational/provider API 与 Seadance Video 自有 API 产品。
- [ ] 已有 release / prompt / 1080p Blog URL 被复用，没有重复页。
- [ ] `/seedance-2-5/vs-seedance-2-0` 已存在，并链接两个模型页。
- [ ] 仓库中过期/未经验证的 Seedance 2.5 facts 已审核。
- [ ] EN/ZH locale 行为保持正常。
- [ ] canonical 正确。
- [ ] Sitemap / navigation / internal links 已按需要包含新的 indexable pages。
- [ ] 没有误加 noindex。
- [ ] Phase 1 没有 orphan page。
- [ ] 使用仓库当前 scripts 完成 build / type / lint 检查并通过。
- [ ] 没有无关代码重构。

---

# 12. 最终 URL Owner 汇总

| 优先级 | URL | 页面职责 | 主关键词簇 |
|---|---|---|---|
| P0 | `/` | 首页 | `seedance` / `seedance ai` / `video generator` |
| P0 | `/seedance-2-0` | 当前 Generator | `seedance 2.0` / `free` / `price` / `how-to` |
| P0 | `/seedance-2-5` | Version Hub | `seedance 2.5` / `AI` / `video` / `features` / `examples` |
| P0 | `/seedance-2-5/pricing` | 商业信息页 | `2.5 pricing` / `free` / `unlimited` / `trial` |
| P0 | `/seedance-pricing` | 泛商业信息页 | `seedance pricing` / `free` / `unlimited` |
| P0 | `/seedance-api` | 泛开发者页 | `seedance api` / `2.0 api` / `key` / `pricing` |
| P0 | `/seedance-2-5/api` | 2.5 开发者页 | `seedance 2.5 api` / `docs` / `pricing` |
| P0 | existing release blog | 时效/信息页 | `seedance 2.5 release date` |
| P0 | existing prompt blog | Prompt Pillar | `seedance 2.5 prompts` / `prompt guide` |
| P0 | existing 1080p blog | Resolution Guide | `seedance 2.5 1080p` |
| P0 | `/seedance-2-5/vs-seedance-2-0` | 对比页 | `seedance 2.5 vs 2.0` |
| P1 | `/seedance-2-5/platforms` | Provider Hub | `Dreamina` / `Higgsfield` / `CapCut` / `BytePlus` / `fal` 等 |
| P1 | `/blog/is-seedance-open-source` | 事实解释页 | `open source` / `Hugging Face` / `ComfyUI` / `local` |
| P2 | `/compare/seedance-vs-kling` | 竞品对比 | `Seedance vs Kling` |
| P2 | `/compare/seedance-vs-minimax-h3` | 竞品对比 | `MiniMax H3 vs Seedance` |
| P2 | `/compare/seedance-vs-veo` | 竞品对比 | `Seedance vs Veo` |
| P2 | `/seedance-2-5/reference-to-video` | Emerging Workflow | `2.5 reference to video` |
| P2 | long-video / use-case guides | Emerging / Use Case | `long video` / `UGC` / `animation` / `product video` |

---

# 13. AI-IDE 最终执行原则

**首页负责泛 `Seedance` 产品类关键词；`/seedance-2-0` 负责当前真实可用的交易型模型；`/seedance-2-5` 负责新版本核心词；API、Pricing、Prompts、Release、Resolution、Comparison 各自只有一个 canonical owner，禁止继续全部挤在首页。**
