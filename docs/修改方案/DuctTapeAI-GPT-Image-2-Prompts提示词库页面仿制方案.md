# Duct Tape AI GPT Image 2 Prompts 提示词库页面仿制方案

## 2026-06-14 复核补充：mkfast-app / meigen.ai / nanobanana.org 瀑布流方向

新增参考源码：

```text
D:\project3\shipany-2\mkfast-app
```

重点参考页面：

```text
https://nanobanana.org/banana-prompts
```

复核结论：

1. 本次 V1 不建议回滚。
   - 当前 V1 已经建立了 `/prompts` 内容入口、服务端首屏取数、`/create?prompt=` 生成器闭环和 `published` 访问边界。
   - 这些都是未来瀑布流 prompt gallery 的前置基础，回滚会损失已经做对的低风险基座。
   - 当前实现没有扩 schema、没有改 admin、没有重写 `/api/prompts`，因此不会阻塞后续 V2。

2. 本次只做轻量微调，不把 mkfast-app 的完整 gallery 系统搬进 V1。
   - `mkfast-app` 的 prompt gallery 是完整运营系统：独立 prompt 表、media 表、category 表、同步脚本、详情页、收藏、服务端筛选、无限加载和瀑布流布局。
   - 这套方向适合 V2/V3，但如果现在照搬，会把一次简单 `/prompts` 上线变成 prompt CMS / gallery 系统重构。
   - V1 只把当前卡片列表从规则 grid 微调为 CSS columns 轻量瀑布流，视觉上向 meigen.ai / nanobanana.org 靠近，但仍然保持本地搜索、本地 Load More、服务端首屏取数的轻量边界。

3. V2 的目标应调整为“瀑布流 Prompt Gallery”，而不是继续强化当前卡片库。
   - 页面主体采用 masonry / columns 瀑布流。
   - 卡片以图片为第一信号，hover 后露出作者/统计/复制/使用按钮。
   - 支持服务端分页或无限加载。
   - 支持真实 category / model / sort / search。
   - 支持 prompt 详情页。
   - 但这些必须建立在数据结构和运营流程补齐之后，不进入 V1。

V2 可参考 `mkfast-app` 的文件：

```text
src/components/custom/prompt-gallery/prompt-masonry.tsx
src/components/custom/prompt-gallery/prompt-card.tsx
src/components/custom/prompt-gallery/masonry-utils.ts
src/components/custom/homepage.tsx
src/hooks/use-image-prompts.ts
src/api/image-prompts.ts
src/api/image-prompts-server.ts
src/lib/image-prompts.ts
scripts/prompts-sync.ts
scripts/prompts/prompts.json
```

对当前 V1 的最终处理建议：

```text
不回滚
+ 保留 `/prompts` SSR 基座
+ 保留独立 `prompt-library` block
+ 保留 `/create?prompt=` 闭环
+ 保留 by-title published 约束
+ 保留 ImageGenerator 的现有预设行为：进入 `image-to-image`，封面图不注入 Reference Image
+ 微调列表为轻量瀑布流视觉
- 不引入 mkfast-app 的 schema / sync / detail / favorites / infinite query
- 不在 V1 追加 category / model / mode / slug 字段
- 不重写 admin 和 prompt API
```

### `/prompts` 与 `/showcases` 的统一定位

当前 `/showcases` 通过 `usePrompts=true` 实际读取的也是 `prompt` 表，与新 `/prompts` 页面存在内容和 SEO 重复。后续 meigen.ai 风格图库统一以 `/prompts` 为主线，不再把 `/showcases` 发展成第二套公开图库。

最终职责：

```text
/prompts    唯一公开 Prompt Gallery、搜索与 SEO 主入口
/create     图片生成器
/showcases  历史兼容入口，合适时 301/308 重定向到 /prompts
```

数据层不合表：

- `prompt` 保存模板定义、Prompt 文本、封面和发布状态，是卡片与 Try It 的唯一真源。
- `showcase` 保存实际生成结果，未来审核通过后可作为某个 Prompt 的效果示例展示在 `/prompts` 内，不单独形成另一套公开频道。
- V1 不修改 showcase schema，也不公开自动保存的用户生成结果。
- V2 只有在多效果图和审核流程成为真实需求后，再考虑增加可空的 `sourcePromptId` 与 `status`；不提前引入 media/category 等完整 CMS 架构。

