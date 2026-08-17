# Seedance 2.5 1080p 中文博客协作与验收报告

更新时间：2026-08-17（Asia/Shanghai）

## 交付结论

本次采用“关键词研究 + 可验证中文博客”的最小落地方案：

- 新增文章：**content/posts/seedance-2-5-1080p-guide.zh.md**
- 逻辑 slug：**seedance-2-5-1080p-guide**
- 英文文章 **content/posts/seedance-2-5-1080p-guide.md** 保持不变
- **scripts/seed-blogs.ts** 不修改、不执行
- 不新增依赖，不修改数据库 schema、环境变量、路由、认证、支付或线上配置

文章不把“Seedance 2.5 = 普遍 1080p”写成事实，而是围绕当前入口设置、账号/区域/套餐/mode 和下载文件元数据提供核验流程。

## 网页 ChatGPT (high) 协作

- 对话链接：[Seedance 2.5 研究报告](https://chatgpt.com/c/6a82be49-81e4-83e8-b6a5-395d60badf39)
- 任务发送方式：将安全源码 ZIP 作为附件，随后发送完整工程任务
- High 交付耗时：页面显示约 4 分 56 秒
- 交付内容：事实边界、关键词地图、英文/中文长尾词、Fumadocs 落地判断、完整中文 MDX、seed 脚本决策和验证清单

High 的结论不能替代本地验收。本报告的源码判断和测试结果以当前工作树为准。

## 源码 ZIP 基线与安全证据

- 分支：**main**
- 基线 commit：**4eba2b90029121ee1622bc39005eab4abec66cbe**
- ZIP：**D:\project2\seedance-zh-blog-source-baseline-20260817_154820832.zip**
- 文件数：27
- 大小：178,316 bytes
- SHA-256：**219BD9C378AADF09109D8D510BC1F46FFF6F0E4C0B55D875DD78F06BC13FC92E**
- 工作区打包前状态：clean
- 已排除：.git、node_modules、.next、.source、环境变量文件、数据库、构建缓存、运行状态和浏览器状态
- 文件名扫描：通过
- 高置信度凭据模式扫描：通过

上传时页面的系统文件选择器没有被浏览器自动化捕获；经过可见菜单、隐藏 input、DOM CUA 和 CUA 路径核验后，使用同一已登录内置浏览器会话的二进制剪贴板附件路径成功生成 ZIP 附件卡片。页面显示 Zip Archive，未发送 ZIP 内容为普通文本。上传前后的原始 ZIP 哈希以本地文件为准。

## 关键词研究摘要

搜索量、CPC、KD 和趋势数据均未量化；本次没有可靠的关键词数据库权限，因此不制造数字。优先级依据搜索意图、距生成入口的转化距离、内容可承接性和事实可验证性排序。

| 关键词簇   | 代表词                                                                | 搜索意图                  | 优先级 |
| ---------- | --------------------------------------------------------------------- | ------------------------- | ------ |
| 核心规格   | Seedance 2.5 1080p；Seedance 2.5 是否支持 1080p                       | 确认能否得到 Full HD      | P0     |
| 设置与教程 | Seedance 2.5 1080p 怎么设置；how to generate 1080p with Seedance 2.5  | 找到可执行步骤            | P0     |
| T2V / I2V  | Seedance 2.5 文生视频 1080p；Seedance 2.5 图生视频 1080p              | 选择生成模式并写 prompt   | P0     |
| 导出验收   | Seedance 2.5 export settings；Seedance 2.5 1920x1080 video            | 验证实际文件              | P0     |
| 画幅       | Seedance 2.5 16:9；Seedance 2.5 9:16                                  | 为 YouTube/短视频选择构图 | P1     |
| 商业场景   | Seedance 2.5 product ad prompt；Seedance 2.5 ecommerce video          | 生成产品广告与电商视频    | P1     |
| API / 交易 | Seedance 2.5 1080p API；Seedance 2.5 pricing；Seedance 2.5 free 1080p | 购买、接入和权限判断      | P1     |
| 风险排查   | Seedance 2.5 fix blurry video；Seedance 2.5 fix flicker               | 解决模糊、闪烁和不稳定    | P1     |
| 高风险规格 | Seedance 2.5 4K 60fps；Seedance 2.5 no watermark                      | 辟谣或条件性核验          | P2     |

高意图长尾词（均未量化）：

英文表达：

1. does seedance 2.5 support 1080p
2. is seedance 2.5 available in 1080p
3. how to generate 1080p with seedance 2.5
4. seedance 2.5 1080p export settings
5. seedance 2.5 1920x1080 video
6. seedance 2.5 1080p 16:9
7. seedance 2.5 1080p 9:16
8. seedance 2.5 image to video 1080p
9. seedance 2.5 image to video prompt for product
10. seedance 2.5 text to video 1080p
11. seedance 2.5 1080p prompt template
12. best seedance 2.5 prompt for product ads
13. seedance 2.5 ecommerce product video prompt
14. seedance 2.5 short form video prompt
15. seedance 2.5 1080p vs 720p
16. seedance 2.5 1080p vs 4k
17. seedance 2.5 1080p download resolution
18. how to check seedance video resolution
19. seedance 2.5 video metadata width height
20. seedance 2.5 1080p api
21. seedance 2.5 api resolution parameter
22. seedance 2.5 1080p pricing
23. seedance 2.5 1080p free
24. seedance 2.5 commercial use
25. seedance 2.5 fix blurry video
26. seedance 2.5 fix flicker 1080p

中文自然表达：

1. Seedance 2.5 是否支持 1080p
2. Seedance 2.5 1080p 怎么设置
3. Seedance 2.5 1080p 怎么导出
4. Seedance 2.5 1080p 分辨率怎么看
5. Seedance 2.5 1080p 和 720p 区别
6. Seedance 2.5 1080p 和 4K 区别
7. Seedance 2.5 图生视频 1080p 教程
8. Seedance 2.5 文生视频 1080p 教程
9. Seedance 2.5 9:16 竖屏提示词
10. Seedance 2.5 16:9 横屏提示词
11. Seedance 2.5 产品广告提示词
12. Seedance 2.5 电商视频提示词
13. Seedance 2.5 短视频提示词模板
14. Seedance 2.5 商品图转视频
15. Seedance 2.5 导出参数验收
16. Seedance 2.5 视频模糊怎么修
17. Seedance 2.5 视频闪烁怎么修
18. Seedance 2.5 API 支持 1080p 吗
19. Seedance 2.5 免费版有 1080p 吗
20. Seedance 2.5 商用授权怎么看
21. Seedance 2.5 有水印吗
22. Seedance 2.5 价格怎么算

## 事实核验与风险

独立核对的 [ByteDance Seed 官方发布页](https://seed.bytedance.com/zh/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)确认：

- 发布时间为 2026-07-31；
- 单次生成时长达 30 秒；
- 单次最多输入 30 张图片、10 段视频和 10 段音频参考；
- 发布页当时描述即梦 Web、豆包专业版逐步上线，API 近期上线火山方舟。

独立打开的 [BytePlus Seedance 产品页](https://www.byteplus.com/en/product/Seedance)当前公开列出 480P / 720P、4–30 秒和 API 文档入口。High 还核对到 BytePlus 活动页出现 1080P 套餐文字，但同页 FAQ 出现最高 720P 的冲突，因此文章采用条件性表述。

不能从当前资料普遍推出的内容包括：2.5 原生 4K、4K 60FPS、固定免费额度、固定价格、无水印、所有账号/区域/API 都支持 1080p，以及 blanket 商用授权。现有英文文章中的这些断言没有被本次中文文章复制。

## 技术落地判断

### 为什么只新增 .zh.md

仓库已有 **content/logs/v1.0.zh.mdx** 和 **content/logs/v2.0.zh.mdx**，且 **src/core/docs/source.ts** 明确配置 defaultLanguage 为 en 与 languages 为 en、zh。因此 **content/posts/seedance-2-5-1080p-guide.zh.md** 符合项目现有 Fumadocs 本地化约定，逻辑 slug 保持 seedance-2-5-1080p-guide。

### 为什么不改 scripts/seed-blogs.ts

当前 seed 接口虽然声明了 locale，但查询只按 slug，写库也没有使用 locale；读取端 getPost() 是数据库优先、本地 MDX 后备，列表合并也按 slug 让数据库覆盖本地。另一个可见不一致是 seed 写入 online，读取端筛选 published。因此简单追加 zh seed 不能提供可靠的语言隔离，可能更新英文 slug 或遮蔽中文本地文章。

这次不修改数据库 schema、不迁移真实数据，也不把这个风险扩大成无授权重构。若生产数据库已有相同 slug 的 published 记录，/zh/blog/seedance-2-5-1080p-guide 仍需在本地环境单独核验，不能仅凭静态文件宣称已解决。

## High 被要求纠正的问题

本次没有对 High 进行内容返工追问；最终交付已主动规避以下风险：

- 不复制现有英文文章里的“2.5 原生 4K60”“50 张图片参考”等高风险规格；
- 不将 Seedance 2.0 的 1080P/4K 文档移植为 2.5 规格；
- 不把 prompt 中的 1080p 当作分辨率开关；
- 不固定价格、免费额度、商用授权或无水印承诺；
- 不新增 zh seed，避免当前 slug-only DB-first 路径覆盖英文或遮蔽本地中文。

## 独立验收记录

以下命令在修改完成后执行，结果将在本报告后续维护中补充：

- pnpm lint
- pnpm format:check
- pnpm exec tsc --noEmit
- pnpm build

内容验收还包括：

- 中文文件被 Fumadocs 发现；
- /zh/blog/seedance-2-5-1080p-guide 渲染中文；
- /blog/seedance-2-5-1080p-guide 仍使用原英文文章；
- 正文没有重复 H1；
- 文章只使用已存在的 /#generator CTA；
- 原英文文件、seed 脚本、依赖和锁文件无变化；
- 未执行数据库 seed、迁移、提交、推送、PR、部署或线上配置变更。

## 当前交付状态

本次代码仅为本地工作树修改。未执行 Git commit、push、PR、部署、数据库迁移、数据库 seed 或生产验证。
