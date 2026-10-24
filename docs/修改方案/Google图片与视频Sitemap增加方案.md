# Google 图片与视频 Sitemap 增加方案

- 日期：2026-10-24
- 状态：静态 XML 接入已完成本地验证；已配对并纳入当前首页的 8 条作品；尚未部署和提交 Search Console
- 已确定的实现方向：先手工维护静态 XML；更新频繁后再用脚本生成相同的两个静态文件
- 项目：`D:\project2\seadance-video-shipany2`
- 关联方案：[Examples 展示区迁移计划](./Examples展示区迁移计划.md)

## 1. 目标与范围

为公开页面中的精选图片、视频补充媒体 sitemap，帮助 Google 发现资源及其所属网页。与 Examples 视觉迁移分别实施、分别验收。

推荐保留现有普通 `sitemap.xml`，新增：

- `/image-sitemap.xml`：页面与其中图片的对应关系。
- `/video-sitemap.xml`：页面与其中视频及元数据的对应关系。

两份文件放在 `public/` 下，第一期根据现有公开内容数据手工编写、随代码部署。覆盖首页已有的精选作品；其他页面逐步核验后纳入。作品数据变更时，同步检查页面、VideoObject 和两个 XML 文件。

不同时建设 mRSS，不引入新依赖，不改数据库，不将用户私人生成记录公开，不在本任务中批量创建视频详情页。

## 2. 当前代码基础

| 位置 | 当前情况 | 本次处理 |
| --- | --- | --- |
| `public/sitemap.xml` | 静态普通网页 sitemap，没有 image、video 扩展 | 保留现有结构和条目 |
| `src/app/robots.ts` | 声明 `/sitemap.xml` | 增加两份媒体 sitemap 声明 |
| `src/config/locale/messages/en/pages/index.json` | 含四条首页视频及封面、标题、描述、上传日期、时长 | 作为首批数据来源 |
| `src/config/locale/messages/zh/pages/index.json` | 对应中文内容 | 按实际 canonical 与可索引页面决定是否输出中文条目 |
| `src/app/[locale]/(landing)/page.tsx` | 从首页 `showcases.items` 输出 VideoObject | 保持来源一致，原则上不改入口 |
| `src/shared/lib/schema.ts` | 已有 `buildVideoSchema` | 复用字段语义，不重写现有结构化数据体系 |

以上是本地源码检查结果，不等于线上 sitemap、CDN、防火墙和 Google 抓取状态已经验收。

## 3. 推荐实现方式

采用两个静态 XML 文件，由项目现有静态资源机制直接提供。不增加 Route Handler、数据库查询、运行时生成逻辑或专用缓存层。

| 文件 | 计划内容 |
| --- | --- |
| `public/image-sitemap.xml` | 手工维护图片 sitemap，公开地址为 `/image-sitemap.xml` |
| `public/video-sitemap.xml` | 手工维护视频 sitemap，公开地址为 `/video-sitemap.xml` |
| `src/app/robots.ts` | `sitemap` 改为包含普通、图片、视频 sitemap 的地址列表 |

sitemap 接入本身仅涉及上述三个文件。XML 中填写经核验的生产站点绝对 URL，不依赖请求头或开发环境域名拼接地址。若同期 Examples 迁移产生视频与封面错配，先最小范围补齐真实封面和对应内容路径，再将作品纳入 sitemap。

部署后检查 XML Content-Type 与文件内容，确认 CDN 返回本次部署版本；有旧缓存时按现有部署平台方式刷新，不新增专用缓存系统。

普通 sitemap 保持原来的 URL 列表。第一期通过 robots.txt 与 Search Console 暴露新增文件，无需把原文件改成 sitemap index。

### 后续更新频繁时：脚本生成静态文件