生成器语义保持与现有 `/showcases` 一致：选择模板后进入 `image-to-image`，`prompt.image` 只作为封面或效果预览，不写入 Reference Image，参考图由用户自行上传。

> 目标项目：`D:\project3\shipany-2\bananapro-org`  
> 参考页面：https://ducttapeai.com/gpt-image-2-prompts  
> 调研日期：2026-06-09  
> 目标：在 `bananapro-org` 中做一个正式的 Prompts Library 页面，学习参考页的资源库结构和交互闭环，但使用 Banana Pro 自有品牌、prompt 数据、图片和生成器入口。

## 1. 参考页可学习点

参考页本质不是普通落地页，而是“可搜索、可筛选、可复制、可一键进入生成器”的提示词资源库。

主要结构：

1. 顶部导航：品牌、Image Generator、AI Video Generator、Prompts、Pricing、Blog。
2. 首屏：`GPT IMAGE 2 PROMPTS LIBRARY`、`Explore Curated Prompts`、说明文案。
3. 工具栏：Random Copy、One Click Generate、Filter、总数量。
4. 分类筛选：All、App / Web Design、Social Media Post、Poster / Flyer、Product Marketing、Comic / Storyboard、Infographic / Edu Visual、Game Asset、YouTube Thumbnail。
5. 卡片：封面图、Featured、日期、标题、说明、Prompt 片段、Copy Prompt、Share、Try It。
6. 增量加载：Load More Prompts。
7. 页脚：产品、支持、法律链接。

本项目不应复制对方 prompt、图片、日期和品牌文案，只学习页面组织和交互模式。

## 2. 本项目现状

这次不能沿用 `nanobanana3pro-pro` 那套 `src/i18n/pages/{page}` 方案。`bananapro-org` 是 ShipAny 2 风格，页面和数据路径不同。

### 页面系统

相关文件：

```text
src/app/[locale]/(landing)/[...slug]/page.tsx
src/themes/default/pages/dynamic-page.tsx
src/themes/default/blocks/index.tsx
src/shared/types/blocks/landing.d.ts
src/config/locale/index.ts
src/config/locale/messages/en/pages/*.json
src/config/locale/messages/zh/pages/*.json
```

动态页面规则：

- 动态内容页从 `src/config/locale/messages/{locale}/pages/*.json` 读取。
- 页面注册需要在 `src/config/locale/index.ts` 的 `localeMessagesPaths` 加路径。
- `page.sections` 的每个 key 会按顺序渲染。
- block 名来自 `section.block || section.id || sectionKey`。
- 自定义 block 放在 `src/themes/default/blocks/{block-name}.tsx`，导出 PascalCase 组件。

### 生成器入口

相关文件：

```text
src/app/[locale]/(landing)/create/page.tsx
src/shared/blocks/generator/image.tsx
src/app/api/prompts/by-title/route.ts
```

已有能力：

- `/create?prompt=xxx` 会把 `xxx` 作为 `promptKey` 传给 `<ImageGenerator />`。
- `ImageGenerator` 会请求 `/api/prompts/by-title?title=xxx`。
- 请求成功后会把 `promptDescription` 填入 prompt 输入框，把 `image` 设置为 preview image。

这条链路非常适合做 `Try It`，不需要传超长 `?prompt=完整提示词`。

### Prompt 数据

相关文件：

```text
src/shared/models/prompt.ts
src/app/api/prompts/route.ts
src/app/api/prompts/by-title/route.ts
src/app/[locale]/(admin)/admin/prompts/page.tsx
src/app/[locale]/(admin)/admin/prompts/add/page.tsx
db/prompt_rows.sql
```

现有字段：

```text
id
userId
title
description
image
promptTitle
promptDescription
status
createdAt
updatedAt
sort
```

字段含义建议：

- `title`：卡片展示标题。
- `description`：卡片短说明。
- `image`：卡片封面图。
- `promptTitle`：稳定模板 key，用于 `/create?prompt=...`。
- `promptDescription`：完整可复制 prompt。
- `status`：只展示 `published`。
- `sort`：控制精选和排序。

当前缺口：

- 没有 `category`，无法实现参考页那种分类计数。
- 没有 `mode`，无法区分 `text-to-image` 和 `image-to-image`。
- `/api/prompts` 只支持 `page/limit`，没有 `search/category/total`。
- `/api/prompts/by-title` 没有限制 `status=published`。

