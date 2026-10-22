# Flow 备用主题

来源：`gateszhangc/flowaivideo-lol` 的本地源码副本。直接复制原文件后适配，未重新设计；当前未正式启用、未提交、未推送。

## 文件与接入方式

- `components/site.tsx`：原单文件工作副本，移除模拟 Studio、假排队、订阅门禁及本轮不迁移的展示模块。保留适用的原 JSX、类名和交互。
- `blocks/`：六个薄适配区块，以及从参考源码复制的 Header/Footer。
- `styles/flow.css`：参考 CSS，只有选择器作用域变化，390 条声明值保持不变。
- `styles/tokens.css`：原浅色/深色 Token 的作用域副本，保留原色值；补充局部 Tailwind 颜色别名及外壳的背景、文字、字体继承。
- `layouts/landing.tsx`：兼容现有 `header`、`footer`、`children` 接口，提供 `.flow-shell` 并引入两份 CSS。

未创建主题 `pages/`，继续使用现有 dynamic-page 和未覆盖 Block 的 default 回退；真实 `VideoGenerator` 仍由当前页面注入。无需修改 `themeNames`。

文案、品牌、媒体、导航和按钮来自当前项目 EN/ZH 数据。没有复制参考站的素材、套餐、宣传数字或公告，也没有新增 npm 依赖。

## 临时预览与恢复

在项目根目录的新 PowerShell 终端执行（不要与其他本项目 Next 进程共享构建缓存）：

```powershell
$env:NEXT_PUBLIC_THEME = 'flow'
pnpm exec next dev --webpack --port 3010
```

打开 `http://localhost:3010/`、`/seedance-2-0`。检查 `.flow-shell`、`.flow-hero`、`.flow-video-grid` 和 FAQ 的 `details`，不能只凭 HTTP 200 判断加载成功。

当前全站 `locales = ['en']`，虽然保留中文 JSON，`/zh` 和 `/zh/seedance-2-0` 尚未注册。本轮不修改目录外语言配置；中文路由验收为 BLOCKED，不能据此宣称 EN/ZH 均已实测通过。

结束后按 Ctrl+C，关闭该新终端；或删除本次临时覆盖，再启动原配置：

```powershell
Remove-Item Env:NEXT_PUBLIC_THEME
pnpm dev
```

没有改动 `.env*`，无需修改文件即可恢复。正式启用属于后续任务，需要单独设置部署主题值并完成回归，本轮未执行。

## 原始 Diff、检查与视觉差异

- [源码修改 Diff](./source-changes.patch)：参考原文件与适配文件的逐行对照，不包含修改原仓库或其他主题的操作。
- [薄适配新增 Diff](./theme-additions.patch)：六个 Block 与薄 Layout 的新增代码。
- [来源和字段映射](./reference-notes.md)、[复制前源文件哈希](./source-manifest.json)。本地副本提交版本未确认，没有将远端最新 SHA 当作本地版本。
- [验收结果汇总](./checks/acceptance.json)、[检查原始输出](./checks/)与[预览截图](./previews/)。测试结果和未完成项见 `reference-notes.md`。

这是区块源码移植，保留当前页面顺序；不是整页克隆。Hero 不含模拟 Studio，保留真实生成器的原位置与外壳；多按钮绑定当前数据，使用参考 CTA 的原按钮样式。参考站的 Transformations、Pricing、Stats 及 FAQ 营销统计本轮未迁移。

源布局的品牌公告没有迁移；现有业务布局的 LocaleDetector、TopBanner、统计组件仍由原路由处理。模型页未覆盖的规格、用例、模型 FAQ、相关资源保持 default，因此页面会同时出现原业务区块。`compact`、`columns`、旧主题 `className` 等布局提示没有用于改写参考源码中的固定比例和栅格。

Portal 登录弹窗及菜单可能渲染到 `.flow-shell` 外，继续使用全局主题变量；允许保留该差异，不修改 ThemeProvider。新主题 CSS 只作用于外壳，不代表 CSS 一定不会出现在其他构建分块中。

字体使用项目已有加载配置；原 Token 中的系统无衬线栈用于外壳，不下载新字体。中文长度、媒体内容、全局基础样式（如滚动条预留）会产生客观差异，不声称像素级一致。

## 使用范围

参考仓库附 ShipAny AI SaaS Boilerplate License，当前仅作授权项目内使用；未进行主题包公开分发或转售。来源路径和许可证哈希保存在 manifest 中。

[原收纳计划](./Flow_主题源码优先高保真收纳计划.md)保留作为执行依据；实际完成情况以检查记录为准。