- 当人工同步容易遗漏，或开始批量新增作品时，再增加例如 `scripts/generate-media-sitemaps.ts` 的生成脚本。
- 脚本读取现有公开内容数据，完成字段校验、绝对 URL 转换、XML 转义和去重，输出仍为 `public/image-sitemap.xml` 与 `public/video-sitemap.xml`。
- 先按需手动运行脚本并检查生成 diff，再随代码部署；有明确需求时才接入构建流程。
- 不改成动态接口，不同时保留两套生成机制。引入脚本后，内容数据作为来源，不再手工修改生成的 XML。
- 第一阶段不提前编写该脚本或公共生成工具。

## 4. 数据纳入规则

仅纳入同时满足以下条件的内容：

1. 所属页面真实存在、允许索引，且 canonical 指向预期页面。
2. 对应图片或视频确实在页面中呈现，与页面内容相关。
3. 媒体 URL 稳定、公开可访问，不需要登录或短期签名。
4. 标题、描述、封面和视频对应正确，不使用占位地址或虚构参数。

首页四条示例先进行资源与元数据核验，通过的条目才进入首批输出。

排除私人作品、管理后台、生成中任务、已删除媒体、占位图和无关装饰资源。不把所有 `public/` 文件自动当作 SEO 素材提交。

### URL 与语言

- `<loc>` 使用媒体所在网页的绝对 canonical URL；不能填成视频文件地址。
- 媒体相对路径转换为站点或实际 CDN 的绝对 HTTPS URL。
- 生产环境不得输出 localhost、预览域名或不存在的路由。
- 首期优先覆盖英文默认首页。中文页面若可独立索引且采用自指 canonical，再输出对应中文页面与中文元数据；不得机械复制语言前缀。
- 相同媒体可以出现在多个真实页面上；同一页面内相同媒体去重。
- 文件名、标题和描述保持实际内容，不为了关键词覆盖而批量生成重复条目。

## 5. 图片 Sitemap

采用标准 sitemap 命名空间和 image 扩展，结构为：

```text
urlset
  url
    loc：包含图片的网页地址
    image:image
      image:loc：该图片的绝对地址
```

- 只需先实现 `image:image` 与 `image:loc`，不添加已弃用的图片 title、caption、license 等 sitemap 标签。
- 封面、作品图片应与页面实际展示对应；不能仅为了加入 sitemap 而提交未使用资源。
- 视频的 `poster` 仍应提供给视频 sitemap；是否同时进入图片 sitemap，按页面呈现方式和图片用途核验，不能保证视频封面会成为独立图片搜索结果。
- 初期优先使用项目现有同域图片，降低跨域抓取排查成本。
- 后续使用 CDN 域名时，检查该域 robots 规则、访问权限及 Search Console 所有权验证条件。

## 6. 视频 Sitemap

采用标准 sitemap 命名空间和 video 扩展。一个页面可以声明其实际包含的多个相关视频，因此首页可在同一 `url` 下列出通过核验的示例。

| 输出字段 | 数据来源及规则 |
| --- | --- |
| `loc` | 视频所属网页地址；第一期为实际首页 canonical |
| `video:thumbnail_loc` | `item.image.src` 转为绝对地址 |
| `video:title` | `item.title`，与可见标题保持一致 |
| `video:description` | 真实可读说明，与页面含义一致，去除 HTML 标记，最长 2048 字符 |
| `video:content_loc` | `item.video.src` 转为实际媒体文件绝对地址 |
| `video:publication_date` | 经核验的首次公开日期；不把部署时间当作发布日期 |
| `video:duration` | 可选，将可靠时长转换为符合规范的秒数；缺失或无法可靠转换时省略 |

### 实施约束