## 3. 复核结论

按“最小入侵、最大收益、最稳版本”重新审核后，原方案里有几项偏重，不建议放进 V1：

1. 不建议 V1 改数据库 schema。
2. 不建议 V1 改 admin prompts 表单和后台流程。
3. 不建议 V1 改 `/api/prompts` 为复杂搜索/分类/分页接口。
4. 不建议 V1 新增 `category / mode / slug / usageCount` 这类扩展字段。
5. 不建议 V1 顺手动 `/showcases`、首页区块体系、动态 sitemap、Prompt 详情页。

这些点不是不能做，而是和当前目标不成比例。它们会明显扩大改动面，增加兼容风险，也会让这次“做一个 prompts library 页面”变成“顺手重构 prompt 系统”。

最稳的平衡点是：

- 新增一个独立 `/prompts` 页面。
- 新增一个独立、小体量的 `prompt-library` block。
- 直接复用现有 `prompt` 表、`getPrompts()`、`/create?prompt=`、`ImageGenerator promptKey`。
- 数据首屏服务端一次取够，页面内本地搜索、本地 `Load More`，不去扩写 API 体系。
- 只做一处必要的兼容修正：`/api/prompts/by-title` 只允许 `published`。
- `ImageGenerator` 保持既有行为：模板进入 `image-to-image`；`prompt.image` 只作为封面或效果预览，不注入 Reference Image，参考图仍由用户上传。

这是当前项目下更优雅、更保守、更不容易改坏现有流程的版本。

## 4. 最稳版方案

### 页面形态

正式页面仍然建议是：

```text
/prompts
/zh/prompts
```

原因不变：

1. 项目里已经有 `/create` 和 `/showcases`，`/prompts` 是最清晰、最不混乱的新入口。
2. 首页 FAQ 已经提到 `Banana Prompts Library`。
3. 不会和 `/showcases` 的职责打架。

### 数据策略

V1 直接复用现有 `prompt` 表，不新增字段。

页面首屏必须在服务端一次取全部或取一个保守上限，例如：

```ts
getPrompts({
  page: 1,
  limit: 60,
  status: PromptStatus.PUBLISHED,
})
```

然后在 `prompt-library` block 内做：

- 本地搜索
- 本地数量统计
- 本地 `Load More`
- 本地 `Random Copy`

这样做的好处：

1. 完全避免扩写 `/api/prompts` 查询接口。
2. 不引入跨数据库搜索兼容问题。
3. 不引入分页、筛选、搜索三套状态同步复杂度。
4. 对 40-80 条 prompt 的规模是完全够用的。

但 V1 上线前必须做一次最小公开数据预检。这个预检不改 schema、不改 admin、不做迁移，只确认即将公开展示的数据不会明显拉低页面质量：

1. `published` 数据里不要有明显的 `title / promptTitle / promptDescription` 错配。
2. `promptTitle` 必须可用于 `/create?prompt=`，不要为空、不要使用易变展示标题。
3. `promptDescription` 为空的 prompt 不应展示 Copy 按钮，或 Copy 时给出不可复制提示。
4. 对第三方品牌、影视角色、名人等敏感或侵权风险较高的 prompt，先人工确认是否适合公开展示。
5. 图片缺失的 prompt 要有明确的无图卡片展示规则，避免卡片布局破损。

这一步是发布质量门槛，不是 Phase 2 的运营系统建设。不要因为发现数据质量问题，就顺手扩字段、改后台或重写 API。

### 渲染策略

`/prompts` 不应做成纯 CSR，也不应先渲染空页面再在 `useEffect` 里请求 `/api/prompts`。

更合适的业内做法是：

```text
Server-rendered content + client-side interaction enhancement
```

也就是：

1. `/prompts` 页面本身是 App Router Server Component。
2. 服务端直接调用 `getPrompts({ status: PromptStatus.PUBLISHED })`。
3. 首屏 HTML 里已经包含 prompt 标题、描述、封面、prompt 片段和主要链接。
4. `PromptLibrary` 作为 Client Component 只接收 `items` 并处理浏览器交互。
5. 搜索、复制、分享、Random Copy、Load More 都是本地交互，不再额外请求后端。

这样做的收益：

1. SEO 更稳，搜索引擎和社交预览能看到真实内容。
2. 首屏更快，不需要等待客户端 hydration 后再拉列表。
3. 减少 `/api/prompts` 的公开查询职责，避免把简单页面做成前后端状态同步问题。
4. 和 Next App Router 的 Server Component 数据获取模型更一致。

