# Flow 源码移植记录

执行日期：2026-10-21。范围：备用主题收纳，未正式启用。

## 来源与修改原因

实际复制基准：`D:\project3\shipany-2\flowaivideo-lol-main`。该目录没有 `.git`，**本地副本，提交版本未确认**。复制前 SHA-256 见 `source-manifest.json`。截图来源为公开原站 `https://flowaivideo.lol/`，用于视觉参考；未确认该线上部署与本地副本属于同一提交。

| 原文件 | 目标文件 | 处理 |
| --- | --- | --- |
| `src/shared/blocks/flow/site.tsx` | `components/site.tsx` | 完整复制后删除模拟业务、未迁移的价格/统计/转换展示；保留单文件，不重构布局 |
| `src/config/style/flow.css` | `styles/flow.css` | 原 `:root` 和 `.landing-shell` 改成 `.flow-shell`，其余选择器加外壳前缀；所有声明值不变 |
| `src/config/style/theme.css` | `styles/tokens.css` | 摘取两套原 Token，限制作用域；不引入全局 `@theme`，补充源 Header 所用的局部颜色别名 |
| `src/themes/default/blocks/header.tsx` | `blocks/header.tsx` | 直接复制，源文件逐字节一致；import 解析为本项目真实共享能力 |
| `src/themes/default/blocks/footer.tsx` | `blocks/footer.tsx` | 复制后只移除参考站外链徽章区域，其他 JSX 保留 |
| 原首页最后的 CTA JSX | `components/site.tsx` 内 `FlowCta` | 原容器、标题和按钮类名，改为接收当前 section 和按钮链接 |

新增文件：六个薄 Block、薄 Layout、文档、来源 manifest、原始 Diff 和检查/截图文件。没有新增主题 Page、消息、业务 API 或依赖。

## 依赖盘点

原 `site.tsx` 的 React hooks、`next/navigation`、`sonner`、`useAppContext`、`trackEvent` 由模拟业务使用，已随对应代码移除。其中参考 `@/shared/lib/analytics` 在当前项目不存在，无需为被删除逻辑补模块。

保留交互使用本项目已有 `@/core/i18n/navigation` 的 Link，图标使用已有 SmartIcon；React、next-intl、Lucide 和 Header/Footer 所用 Accordion、NavigationMenu、useMedia、cn 等均已存在。Header 的 SignUser、LocaleSelector、ThemeToggler、品牌等引用绑定本项目现有实现。未使用本仓 `features-flow` / `showcases-flow` 作为参考源码。

## 区块和数据映射

| Block | 来源 | 数据适配 |
| --- | --- | --- |
| Hero | FlowHero | `id/title/description/announcement/buttons/tip`；无来源数据的 model_tag、social_users 不显示，不编造文案；移除内嵌 FlowStudio |
| Showcases | FlowShowcase | `item.video.src → video`、`item.image.src → poster`；保留标题、描述用于可访问名称，原卡片改为 Link 承接现有链接；仍保留原比例、裁切和 hover 播放 |
| Features | FlowFeatures | 当前 items 和图标；只把参考固定图标表改接 SmartIcon，保留原卡片及网格类名 |
| FeaturesStep | FlowSteps | 当前 items，步骤编号使用现有排列的索引 + 1；原函数正文不变 |
| Faq | FlowFaq | 当前 question/answer；沿用项目对可信 locale HTML 的 `dangerouslySetInnerHTML` 渲染方式，保留链接，不额外声称存在 HTML 清洗；去掉参考站营销 CTA/硬编码统计 |
| Cta | 原首页 CTA | 当前 title/description/buttons；FlowAction 移除登录/订阅查询，变为 locale Link，保留原按钮类名并渲染已有图标 |

`FlowSectionHead`、`FlowSteps` 的原函数正文保留不变。`site.tsx` 主要删除量来自模拟 Studio、订阅门禁及本轮未迁移模块；并非为缩短代码重写视觉实现。详见 `source-changes.patch`。

## 静态验证结果

| 检查 | 状态 | 证据和限制 |
| --- | --- | --- |
| Flow 目录 ESLint | PASS | `checks/lint-flow.log`，退出码 0 |
| 全项目 TypeScript | FAIL（既有） | 修改前后输出完全相同：`scripts/test-model-landing.ts:198` 的 NextIntlClientProvider children 类型错误；无新增 Flow 错误 |
| 原 CSS 声明一致 | PASS | PostCSS 对比 390 条声明及值，只有选择器变更；比较时统一 CRLF/LF |
| Token 原值一致 | PASS | 浅色 52、深色 50 条原声明不变；新增的局部别名和外壳声明另行记录 |
| Header 原始字节一致 | PASS | 与复制前 SHA-256 一致 |
| 模拟业务移除 | PASS | FlowStudio、订阅接口、计时器、参考跟踪函数及硬编码统计未进入适配版 |
| 生产构建（Turbopack） | BLOCKED | `checks/build-flow.log`：编译阶段退出码 3221225477；未获得完整构建通过结果 |