- 首期提供 `content_loc`，不为了凑字段再创建播放器 URL。若以后采用嵌入式播放器，再按实际情况提供 `player_loc`。
- 缺少标题、说明、有效封面或视频文件地址的条目不写入 XML；核验时记录缺失项。后续引入生成脚本时，由脚本明确报告。
- JSON-LD 的 `duration` 采用 ISO 8601 字符串，视频 sitemap 则采用秒数，不能直接复制同一个字符串。
- 手工填写的文本和 URL 同样需要正确 XML 转义，尤其是 `&`、`<`、`>` 和 URL 查询参数。
- 不添加未经核实的观看量、评分、模型参数或作者身份。
- 永久有效的视频不填写过期时间；没有地区或平台限制时不制造限制。
- 页面、VideoObject、sitemap 和播放器 poster 使用一致的视频与封面地址。

## 7. 与 Examples 迁移的关系

### 第一期：完成发现与元数据基础

- 新增媒体 sitemap，保留首页四宫格或原有展示均可。
- Examples 改版时，保持视频元素与稳定媒体地址可在渲染后的页面中被发现。
- 不把视频地址只放在点击后才创建的弹窗里；预览播放可以由用户触发，但媒体发现不能只依赖用户操作。
- 保留原有 VideoObject 数据，核验其内容与可见页面一致。

这一阶段主要改善资源发现与信息一致性，不等于已经满足全部视频搜索展示条件。

### 后续可选：独立观看页

如果希望进一步争取视频搜索展示，单独规划每条精选视频的稳定观看页面，例如 `/examples/artist-at-sunset`。路径仅为示意，实施前检查现有路由冲突。

- 共用一个页面模板，每页以单条视频为主要内容。
- 页面直接呈现播放器、独特标题、说明和有价值的提示词内容。
- 为观看页提供对应 VideoObject、canonical 和普通页面 sitemap 条目。
- 视频 sitemap 将专用观看页作为主要承载地址；首页仍可展示相同视频，但不机械保留所有重复条目。
- 首页卡片保留快速预览，并提供可抓取的详情页链接。

观看页建设不属于本次 sitemap 最小接入的默认范围。与原 Examples 迁移计划中的弹窗体验可以并存。

## 8. 实施顺序

1. 检查当前工作区和生产域名配置，确认首批公开页面及 canonical。
2. 核验四条示例的视频、封面、元数据及页面实际呈现。
3. 根据核验结果手工编写 `public/image-sitemap.xml` 与 `public/video-sitemap.xml`，检查字段格式和 XML 转义。
4. 更新 robots.txt 的 sitemap 声明，保留现有普通 sitemap。
5. 使用现有工具解析两份 XML，核对媒体映射、必填字段、时长与重复条目；对 robots 改动运行相关静态检查，并通过构建或本地服务确认静态文件可访问。
6. 部署后检查 XML、页面、封面和视频文件的真实 HTTP 响应及抓取权限。
7. 在已验证的 Search Console 站点提交两份 sitemap，记录提交结果；发布和提交操作按用户后续授权执行。
8. 等待 Google 抓取，结合站点地图处理状态、网址检查及视频索引报告观察实际结果。

## 9. 验收清单

- [ ] `/sitemap.xml` 保持可访问，原有网页条目没有被覆盖。
- [ ] `/image-sitemap.xml`、`/video-sitemap.xml` 返回 200，Content-Type 与 XML 内容正确。
- [ ] XML 命名空间正确，可由 XML 解析器解析；特殊字符不会破坏格式。
- [ ] `<loc>` 指向真实公开网页，媒体字段指向实际文件，没有 localhost、占位资源或错误语言路径。
- [ ] 必填字段完整；视频时长格式与 JSON-LD 分别符合各自要求。
- [ ] 页面、VideoObject、封面和 sitemap 的信息一致。
- [ ] 没有暴露私人记录、临时签名链接和用户敏感信息。
- [ ] robots.txt 包含三份 sitemap 声明；Googlebot 所需资源未被 robots、登录要求或防火墙阻挡。
- [ ] 示例页面渲染后能发现视频容器和稳定媒体地址，无需用户先点击打开弹窗。
- [ ] 生产环境封面和视频真实可抓取；资源格式、重定向和响应头正常。
- [ ] Search Console 成功读取新增 sitemap；未把“已提交”当作“全部已收录”。