缓存策略分两阶段：

```text
V1：先用真正 SSR/request-time rendering，保证数据发布后立即可见。
V2：prompt 规模稳定后，再引入 ISR 或 cached DB query。
```

V1 可以显式写：

```ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

但这只是保守上线策略，不是长期性能最优策略。等后台发布流程稳定后，可以改成：

```text
- 页面级 revalidate，例如 300 / 3600 秒
- 或给 getPrompts 做 unstable_cache
- 或在后台保存 prompt 后 revalidatePath('/prompts') 和 revalidatePath('/zh/prompts')
```

当前阶段不要为了缓存优化扩大改动面，但要在方案里明确：内容首屏由服务端渲染，客户端只增强交互。

### 交互范围

V1 保留参考页最有价值的交互，砍掉当前项目不具备数据基础的部分。

保留：

- 标题区
- 搜索框
- 卡片网格
- Copy Prompt
- Random Copy
- Share
- Try It
- Load More

暂不做：

- 真实分类体系
- 分类计数
- Featured 数据标记
- 独立 prompt 详情页

原因：

- 当前 `prompt` 表没有 category。
- 为了仿参考页去补 schema、后台表单、数据迁移，代价过高。
- 硬做会把代码变重，而且很容易出现“页面功能很多，数据质量跟不上”的情况。

因此 V1 的页面更接近：

```text
Prompt Library + Search + Copy + Try It
```

而不是：

```text
Prompt CMS + 分类系统 + 新数据模型 + 复杂 API
```

## 5. 最小改动清单

### 必做

```text
src/app/[locale]/(landing)/prompts/page.tsx
src/themes/default/blocks/prompt-library.tsx
src/config/locale/messages/en/pages/prompts.json
src/config/locale/messages/zh/pages/prompts.json
src/config/locale/index.ts
src/app/api/prompts/by-title/route.ts
src/shared/blocks/generator/image.tsx
```

### 可选但不应阻塞上线

```text
src/config/locale/messages/en/landing.json
src/config/locale/messages/zh/landing.json
public/sitemap.xml
```

### 明确不做

```text
src/config/db/schema.*
src/shared/models/prompt.ts 的结构扩展
src/app/api/prompts/route.ts 的复杂查询扩展
src/themes/default/blocks/prompt-library.tsx 内部 useEffect 请求 /api/prompts
src/app/[locale]/(admin)/admin/prompts/*
src/app/[locale]/(landing)/showcases/page.tsx
src/themes/default/blocks/showcases-flow-dynamic.tsx
```

## 6. 页面实现方式

页面使用手写 route，不走通用 `[...slug]` 动态 JSON 页。

原因：

1. 需要在服务端直接拉 prompt 数据。
2. 这样最清楚，不需要为了一个带数据的页面去改动态页面通道。
3. 和现有 `/create`、`/showcases`、`/ai-image-generator` 的手写页模式一致。

渲染边界：

1. `page.tsx` 是 Server Component，负责 metadata、面包屑 JSON-LD、读取翻译、查询 prompt 数据。
2. `PromptLibrary` 是 Client Component，负责本地搜索、复制、分享、Load More。
3. 不在 `PromptLibrary` 里 `useEffect(fetch('/api/prompts'))`。
4. 不把页面做成客户端空壳，也不依赖后续 API 请求补齐首屏内容。

页面骨架建议：

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { PromptStatus, getPrompts } from '@/shared/models/prompt';
import { JsonLd } from '@/shared/components/seo/json-ld';
import { buildBreadcrumbSchema } from '@/shared/lib/schema';
import { getMetadata } from '@/shared/lib/seo';
import { PromptLibrary } from '@/themes/default/blocks/prompt-library';

export const generateMetadata = getMetadata({
  metadataKey: 'pages.prompts.metadata',
  canonicalUrl: '/prompts',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.prompts');
  const section = t.raw('prompt-library');
  const prompts = await getPrompts({
    page: 1,
    limit: section.dataLimit || 60,
    status: PromptStatus.PUBLISHED,
  });

  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', url: envConfigs.app_url },
          { name: 'Prompts', url: `${envConfigs.app_url}/prompts` },
        ])}
      />
      <PromptLibrary section={section} items={prompts} />
    </>
  );
}
```

这里不需要 `initialTotal`、不需要后续分页 API、也不需要把页面搞成“半服务端半客户端查询控制器”。

如果后续要做 ISR，只调整缓存边界，不改变数据流方向：

```text
page.tsx 服务端取数 -> PromptLibrary 接收 items -> 客户端本地交互
```

## 7. `prompt-library` Block 设计

建议保持成单文件小组件：

```text
src/themes/default/blocks/prompt-library.tsx
```

不要一开始拆出 `prompt-card.tsx`、`filter-bar.tsx`、`search-box.tsx` 一堆文件。现在逻辑不大，过早拆分只会增加跳转成本。

组件 props：

```ts
type PromptLibraryProps = {
  section: Section;
  items: Prompt[];
};
```

这个组件虽然是 `'use client'`，但它不负责远程取数。它的输入必须来自 `page.tsx` 服务端传入的 `items`。不要写下面这种逻辑：

```tsx
useEffect(() => {
  fetch('/api/prompts?page=1&limit=60');
}, []);
```

原因是这会让页面退化为客户端空壳，首屏 HTML 没有真实 prompt 内容，也会让原本简单的本地搜索变成 API 状态同步问题。

组件内状态只保留最少几项：

```ts
const [query, setQuery] = useState('');
const [visibleCount, setVisibleCount] = useState(section.initialVisibleCount || 24);
const [copiedId, setCopiedId] = useState<string | null>(null);
```

派生数据：

```ts
const filteredItems = items.filter((item) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    (item.description || '').toLowerCase().includes(q) ||
    (item.promptTitle || '').toLowerCase().includes(q) ||
    (item.promptDescription || '').toLowerCase().includes(q)
  );
});
```

交互只做：

1. `Copy Prompt`
   - 复制 `promptDescription`，没有再退到 `description`。
   - 如果 `promptDescription` 为空，禁用按钮或给出提示，不复制空字符串。
2. `Random Copy`
   - 从 `filteredItems` 中随机一条复制。
3. `Try It`
   - 跳 `/create?prompt=${promptTitle}`。
4. `Share`
   - 优先 `navigator.share`，否则复制 `/create?prompt=${promptTitle}`。
5. `Load More`
   - 只是增加 `visibleCount`，不再请求后端。

这套逻辑高内聚，完全独立，不会碰现有生成、支付、任务、showcases 链路。

## 8. `pages/prompts.json` 设计

只保留真正会用到的字段，不放 category 配置。

英文示例：

```json
{
  "metadata": {
    "title": "Nano Banana Pro Prompts Library",
    "description": "Browse curated Banana Pro prompts, copy them, and jump straight into image generation.",
    "keywords": "Nano Banana Pro prompts, banana prompts, AI image prompt library"
  },
  "prompt-library": {
    "id": "prompts",
    "eyebrow": "NANO BANANA PRO PROMPTS LIBRARY",
    "title": "Explore Curated Prompts",
    "description": "Search, copy, and use production-ready prompts in Banana Pro.",
    "searchPlaceholder": "Search prompts, styles, or use cases...",
    "randomCopyLabel": "Random Copy",
    "copyLabel": "Copy Prompt",
    "copiedLabel": "Copied",
    "shareLabel": "Share",
    "tryItLabel": "Try It",
    "loadMoreLabel": "Load More Prompts",
    "emptyTitle": "No prompts found",
    "emptyDescription": "Try another keyword.",
    "dataLimit": 60,
    "initialVisibleCount": 24,
    "visibleStep": 24
  }
}
```

中文同理。

并在：

```text
src/config/locale/index.ts
```

增加：

```ts
'pages/prompts',
```

## 9. 仅保留两处小兼容修正

### 修正 1：`/api/prompts/by-title` 只允许公开 prompt

当前接口没有 `published` 限制。这个应当修。

建议：

```ts
where(and(eq(prompt.promptTitle, title), eq(prompt.status, PromptStatus.PUBLISHED)))
```

这是低风险、高收益修正，而且不会改变现有公开流程的预期行为。

### 生成器语义：模板封面不是 Reference Image

当前逻辑：

```ts
setActiveTab('image-to-image');
```

`prompt.image` 在当前数据模型里的职责是提示词卡片封面或效果示例，不是用户生成时需要提交的参考图。模板仍按现有流程进入 `image-to-image`，但 Reference Image 必须保持为空，让用户自行上传。

保持现有逻辑：

```ts
if (data.data.promptDescription) {
  setPrompt(data.data.promptDescription);
}
if (data.data.image) {
  setPreviewImage(data.data.image);
}
setActiveTab('image-to-image');
```

不要修改 `referenceImageUrls`、`referenceImageItems` 或 `ImageUploader.defaultPreviews`。用户只有在生成器中主动上传参考图并选择图生图时，这些状态才应变化。

这样既与 `/showcases` 的现有行为一致，也不会让提示词库的数据模型侵入生成器上传状态。未来若确实存在必须预置参考图的模板，应通过独立、明确的生成输入字段表达，而不是复用封面图。

## 10. 导航、SEO、站点图

### 导航

`landing.json` 增加 Prompts 链接是合理的，但应放到最后做，不阻塞页面本身上线。

建议新增：

```json
{
  "title": "Prompts",
  "url": "/prompts",
  "icon": "BookOpenText"
}
```

如果你想更保守，甚至可以先不上 header，只通过内部入口和 sitemap 验证页面，再补导航。

### SEO

保留：

- `getMetadata()`
- Breadcrumb JSON-LD

不做：

- ItemList JSON-LD
- 复杂 SEO 变体页
- `/gpt-image-2-prompts` 别名页

这些不是永远不做，而是不放进 V1。未来如果要参考 meigen.ai 这类“prompt gallery + prompt detail + model/topic SEO 页面 + 一键复用生成”的模式，可以在 `/prompts` 稳定后再扩。

### sitemap

当前项目是静态 `public/sitemap.xml`。这次只手动加 `/prompts` 即可，不动 sitemap 架构。

## 11. 实施顺序

建议按下面顺序做，任何一步都可以单独回滚，互相之间耦合很低：

1. 新增 `pages/prompts.json` 的 en/zh 文案。
2. 在 `localeMessagesPaths` 注册 `pages/prompts`。
3. 新增 `src/app/[locale]/(landing)/prompts/page.tsx`。
4. 新增 `src/themes/default/blocks/prompt-library.tsx`。
5. 做一次 V1 发布前数据预检，只处理明显错配、空 prompt、敏感公开内容和缺图展示规则。
6. 修正 `/api/prompts/by-title` 的 `published` 约束。
7. 核对 `ImageGenerator` 的模板图片语义：进入 `image-to-image`，封面只作示例预览，不进入参考图状态。
8. 页面稳定后，再决定是否把 `/prompts` 放进 header/footer 和 sitemap。

## 12. 验收重点

这版验收只关注真正做了的东西：

1. `/prompts` 和 `/zh/prompts` 可访问，metadata 正常。
2. 查看页面 HTML 或禁用 JS 后，仍能看到首屏 prompt 内容，不是客户端空壳。
3. 页面只展示 `published` prompt。
4. 搜索能匹配 `title / description / promptTitle / promptDescription`。
5. `Copy Prompt` 复制的是完整 prompt；`promptDescription` 为空时不复制空字符串。
6. `Try It` 跳到 `/create?prompt={promptTitle}`。
7. 加载到生成器后，Prompt 文本正确填入并进入 `image-to-image`；模板封面不出现在 Reference Image 中，由用户自行上传参考图。
8. `Load More` 只是本地扩展显示数量，不引入新请求和新状态同步问题。
9. `PromptLibrary` 不在 `useEffect` 中请求 `/api/prompts`。

## 13. 与未来 meigen.ai 阶段的衔接

这次 `/prompts` 改造不能和未来参考 meigen.ai 的方向冲突。更好的定位是：V1 先把“可索引、可浏览、可复制、可进入生成器”的 prompt 基础层做稳，未来再在这个基础上扩成更完整的 gallery/workflow 产品。

当前从 meigen.ai 能学到的长期方向，不是单纯加一个 prompt 列表，而是：

```text
Prompt/Gallery 内容入口
+ prompt 详情页
+ 模型或主题聚合页
+ 可复用 prompt 的编辑/生成闭环
+ 图片到 prompt / 反向提示词能力
+ 浏览量、点赞、作者、来源等社会证明
```

但这些都不应该提前塞进本次 V1。原因是当前项目还缺少对应的数据结构、后台运营流程和内容质量控制。如果现在为了未来形态一次性扩 schema、扩 API、扩 admin，会把这次低风险上线变成系统重构。

### V1 如何促进未来阶段

本次方案对未来 meigen.ai 阶段有四个前置价值：

1. `/prompts` 成为稳定的 prompt 内容入口，后续可以继续承载分类、主题、模型聚合页。
2. `promptTitle` 作为稳定 key，继续支撑 `/create?prompt=` 和未来详情页 slug。
3. 服务端渲染 prompt 首屏内容，为后续 SEO 页面矩阵打基础。
4. `PromptLibrary` 先建立“搜索、复制、分享、Try It”的最小闭环，未来可以扩展为“查看详情、编辑 prompt、按模型生成”。

### 预留但不实现

V1 代码和文案应保持对这些未来字段友好，但不真正落地：

```text
category / topic
model
source / creator
likes / views
slug
detail page
related prompts
image-to-prompt
video prompts
```

具体做法：

1. 组件命名使用通用的 `PromptLibrary`，不要写死成 GPT Image 2 或 DuctTapeAI 风格。
2. URL 使用通用 `/prompts`，暂不创建 `/gpt-image-2-prompts`、`/nano-banana-prompts` 等 SEO 变体页。
3. `Try It` 继续只依赖 `/create?prompt={promptTitle}`，不要绑定某个未来模型或供应商。
4. 卡片 UI 不要伪造 `Featured`、likes、views、creator 等当前没有真实字段的数据。
5. 未来要扩 meigen.ai 类 gallery 时，优先新增独立详情页和聚合页，而不是推翻 `/prompts`。

### 阶段路线

建议阶段顺序：

```text
Phase 1：本次 /prompts V1
- SSR prompt library
- 本地搜索、复制、分享、Try It
- 不扩 schema，不改 admin

Phase 2：数据质量和运营基础
- 清洗现有 prompt 数据
- 补稳定 slug/category/model/source 等字段
- admin 支持分类、模型、发布状态、排序

Phase 3：meigen.ai 类 gallery/workflow
- prompt 详情页
- 按模型/主题/场景的 SEO 聚合页
- 图片到 prompt 或参考图反推 prompt
- prompt 编辑后直接生成
- likes/views/creator/source 等真实社会证明

Phase 4：多模型和视频扩展
- 图像 prompt、视频 prompt 分流
- 模型页和用途页矩阵
- 生成器根据 prompt metadata 自动选择默认模式
```

这意味着 V1 的目标不是“现在就做一个 meigen.ai”，而是“先做一个不会阻碍未来 meigen.ai 化的 prompt 基础入口”。

## 14. Phase 2：分类和运营基础

分类最终应该做，但不应该进入 V1。更合理的第二阶段目标是：在 `/prompts` V1 已经稳定、prompt 数据质量确认过后，把提示词库从“可浏览列表”升级成“可运营内容库”。

### Phase 2 目标

Phase 2 只解决这几件事：

1. 建立稳定分类体系。
2. 清洗并补齐 prompt 数据。
3. 让后台能维护分类、模型、排序和发布状态。
4. 让 `/prompts` 支持分类筛选，并继续保持服务端首屏渲染。
5. 为后续 prompt 详情页、SEO 聚合页、meigen.ai 式 gallery 打数据基础。

Phase 2 仍然不做：

```text
likes / views
creator 社区体系
prompt 详情页
image-to-prompt
video prompts
多模型生成器重构
复杂推荐算法
```

### 分类体系建议

先用少量稳定分类，不要一开始做太细。建议从 8-10 个一级分类开始：

```text
Portrait / Headshot
Product Marketing
Poster / Flyer
Social Media Post
App / Web Design
Logo / Brand
Infographic / Education
Comic / Storyboard
Game Asset
Photo Restoration / Edit
```

中文站点只翻译分类显示名，分类 key 保持英文 slug，避免中英文数据两套分裂。

建议字段形态：

```text
category：主分类 slug，例如 product-marketing
tags：可选标签数组或逗号字符串，例如 ecommerce, amazon, studio-lighting
model：推荐模型或来源模型，例如 nano-banana / gpt-image / midjourney
mode：text-to-image / image-to-image
slug：详情页预留 slug，V2 可先写入但不一定开放详情页
source：来源备注或内部运营来源，先后台可见即可
```

如果要保持最小 schema，Phase 2 可以先只加：

```text
category
model
mode
slug
```

`tags/source/creator/likes/views` 可以继续延后。

### 数据清洗任务

V1 上线前只做最小公开数据预检；Phase 2 开始前再系统处理现有 seed 和生产数据质量：

1. 修正 `title / description / promptTitle / promptDescription` 不一致的数据。
2. 确保 `promptTitle` 唯一且稳定，不再随标题文案随意变化。
3. 补齐缺失封面图，或明确无图 prompt 的卡片展示规则。
4. 对包含第三方品牌、人物、影视角色的 prompt 做标记或下架策略。
5. 给每条 published prompt 补 `category / model / mode / sort`。

这个阶段比做 UI 更重要。分类页面如果数据不准，会直接降低提示词库可信度。

### 后台和模型改动

Phase 2 可以修改后台，但要控制边界：

```text
src/config/db/schema.*
src/shared/models/prompt.ts
src/app/[locale]/(admin)/admin/prompts/*
db migration
seed / backfill script
```

后台表单新增：

1. `category` 下拉选择。
2. `model` 下拉选择。
3. `mode` 下拉选择。
4. `slug` 自动生成并允许手动修正。
5. `sort` 和 `status` 继续保留。

后台列表新增：

1. 分类列。
2. 模型列。
3. 模式列。
4. 分类筛选。
5. 发布状态筛选。

### 前台改动

`/prompts` 在 Phase 2 可以增加分类筛选，但仍然不要退回 CSR。

推荐实现：

```text
/prompts                 全部 prompts
/prompts?category=poster 分类筛选
/zh/prompts?category=poster
```

V2 仍不急着做：

```text
/prompts/poster
/prompts/gpt-image-2
/prompts/[slug]
```

原因是 query 参数筛选改动小，适合验证分类是否有价值。等分类数据稳定、SEO 需求明确后，Phase 3 再做静态路径式聚合页和详情页。

服务端数据流：

```text
page.tsx 读取 searchParams.category
-> getPrompts({ status: published, category, limit })
-> SSR 输出当前分类首屏卡片
-> PromptLibrary 继续做本地搜索、复制、分享、Load More
```

如果 prompt 数量超过 100-200 条，再考虑服务端分页或 API 分页；不要为了未来大规模提前重写。

### SEO 和缓存

Phase 2 可以增加：

1. 分类筛选的标题文案，例如 `Product Marketing Prompts`。
2. 分类说明文案。
3. 分类维度 canonical 规则。
4. ItemList JSON-LD 的可行性评估。
5. 页面级 `revalidate` 或 cached DB query。

但不要急着铺大量 SEO 变体页。分类筛选先以用户体验和数据验证为主，SEO 矩阵放到 Phase 3。

### Phase 2 验收标准

1. admin 能创建和编辑带分类的 prompt。
2. 旧 prompt 数据完成 backfill，published 数据没有明显标题/prompt 不一致问题。
3. `/prompts` 默认 SSR 展示全部 published prompts。
4. `/prompts?category=xxx` SSR 展示对应分类，禁用 JS 后仍能看到分类结果。
5. 分类筛选不请求新的复杂搜索 API。
6. `Try It` 继续使用 `/create?prompt={promptTitle}`。
7. `mode` 字段只用于默认打开文生图/图生图，不重构生成器。
8. V2 完成后再评估是否进入 prompt 详情页和 SEO 聚合页。

## 15. V1 明确延后项

下面这些不是坏实践，但放在 V1 就是过度：

- 分类体系
- `category` 数据字段
- `mode` 数据字段
- admin prompt 表单改造
- `/api/prompts` 搜索/筛选/分页重写
- Prompt 详情页
- showcases 和 prompts 合并
- sitemap 动态化
- prompt 统计、收藏、点赞

等 `/prompts` 页面上线、确认确实需要分类运营时，再单独做第二阶段，不要在第一版一起上。

## 16. 最终建议

最佳平衡点不是“功能最像参考站”，而是“在现有项目里最少改动地做出最有价值的那 20%”。

所以这次最稳版本应该是：

```text
新增一个 /prompts 页面
+ 一个独立 prompt-library block
+ 复用现有 prompt 表和 /create?prompt=
+ 页面内本地搜索和本地 Load More
+ 只做两处小兼容修正
- 不扩数据库
- 不扩后台
- 不重写 API
- 不碰 showcases
- 不顺手改无关流程
```

这版足够小、足够清晰、足够兼容，也符合最佳实践里的高内聚低耦合。
