# Flow 主题源码优先、高保真收纳与适配计划（ShipAny Two）

> **任务范围：只收纳、适配、预览和验收，不正式启用 Flow 主题，不改变当前站点。**
>
> **执行状态（2026-10-21）：源码已收纳，未正式启用；完整验收部分受环境和当前语言配置限制。实际检查结果与差异见 [README](./README.md) 和 [reference-notes](./reference-notes.md)，以下计划项不代表全部已通过。**
>
> **本次不是“参考 flowaivideo-lol 重新做一套相似 UI”，而是“直接使用 flowaivideo-lol 的现有源码，在源码基础上做最少必要的兼容修改”。** 用户已经认可参考站首页的排版、组件、视觉细节与交互感，**禁止 Codex 自由发挥、重新设计或替换成熟实现**。
>
> 参考仓库：[gateszhangc/flowaivideo-lol](https://github.com/gateszhangc/flowaivideo-lol)  
> 目标项目：`D:\project2\seadance-video-shipany2`（对应 [SkillsMP/seadance-video-2](https://github.com/SkillsMP/seadance-video-2)，以本地实际版本为准）

## 一、最高执行原则：直接用原始源码，而不是按图重画

### 1.1 冲突时的决策优先级

1. **保护真实业务与现有项目：** 不碰登录、支付、积分、AI 生成、API、路由和未提交改动；这一点是安全边界。
2. **原始源码优先：** 只要参考仓库的 JSX、CSS、组件结构、交互样式可以使用，**直接复制该源码，然后修改必要的 import、props、数据绑定及样式作用域**。
3. **视觉高保真：** 对本轮实际迁移的区块，最大程度保持参考源码的 DOM、容器宽度、标题层级、卡片形态、圆角、间距、配色、按钮、动效、响应式断点与 Hover/Focus 效果。页面区块顺序以目标项目现有 JSON 为准，不新增主题 Page 编排。
4. **最小工程适配：** 只修改为兼容本项目所必需的部分。不为了“代码优雅”“最佳实践”或“可读性”额外重写原组件。

**操作原则：能复制就复制，必须改才改；能局部修改就不重构；原样可用的代码尽量一行不改。**

### 1.2 明确禁止 Codex 自由设计

- 不使用 v0、21st.dev 或其他生成器重新生成 Flow 首页；参考站的**真实源码**才是视觉母版。
- 不使用“类似 Flow 风格”“更现代”“更高级”等模糊目标替换原设计。
- 不把已经工作的 `flow.css` 大规模翻译为 Tailwind 类名；不重新编写其栅格、间距、断点、卡片和动效。
- 不擅自改成 Bento、重新排列区块、换背景渐变、换主色、改字体层级、删交互或调整视频墙比例。
- 不因为 `site.tsx` 很长就强制拆成十几个文件、重写 JSX 或改变组件层级；**可以保留单一文件**。
- 不用自创视觉组件替换已可复用的 Flow 组件。只有原始实现确实无法兼容时，才能做最小等效替代，**必须说明原因与差异**。
- 如“让 CSS 作用域化”导致明显走样，先定位原有变量和选择器依赖，再调整隔离方式；**不要直接改设计数值来掩盖问题**。

### 1.3 本轮的验收口径

**已迁移区块的视觉以参考源码及参考截图为准，页面顺序、内容和业务以 Seadance 的现有 JSON、真实数据和业务为准。** 因品牌、文案长度、真实视频素材、真实 `VideoGenerator` 不同而造成的客观差异允许存在；但不能借此改变已迁移区块内部的原排版逻辑或卡片视觉。

本轮保持目标项目现有区块顺序（当前 EN/ZH 首页为 `Hero → Showcases → Generator → Features → Update → FAQ → CTA`），不新增主题 Page 编排。整页截图用于记录区块顺序和内容等差异，**不要求整页结构一致**。参考站的 Transformations、Pricing、Stats 等未纳入本轮的区块统一标为“本轮未迁移”，不为补齐截图新增内容、修改 JSON 或扩大迁移范围。

## 二、先锁定源码版本，再动手复制

1. 以本地参考目录 `D:\project3\shipany-2\flowaivideo-lol-main` 为实际复制基准，复制前记录各源文件的相对路径及 **SHA-256**。该目录当前没有 `.git`；只有将本地对应源文件与远端某一提交的文件逐一核对一致后，才能标注对应 **Commit SHA**。无法确认时注明“本地副本，提交版本未确认”，保留文件哈希用于追溯；不得将远端 `main` 最新 SHA 直接认定为本地副本版本。
2. 锁定参考首页的实际文件与依赖关系，特别是：
   - `src/shared/blocks/flow/site.tsx`：原始 UI/JSX、FlowHero、FlowShowcase、FlowFeatures、FlowSteps、FlowFaq、CTA 等实现。
   - `src/config/style/flow.css`：原始 UI 规则、栅格、间距、断点、按钮、动效、视频卡片样式。
   - `src/config/style/theme.css`：参考项目在浅色/深色模式下的设计变量。
   - `src/app/[locale]/(landing)/page.tsx`：用于理解原区块组合、视觉依赖和差异；**不将其渲染顺序作为目标页面的编排要求**。
   - `src/app/[locale]/(landing)/layout.tsx`：Header/Footer 的组织方式、CSS 引入方式。
   - `src/themes/default/blocks/header.tsx`、`footer.tsx`：参考站实际采用的站点导航与页脚组件（如仓库中存在）。
3. 对参考首页截图并保存基准：1440px 桌面首屏、桌面完整页、390px 手机首屏；能获取时再补 390px 手机完整页，区分明/暗模式。按已迁移区块对照视觉细节，整页截图仅用于记录差异，不作为整页结构一致的要求。
4. **记录源文件到目标文件的映射清单、源码修改点、不可迁移逻辑。** 能直接复制的先复制，不要先推倒重构。
5. 检查来源仓库的 `LICENSE` 与组件来源授权。公开 GitHub 仓库**不代表所有源码均允许任意再分发**；参考仓库附有 ShipAny Boilerplate License，涉及源码公开再分发和独立转售限制。当前限于授权范围内的项目内使用；日后将主题包公开发布或售卖前，须单独确认权利。

## 三、推荐目录：保留原文件主体，少建文件

```text
src/themes/flow/
├── components/
│   └── site.tsx           # 直接以参考仓库 site.tsx 为底稿修改，不重写 UI
├── blocks/
│   ├── hero.tsx           # 薄适配，导出 Hero
│   ├── showcases.tsx      # 薄适配，导出 Showcases
│   ├── features.tsx       # 薄适配，导出 Features
│   ├── features-step.tsx  # 薄适配，导出 FeaturesStep
│   ├── faq.tsx            # 薄适配，导出 Faq
│   ├── cta.tsx            # 薄适配，导出 Cta
│   ├── header.tsx         # 可选：原有 Header 不够还原时才增加
│   └── footer.tsx         # 可选：原有 Footer 不够还原时才增加
├── layouts/
│   └── landing.tsx        # 保持本项目布局接口，负责主题外壳和 CSS 引入
├── styles/
│   ├── flow.css           # 参考 flow.css 复制版，只做必要作用域/兼容修改
│   └── tokens.css         # 从参考 theme.css 原值摘取并限制作用域
├── reference-notes.md     # 源文件 SHA-256、已核实提交号或未确认状态、改动映射与视觉差异
├── README.md              # 安装、启用/回退、依赖和验收结果
└── preview.png            # 临时预览验证后生成
```

**约定：** `components/site.tsx` 是**参考源码的工作拷贝**，不是让 Codex 重新创作的空文件。可以为了业务隔离删除 `FlowStudio`、`FlowAction` 的模拟业务部分，并做最小类型/props 修改；其余可用视觉 JSX 和类名尽量原样保留。暂不强制拆分。如果未来需要拆文件，应放在本次视觉验收通过之后，另开任务。

`blocks/` 只保留**当前确实需要覆盖**的区块文件，不为填满目录而创建；上面列的是预期目标，不是必须全部生成的文件清单。未覆盖区块保持 `default` 回退。

## 四、逐文件操作：先复制原文件，再做差异手术

| 参考文件/代码 | 操作方式 | 原样保留的部分 | 允许改的部分 |
|---|---|---|---|
| `src/shared/blocks/flow/site.tsx` | **复制到** `src/themes/flow/components/site.tsx`，以原文件为工作底稿 | 可用的 JSX 层级、类名、区块组件、视觉交互、事件外观 | 不兼容 import、props、当前项目数据绑定、模拟业务的移除 |
| `src/config/style/flow.css` | **复制到** `src/themes/flow/styles/flow.css`，基于原 CSS 调整 | 原尺寸、间距、网格、断点、阴影、按钮、动效、卡片和视频裁切 | 作用域前缀、变量解析、避免跨主题污染所需的少量修改 |
| `src/config/style/theme.css` | **从原文件直接摘取值**至 `styles/tokens.css` | 原浅色/深色配色及适用 Token 数值 | 从全局作用域改到 `.flow-shell` / `.dark .flow-shell` |
| 参考 `page.tsx` | **只读用于理解组合和视觉依赖** | 已迁移区块内部的布局逻辑 | 不迁移其路由或页面顺序；按目标现有 JSON 和 `section` 机制接入，不新增主题 Page 编排 |
| 参考 Header/Footer | 先对照源码及效果再决定 | 可兼容的 HTML/JSX、样式、交互外观 | 品牌、导航数据、语言切换、登录入口适配 |

### 4.1 `site.tsx` 的具体规则

- **先复制完整源文件再删减**，不要先让 AI 写一个“精简版 Flow 组件库”。
- 对每个导出的视觉区块，优先保留原函数内的 JSX、标签、结构、类名、逻辑顺序与可用动效。
- `FlowHero` 原来包含 `FlowStudio`，需要将模拟 Studio 从 Hero 中剥离：**保留 Hero 本身的标题区外观**，真实生成器仍由本项目单独注入。
- 移除 `FlowStudio` 的模拟生成参数、排队计时器及假进度；不以视觉保真为理由展示不可用的“Generate”功能。
- 移除或替换 `FlowAction` 中参考项目的订阅检查与登录控制。CTA **外观保留**，点击行为对接本项目已有 `section.buttons` 的真实链接或已有操作。
- `FlowFaq` 的直接文本输出需要兼容现有富文本：当前 EN/ZH 首页 FAQ 均包含 HTML。沿用本项目现有富文本渲染方式及安全处理，保留链接，不直接用 `{item.answer}` 将 HTML 标签显示为文本。这属于必要兼容修改，不改变问答区布局或内容。
- 其他无关业务代码、未使用类型和 imports 可清理；但**不要顺手改写可用视觉源码**。
- 对静态展示组件不强制本轮改成 Server Component；先确保视觉一致和构建正确，再考虑性能优化。

### 4.2 业务内容只做接口映射，不更改 UI

| 目标 ShipAny Block | 复用的 Flow 原函数/视觉 | 原有数据来源 |
|---|---|---|
| `Hero` | `FlowHero` 的标题与内容区（不含模拟 Studio） | `section.title`、`description`、`announcement`、`buttons` |
| `Showcases` | `FlowShowcase` 的视频网格与卡片 | `section.items`、`item.video.src`、`item.image.src`、标题、链接 |
| `Features` | `FlowFeatures` 的卡片网格 | `section.items`、图标、说明 |
| `FeaturesStep` | `FlowSteps` 的步骤布局 | 当前步骤区的 `section.items` |
| `Faq` | `FlowFaq` 的问答展示与展开样式 | 当前 FAQ 数据；沿用现有富文本渲染及安全处理，保留 HTML 链接、可访问性与 SEO 内容 |
| `Cta` | 原 CTA 区的布局、按钮、留白 | `section.title`、`description`、`buttons` |

每个 `blocks/*.tsx` 只负责把 Seadance 现有的 `section` 转换为源组件能够接受的数据结构，避免改动公共类型和 locale JSON。**不以适配方便为由修改布局、强行截断文案或替换视频素材。** 当参考源数据结构和目标字段不完全相同时，写清楚映射和缺失值处理，保持 UI 元素有依据。

### 4.3 Header/Footer 如何处理

参考站使用 ShipAny 模板默认 Header/Footer，再配合 Flow CSS；**不要凭想象重新做导航**。先对比本项目 Header/Footer 与源代码差异。能直接复用本项目现有组件、配合原始 Flow CSS 达到效果，则无需复制；若实际不同，基于**参考 Header/Footer 源码**创建主题副本并只修改品牌/链接/语言/登录接口，不能自行设计新导航。

`flow/layouts/landing.tsx` 必须兼容本项目 `getThemeLayout('landing')` 调用，以及传入的 `header`、`footer`、`children`。

## 五、CSS 处理：原数值保留，只改必要范围

### 5.1 CSS 入口

从 Flow 专属布局引入，不碰全局 `global.css`：

```tsx
import '../styles/tokens.css';
import '../styles/flow.css';
```

由布局根元素提供 `.flow-shell`；所有适配后的页面视觉节点应在其作用域内。布局代码保留原 `header`、`footer` 参数及原有业务功能。

### 5.2 CSS 修改白名单

允许修改：

1. 将原 `:root` 中属于 Flow 视觉的局部变量作用域化到 `.flow-shell`。
2. 将深色 Token 作用域化到 `.dark .flow-shell`；保留原色值，不凭经验另选颜色。
3. 原 CSS 先复制，再逐项检查会泄漏的选择器：根容器 `.landing-shell` 改为 `.flow-shell`，相关后代规则同步调整；其他需要隔离的选择器加 `.flow-shell` 前缀，**不改变其中的具体视觉数值**，避免误写成要求嵌套外壳的 `.flow-shell .landing-shell`。
4. 在必要情况下增加最少的映射，检查 Tailwind 工具类实际使用的变量及继承结果，让 `--background`、`--foreground`、`--card`、`--primary` 等在 Flow 子树中正常解析；不将 Flow 色值写回全局 `:root`。
5. 仅修复确实存在的选择器冲突、文件导入、路径与构建问题，并记录修改原因。

禁止：大规模把 CSS 转为 Tailwind、统一美化按钮、重新整理响应式、去掉 Hover 动效、用新的主题生成器替换原配色。

**注意：** Next.js 在某个 Layout 导入 CSS，不意味着 CSS 自动局部化；必须检查选择器，且在路由切换后确认不污染其他区域。如果通过 Portal 渲染的登录弹窗不在 `.flow-shell` 内，局部 Token 可能无法继承；先在 README 记录，**本轮不修改全站 ThemeProvider**。

不能仅凭 layout 的动态加载方式承诺“Flow CSS 不会进入默认包”。验收以选择器隔离和实际回归为准：检查 Flow 进程内的路由切换；退出后移除临时主题覆盖，用原配置启动新进程检查原落地页、登录弹窗及可访问的后台页面。若原配置不是 `default`，再以临时进程变量指定 `default` 单独检查，不改 `.env*`。

**字体：** 先使用本项目已有字体配置；若与参考站视觉有实质差异，优先保留参考站原 `font-family` 栈、字重、字间距与行高的 CSS 声明。不主动换字体，也不因为“设计优化”引入新字体或依赖。

## 六、明确不搬的内容和不可修改范围

### 6.1 不从参考仓库复制的内容

- 模拟 `FlowStudio`、模拟排队、虚假的生成进度和非真实生成功能。
- `FlowAction` 的订阅查询、登录拦截、订阅状态判断和与本项目不一致的业务流程。
- 原站的文案、价格套餐、营销数字、品牌公告、媒体素材与外链徽章。
- Transformations、Pricing、Stats 等未纳入本轮的参考站区块；截图对比时标为“本轮未迁移”，不为补齐整页效果新增内容、修改 JSON 或扩大范围。
- 原站路由/API/支付/鉴权配置、数据库和 `scripts/flow-reference/` 内容镜像脚本。

### 6.2 严禁修改本项目的文件和状态

- `.env*`、当前 `NEXT_PUBLIC_THEME` 取值、任何生产环境设置。
- `src/config/style/global.css`、`src/config/style/theme.css`。
- `src/config/locale/messages/**`、`src/config/theme/**`、`src/core/theme/**`。
- `src/themes/default/`、`src/themes/video/`、`src/themes/videofly/` 及其他现存主题。
- 真实 `VideoGenerator` 的组件逻辑与外壳、积分、支付、登录、任务提交、轮询、模型 API。
- 本次主题收纳之外的任何文件，以及开发者已有未提交的修改。

**范围再次确认：Flow 主题目前只是项目内新增的一份备用主题，不接管现有页面，也不对外发布。**

## 七、执行顺序（给 Codex）

1. **检查来源、授权和依赖**：读取本地参考副本的上述文件与依赖，复制前记录各源文件 SHA-256；与远端对应提交文件逐一核对一致后才标注 Commit SHA，否则注明“本地副本，提交版本未确认”。检查 `LICENSE`，记录本项目当前 `git status --short`。盘点 `site.tsx`、拟迁移 Header/Footer 的外部包与 `@/` imports，对照本仓 `package.json` 和实际路径。缺失引用先判断是否随模拟业务一起删除；确需保留时，优先复用现有实现或将有权使用的小工具函数放入 `src/themes/flow/`，记录来源和修改原因。确需新增依赖时单独说明并获用户批准，不擅自改包文件或为编译通过重写视觉 JSX。不将本仓现有 `features-flow` / `showcases-flow` 当作本次参考源码。不要运行清理或覆盖命令。
2. **冻结视觉基准**：保存参考首页桌面/手机截图，以已迁移区块的视觉作为验收标准；记录整页差异，保持目标现有 JSON 顺序，不新增主题 Page 编排，不生成新的设计稿。
3. **直接复制源文件**：首先复制 `site.tsx`、`flow.css`，并从 `theme.css` 原值制作 `tokens.css`，放进 `src/themes/flow/` 的规定目录；保留可用类名、DOM 和具体 CSS 值。
4. **做最小必要删改**：去除模拟 Studio/排队/订阅业务，更新 import 和 props。修改前后以 diff 比较，**目标是最少变更、最大保真**。
5. **建立薄 Block 适配**：按现有 `section` 数据对接 Hero、Showcases、Features、FeaturesStep、Faq、Cta。保留当前 EN/ZH 文案、链接和媒体，不改 locale JSON；FAQ 沿用现有富文本渲染及安全处理，检查 HTML 标签未变成可见文本、链接仍可用。
6. **完成 Layout/Header/Footer 和样式隔离**：优先复用已有 Header/Footer；确有高保真需求时才以参考源码为底稿建立主题专属版本。
7. **静态检查**：记录新增代码 lint/TypeScript/生产构建结果，并与本来就存在的错误区分。
8. **临时预览（仅本地开发进程）**：不写入 `.env`，按下方新进程规则，用临时 `NEXT_PUBLIC_THEME=flow` 预览桌面、手机、EN/ZH、明暗模式、Header/Footer、视频卡片、FAQ、按钮及模型页区块；通过 `.flow-shell` 和逐区块检查确认实际加载了 Flow，不能只看 HTTP 200。
9. **和来源站逐项对照**：同宽度、同明暗模式对比已迁移区块；整页截图记录顺序和内容差异，不要求整页结构一致。发现区块视觉差异先回到**原源码**查缺漏，不自行另写新的 UI；记录由真实内容、业务替换、CSS 隔离带来的不可避免差异。Transformations、Pricing、Stats 等未纳入本轮的区块标为“本轮未迁移”，不补齐内容或扩大范围。
10. **交付但不启用**：README 写清本地来源、源文件 SHA-256、已核实 Commit SHA 或未确认状态、改动差异、许可、依赖、临时启用/恢复说明；最后展示 `git status --short` 与本次新增文件清单，不提交、不推送。

**Windows PowerShell 临时预览示例：**

```powershell
$env:NEXT_PUBLIC_THEME = 'flow'
pnpm dev
```

预览核对规则：

1. 停止本任务已有的旧预览进程，在新终端设置变量后启动；核对访问端口，不复用旧的 `video` 等主题进程，不停止无关服务。
2. 确认页面存在 `.flow-shell`，按当前页面数据点名核对 Hero、Showcases、Features、FAQ、CTA；FeaturesStep 在使用该区块的模型页检查。结合 DOM、样式及开发输出确认覆盖组件确实来自 Flow，不能把静默回退或区块消失当成通过。
3. 若 Turbopack 启动或运行异常，记录错误，允许用 `pnpm exec next dev --webpack` 复核；未定位前不直接将工具崩溃归为主题失败。
4. 看完退出预览进程并关闭该终端，或执行 `Remove-Item Env:NEXT_PUBLIC_THEME` 清除本次新终端的覆盖，再按第 5.2 节检查原主题及 `default` 的样式回归。全程不修改环境文件。

## 八、验收清单

### A. 源码复用（最高优先级）

- [ ] `components/site.tsx` 明确基于 Flow 的**原始 `site.tsx`** 修改，而非 AI 重写。
- [ ] `styles/flow.css` 明确来自 Flow **原始 `flow.css`**，能直接沿用的具体数值、规则与断点均保留。
- [ ] `styles/tokens.css` 使用原 `theme.css` 的实际 Token，不是 AI 新挑的颜色。
- [ ] 保留源代码中可用的 DOM、类名、卡片、组件结构、动效及响应式策略。
- [ ] 所有源文件改动能解释为：业务剔除、数据适配、路径依赖、CSS 隔离或构建修复。**不得出现额外“审美优化”改动。**
- [ ] README 或 `reference-notes.md` 有“源文件 → 目标文件 → 修改原因”对照、本地来源及复制前各源文件 SHA-256；只有与远端对应文件核对一致才标注 Commit SHA，否则注明“本地副本，提交版本未确认”。

### B. 视觉高保真

- [ ] 桌面首屏、桌面完整页、手机首屏与参考站同宽度同模式截图并排对比；按已迁移区块验收 DOM、样式、布局与交互，整页截图用于记录差异，不要求整页结构一致。
- [ ] 保持目标现有 JSON 的区块顺序，不新增主题 Page 编排；Transformations、Pricing、Stats 等未纳入本轮的参考站区块标为“本轮未迁移”，未为补齐截图新增内容、修改 JSON 或扩大范围。
- [ ] Hero、Showcases、Features、Steps、FAQ、CTA 的原始布局与组件感可辨，主要尺寸、比例、对齐、留白、字体层级与按钮外观无明显走样。
- [ ] 保留原有视觉动效与交互表现；不为“精简”删除关键设计。
- [ ] 遇到明显差异，先核查原 JSX/CSS 是否完整复制，记录差异与原因，不用 AI 自创元素补齐。
- [ ] 因原文案、真实视频、真实生成器而有必要差异时，逐项如实标注。

### C. 工程和业务安全

- [ ] 新增文件集中在 `src/themes/flow/`；除非发现原项目必须修改的技术阻碍，否则**不得改动其他目录**。
- [ ] 原主题、`.env`、全局 CSS、locale JSON、加载器与未提交内容不变。
- [ ] imports 已盘点，缺失引用的处理有记录；未擅自新增依赖或修改包文件。
- [ ] 未覆盖 Block 正常回退 `default`，所有已覆盖 Block 的文件和导出名正确，无静默消失。
- [ ] 新预览进程中存在 `.flow-shell`，应覆盖区块逐项确认来自 Flow；未误用旧进程或仅凭 HTTP 200 判断通过。
- [ ] 首页及复用同名 Block 的模型页（尤其 `/seedance-2-0`）均临时预览，无严重显示错误。
- [ ] 登录/语言/导航/按钮仍用本项目真实功能；FAQ 可展开；视频素材仍来自 Seadance。
- [ ] EN/ZH FAQ 的现有 HTML 沿用项目富文本渲染及安全处理，标签不显示为文本，链接可用，内容与原文一致。
- [ ] 不出现模拟 Studio、假队列、虚假进度，不修改真实 `VideoGenerator`。
- [ ] Flow 进程内路由切换、退出后原配置及 `default` 新进程的落地页、登录弹窗和可访问后台均已检查；无明显 CSS 污染，受权限限制的未检查项明确记录，Portal 差异如实标注。
- [ ] 记录 lint/类型检查/构建结果，并说明本轮新增错误与既有错误。
- [ ] 当前运行主题未改变，未 commit、未 push。

## 九、交付文档要求

`README.md` 和 `reference-notes.md` 至少记录：

- 参考仓库地址、本地参考目录、复制前各源文件的 SHA-256、**实际直接复制的原文件清单**；核对远端对应文件一致后才标注 Commit SHA，无法确认则注明“本地副本，提交版本未确认”。
- 每份源文件复制到哪里、保留了哪些内容、修改了哪些行/功能及原因。
- Theme Blocks 对应原 `Flow*` 视觉函数与 Seadance `section` 数据映射，以及 FAQ 富文本渲染、安全处理和 HTML 链接兼容方式。
- 源代码 Token 与 CSS 作用域处理方式，是否存在 Portal 弹窗样式差异。
- 本轮未迁移的模拟功能及其不能复用的原因。
- 原站与预览页面同宽截图、已迁移区块的视觉对比、整页顺序与内容差异和不可避免的业务区别；将 Transformations、Pricing、Stats 等未纳入本轮的参考站区块标为“本轮未迁移”，不要求整页结构一致。
- 安装/临时预览/正式启用/恢复步骤、检查结果、依赖与授权限制。
- 保留本计划作为执行记录；执行完成后标注状态，并由 README 链接实际验收结果，不将计划描述当作已完成事实。
- **不得声称“100% 源码原样”或“像素级一致”**，除非实际验证有据可依。

## 十、可直接发给 Codex 的最终执行指令

> 本轮只把 `flowaivideo-lol` 首页已有 UI **按源码直接移植**为 `src/themes/flow/` 内的备用主题，不启用、不部署、不改当前站点。**不要参考截图重新设计，不要自由发挥，不要重写 JSX/CSS。**
>
> 先按第 7 节盘点 imports，不擅自新增依赖；按第 5.2 节处理根容器选择器和局部变量，按第 7 节使用新进程确认 `.flow-shell` 及各覆盖区块，再检查原主题和 `default` 的样式回归。
>
> 以本地参考目录为实际复制基准，读取 `src/shared/blocks/flow/site.tsx`、`src/config/style/flow.css`、`src/config/style/theme.css`、首页 `page.tsx`、Header/Footer 等实际源码，复制前记录各源文件的 SHA-256。只有与远端对应提交文件逐一核对一致后才标注 Git Commit SHA，否则注明“本地副本，提交版本未确认”，不得套用远端最新 SHA。**直接复制原始 `site.tsx` 为主题的 `components/site.tsx`，复制原始 `flow.css` 为 `styles/flow.css`；从原始 `theme.css` 提取原色值到 `styles/tokens.css`。以这些复制文件为底稿，只做必要的删除与兼容修改。**
>
> 保留可用的原始 DOM/JSX、类名、组件层级、布局数值、卡片、按钮、动画和响应式逻辑。删除原项目模拟生成器、模拟排队及订阅判断；真实生成器由 Seadance 现有页面负责。创建少量薄 `blocks/` 适配层，绑定现有 `section`、EN/ZH 文案、视频与链接；不引入原站素材和营销内容。EN/ZH 现有 FAQ 包含 HTML，必须沿用项目富文本渲染及安全处理，保留链接，不能直接用 `{item.answer}` 把标签显示为文本。保持目标现有 JSON 的区块顺序，不新增主题 Page 编排。主题 CSS 仅做 `.flow-shell` 隔离及必要变量映射，**不能借机重写样式**。Header/Footer 优先用原有实现，无法高保真时在参考源码上作最小适配。
>
> 不改 `.env`、全局 CSS、locale JSON、主题加载器、其他主题、登录/支付/积分/生成器、未提交内容。临时预览并对比已迁移区块的视觉；整页截图仅记录差异，不要求整页结构一致。Transformations、Pricing、Stats 等未纳入本轮的参考站区块标为“本轮未迁移”，不为补齐截图新增内容、修改 JSON 或扩大范围。区块视觉如有差异，优先在原始源码中定位缺漏，不能自己重设计。交付源文件对照与差异清单、类型/构建结果、预览截图和最终 `git status`。**不提交、不推送。**

**完成定义：** 目标项目中新增一套以 `flowaivideo-lol` **真实源码为基础**、高保真保留已迁移区块的 DOM、样式、布局和交互、适配当前内容和真实业务、可临时预览的 Flow 主题。保持目标现有 JSON 顺序，不新增主题 Page 编排；整页截图记录差异，不要求整页结构一致，未纳入本轮的区块明确标为“本轮未迁移”。来源记录包含源文件 SHA-256 及经核实的 Commit SHA 或未确认状态。当前站点仍使用原主题。**已迁移区块保真通过与业务安全通过缺一不可。**