本地验证优先使用现有 XML 解析工具和人工数据核对，不为两份静态文件引入测试框架。以后增加生成脚本时，再针对转义、缺失字段过滤、绝对地址和时长转换补充必要校验。构建通过不能替代线上抓取验证。

## 10. 工作量、风险与回退

- **复杂度：**媒体 sitemap 最小接入较低；独立观看页为后续中等规模的展示层工作。
- **主要风险：**手工更新遗漏、媒体访问被 CDN/防火墙限制、实际元数据不准确、生产域名填写错误，以及首页并非以单条视频为主要内容。
- **效果边界：**sitemap 帮助发现，不保证收录、排名或富媒体展示；图片 sitemap、VideoObject 和专用观看页各自承担不同作用。
- **维护方式：**当前新增、修改或删除作品时，手工同步页面数据、VideoObject 对应字段和两份静态 XML，检查后一并部署。更新频繁后改用脚本生成这两个静态文件，公开 URL 保持不变。
- **回退：**移除 robots 中新增声明，并按本次提交范围回退新增的两个静态 XML 文件；不删除原有普通 sitemap 和 VideoObject。若已提交 Search Console，再同步移除对应 sitemap 提交记录。

## 11. 官方依据

- [Google：视频站点地图和替代方案](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps?hl=zh-cn)
- [Google：图片站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps?hl=zh-cn)
- [Google：视频 SEO 最佳实践](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)
- [Google：视频结构化数据](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn)

文档已于 2026-10-24 对照上述官方资料整理。实施前如规范发生变化，以当时官方要求为准。

## 12. 本次实施记录（2026-10-24）

- 新增 `public/image-sitemap.xml`、`public/video-sitemap.xml`，在 `src/app/robots.ts` 中增加对应声明。未增加动态路由、生成脚本或依赖。
- 原 `public/sitemap.xml` 经 SHA-256 对比保持字节不变；robots 的实际改动仅为 sitemap 地址列表。
- 执行期间首页内容同步调整为 8 条作品（4 条新视频与 4 条原有视频）。用户确定跟随新素材、在视频和封面配对后纳入，因此最终两份 sitemap 各包含 8 条对应媒体记录。
- 为 Web Acrobat、Paper Dragon、Glacier Titan 从实际视频提取并检查了三张 JPEG 封面，保存于 `public/imgs/examples/video/`；仅同步修改中英文首页这三条记录的图片路径，未修改展示组件或生成业务逻辑。Monster Bakery 沿用现有参考图片。
- 所有条目的标题、描述及媒体地址与当前英文首页数据一致。新素材沿用的发布日期缺少独立依据，配置时长为 5 秒但 ffprobe 测得约 6.58 秒，因此本批 sitemap 仅输出必填字段，省略发布日期和时长两个可选字段。首页现有 VideoObject 的时长、日期由素材迁移任务另行核验，本次未修改这些字段及其生成逻辑。
- 验证通过：两份 XML 可解析、命名空间及必填字段正确、8 条视频与 8 张图片的页面映射及双语资源路径一致、本地文件存在；定向 ESLint、两份 JSON 的 Prettier 检查及 `git diff --check` 通过。
- 本地 HTTP 验证 19/19 通过：两份 sitemap、robots.txt、8 张图片和 8 条视频均返回 200，XML Content-Type 正确，robots 包含三份 sitemap 声明。
- 已确认生产环境站点地址配置为 `https://seadance.video`。保留 robots 原有格式，没有顺带格式化其他规则。未运行全量生产构建；尚未部署，也未向 Search Console 提交。上线时需要将新素材与 XML 一起发布，再核验生产地址可访问性。
- 后续仍按静态文件维护。只有作品更新频繁时，再增加脚本生成这两个相同路径的文件。
