# Spark 主题源码副本

来源：`D:\project2\80sphotoai-com` 的本地工作区，复制日期：2026-10-22。
原主题及配套文件按原样复制，没有优化、格式化或改写。当前站点未切换主题。

## 目录

- `blocks/`、`components/`、`layouts/`、`styles.module.css`：完整原主题，共 13 个文件。
- `reference/theme.css`：源项目的全局 Token 与 Tailwind 映射原件。
- `reference/global.css`：源项目的全局样式原件，其相对导入仍指向旁边的 `theme.css`。
- `assets/`：源项目 `public/spark/` 下的 `logo.svg` 和 `preview.png`，尚未放入当前项目的 `public/`。
- `source-manifest.json`：17 个复制文件的源路径、目标路径与 SHA-256，用于核对来源和复制完整性。

`reference/` 中的 CSS 没有被导入；只供以后接入时参考，不会覆盖当前全局样式。

## 以后启用

1. 设置 `NEXT_PUBLIC_THEME="spark"`，重启开发服务；部署时重新构建。
   现有加载器可直接发现主题目录，不依赖 `themeNames`；缺少的 Page/Block 继续回退 default。
2. 对照 `reference/theme.css` 接入配色。仅切环境变量不会自动加载这份 CSS。
   原主题依赖 `--brand`、`--brand-foreground` 及 `text-brand` 等映射；不能只复制组件后忽略这些变量。
   是否合并全局 Token、或改成主题局部作用域，应在实际启用时决定，不要直接覆盖当前全局文件。
3. 源项目在 `src/app/layout.tsx` 使用 `next/font/google` 加载：
   - `Inter`：`subsets: ['latin']`、`variable: '--font-ui'`、`display: 'swap'`。
   - `Instrument_Serif`：`subsets: ['latin']`、`weight: '400'`、`style: ['normal', 'italic']`、`variable: '--font-display'`、`display: 'swap'`。
   - `JetBrains_Mono`：`subsets: ['latin']`、`variable: '--font-mono'`、`display: 'swap'`、`preload: true`。
   接入时需要将相应字体的 `.variable` 类挂到外层；本次没有修改当前项目字体设置。
4. 文案、导航、按钮和图片仍从当前项目的 `section` / locale JSON 读取。
   若使用附带素材，将 `assets/` 中需要的文件复制到目标项目的 `public/spark/`，再在品牌配置中引用。

## 边界与验证

- 这是源码收纳，不代表已完成换肤、浏览器验收或跨项目兼容验证。
- 保留原主题的图片展示方式，未将 Showcases 改造成视频播放器。
- 依赖现有 ShipAny 共享组件、`next-intl`、`lucide-react`、Next.js 和 React；没有安装新依赖。
- 未复制源项目的业务配置、环境变量、登录、支付、生成器或页面文案；附带 logo 是源项目素材，使用时按新项目品牌替换。
- 当前主题、全局 CSS、业务代码与环境文件均未修改。以后真正启用时，再单独验证明暗模式、手机导航、Portal 弹窗与各页面回退。