## 浏览器与视觉验证

实际生成的截图见 `previews/`；同宽度的原站截图和本地截图分别以 `reference-`、`flow-` 命名。`flow-en-*` 为关闭应用 JavaScript 的 SSR 检查截图（实际为浅色）；`flow-ssr-dark-*` / `flow-model-ssr-dark-*` 明确设置根节点明暗 class 以比对原色值，不代表已验证 next-themes 客户端切换。

已在临时 `NEXT_PUBLIC_THEME=flow` 的 Webpack 进程实际取得首页 HTTP 200、`.flow-shell` 和 `Seedance AI Video Generator` 标题，并保存开启 JavaScript 的 `flow-desktop-first.png`。首个 Webpack 进程随后出现 Node 内存不足，完整客户端检查未完成，不能仅据首屏截图判定完整验收通过。

受限内存重试中，关闭应用 JavaScript 后取得英文首页的桌面/手机首屏及长截图：六个应显示区域、真实生成器容器、FAQ HTML 链接、原生 details 展开及无横向溢出检查通过，原始记录见 `checks/runtime-ssr.json`。这只验证 SSR、CSS 与原生交互，不覆盖客户端 hydration、移动菜单、登录弹窗或视频的 JavaScript hover 播放。

执行时发现全站语言配置仅注册 `en`；中文 JSON 存在但中文路由未启用。`runtime-ssr.json` 中 `/zh` 的区块检查失败对应未注册路由，不作为 Flow 中文区块实现失败。中文路由验收为 BLOCKED，未擅自修改全局语言配置；适配层继续使用传入 section，不写死英文文案。

同模式 SSR 复核结果见 `checks/runtime-model-and-appearance.json`：

- 首页和 `/seedance-2-0` 均返回 200，正确加载 Flow 外壳和各自标题，桌面/手机均未发现横向溢出。
- 显式设置明暗 class 后，原浅色/深色 primary 值均生效；未将此项记为客户端主题切换测试。
- 首页桌面视频墙保持三列、卡片比例 3:4，四张当前项目封面均返回 200；手机比例沿用原 CSS 的 9:16。
- 模型页的三个 Flow 步骤卡片正常渲染，specifications、use-cases、faq、related-resources 均保留 default 区块；未新增 Page 编排。

关闭 Flow 进程后，用独立 default 进程做 SSR 回归（`checks/runtime-default.json`）：无 Flow 外壳，原 `--primary: oklch(64% 0.21 268)` 保持，FAQ 使用原实现；匿名 `/admin` 保留 307 登录重定向。这不是已登录后台样式或登录弹窗的完整验收。

当前 `.env.development` 配置为 `videofly`，`.env.production` 为 `default`，均未修改；清除临时主题覆盖后，原配置的独立进程显示 `.videofly-shell`、无 `.flow-shell`，原深色 primary 值 `oklch(62% 0.21 260)` 保持，见 `checks/runtime-original.json`。所有本轮临时预览进程均已停止，不接管用户原配置。

完整客户端检查因首个进程内存不足、重试时 hydration 未完成而中止，没有使用模拟 API 或关闭类型检查制造通过结果。关闭应用 JavaScript 后的 SSR 截图可能保留 default 动画区块的初始隐藏状态；不能据此判断其完整客户端视觉。移动菜单、客户端主题切换、视频 hover 播放、Portal 登录弹窗、已登录后台均为 NOT RUN，需在资源充足的环境继续验收。生产构建仍为 BLOCKED，既有项目类型错误仍存在。

最终状态汇总见 `checks/acceptance.json`。目录外文件的内容哈希与执行前基线一致，见 `checks/workspace-scope.json`；未 commit、未 push、未部署。

### 已知视觉差异

- 页面保留现有 `Hero → Showcases → Generator → Features → Update → FAQ → CTA` 顺序；参考 Hero 内的模拟 Studio 被移除，真实生成器原位置、原外壳保持不变。
- Hero 的产品模型标语、用户数和成功率没有对应真实数据，因此不显示；当前两个真实 CTA 使用参考原按钮样式，构成与原站不同的标题区内容。
- 参考站品牌公告、Transformations、Pricing、Stats、FAQ 营销统计与外链徽章：本轮未迁移。
- 文案、语言、媒体、导航项数量来自当前项目；视频卡片仍采用参考源码桌面 3:4、手机 9:16 比例，未按旧主题 columns/compact 改写。
- Header 来自源文件，底层登录、导航、图标、语言组件来自本站；Footer 保留源布局，实际品牌链接来自本站。
- 模型页的 model-specs、use-case-cards、model-faq、related-resources 保持 default 回退，属预期混用；未替换或包装真实生成器。
- Portal 组件未继承局部 Token 时保留全局外观；未改全站 Provider。源站与目标的全局基础样式及真实内容也可能造成差异。

未测试真实生成、扣积分、付费购买或 OAuth 完整登录；本轮没有为视觉验收提交这些操作，也未改动相应业务代码。
