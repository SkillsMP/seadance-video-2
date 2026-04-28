# hreflang 修复方案

> 复审结论：方向正确，但首轮必须收敛。
> 最稳做法是先移除“确定错误”的全站 alternate，再让已经有明确 canonical 的核心 SEO 页面自动输出正确 hreflang。不要为了追求全量覆盖而引入 slug 映射、pathname 探测或 metadata 大重构。

---

## 一句话结论

采用更保守的首轮修复：

1. 删除 `src/app/layout.tsx` 里的全站手写 `hreflang`
2. 小幅扩展 `src/shared/lib/seo.ts`：保留现有 canonical 生成逻辑，只新增 languages 生成逻辑并复用同一套 URL 规则
3. 只补高确定性的手写 metadata 页面：`[...slug]`、`blog/category/[slug]`
4. `blog/[slug]` 首轮只保留 canonical，不盲目补全语言 alternate，等确认文章跨语言 slug 策略后再处理

不做大重构，不改路由，不引入 pathname 探测，不统一重写所有 metadata。

---

## 为什么这样最稳

当前错误不是页面渲染错误，而是 SEO head 输出错误。

问题代码在 root layout：

```tsx
href={`${appUrl}${loc === 'en' ? '' : `/${loc}`}`}
```

它写在 `src/app/layout.tsx`，天然不知道当前 pathname，所以只能输出语言首页：

```html
<link rel="alternate" hreflang="en" href="https://bananapro.org" />
<link rel="alternate" hreflang="zh" href="https://bananapro.org/zh" />
```

访问 `/pricing`、`/blog/some-post`、`/privacy-policy` 时，这些 alternate 都会错指首页。

所以首轮修复原则是：

- root layout 不生成 page-specific alternate
- 页面 metadata 才生成当前页面的 hreflang
- 默认语言判断继续统一使用 `defaultLocale`
- 缺少 hreflang 可以接受，错误 hreflang 优先消除

---

## 保守版改动范围

### 必改文件

```txt
src/app/layout.tsx
src/shared/lib/seo.ts
```

### 首轮建议补丁文件

```txt
src/app/[locale]/(landing)/[...slug]/page.tsx
src/app/[locale]/(landing)/blog/category/[slug]/page.tsx
```

### 首轮暂缓

```txt
src/app/[locale]/(landing)/blog/[slug]/page.tsx
src/app/[locale]/(auth)/*
src/app/[locale]/(docs)/*
```

原因：

- `blog/[slug]` 需要先确认中英文文章 slug 是否始终一致、每种语言版本是否真实存在
- auth 页面通常不是 SEO 重点，首轮不值得扩大范围
- docs 是否需要收录要先确认产品策略
- 这些范围不影响当前主要问题的收益

---

## 具体方案

### 1. 删除 root layout 的错误 alternate

文件：

```txt
src/app/layout.tsx
```

删除：

```tsx
{/* inject locales */}
{locales ? (
  <>
    {locales.map((loc) => (
      <link
        key={loc}
        rel="alternate"
        hrefLang={loc}
        href={`${appUrl}${loc === 'en' ? '' : `/${loc}`}`}
      />
    ))}
  </>
) : null}
```

同时删除不再使用的：

```ts
import { locales } from '@/config/locale';
```

如果 `appUrl` 变量删除 alternate 后没有其他用途，也一起删除。

这是收益最高、风险最低的一步：先停止输出错误的 `hreflang`。

---

### 2. 在 SEO helper 里小幅新增 languages

文件：

```txt
src/shared/lib/seo.ts
```

把 locale 配置 import 改为：

```ts
import { defaultLocale, locales } from '@/config/locale';
```

首轮不要替换掉 `getCanonicalUrl()`，也不要新增另一套并行 URL 拼接规则。
最保守做法是保留现有函数名，让 canonical 和 hreflang 都复用它。

建议把原来的私有函数改成可复用函数：

```ts
export async function getCanonicalUrl(canonicalUrl: string, locale: string) {
  if (!canonicalUrl) {
    canonicalUrl = '/';
  }

  if (canonicalUrl.startsWith('http')) {
    return canonicalUrl;
  }

  if (!canonicalUrl.startsWith('/')) {
    canonicalUrl = `/${canonicalUrl}`;
  }

  canonicalUrl = `${envConfigs.app_url}${
    !locale || locale === defaultLocale ? '' : `/${locale}`
  }${canonicalUrl}`;

  if (locale !== defaultLocale && canonicalUrl.endsWith('/')) {
    canonicalUrl = canonicalUrl.slice(0, -1);
  }

  return canonicalUrl;
}
```

再新增一个 languages helper，内部只调用 `getCanonicalUrl()`：

```ts
export async function buildLanguageAlternates(canonicalUrl: string) {
  const languages = Object.fromEntries(
    await Promise.all(
      locales.map(async (locale) => [
        locale,
        await getCanonicalUrl(canonicalUrl, locale),
      ])
    )
  );

  return {
    ...languages,
    'x-default': await getCanonicalUrl(canonicalUrl, defaultLocale),
  };
}
```

这样只维护一套 URL 规则，不引入 `normalizeCanonicalPath()`、`buildCanonicalUrl()` 等额外抽象。后续如果确实要规范尾斜杠，再单独做一个小 PR。

---

### 3. 保留 canonical fallback，只给 languages 加条件

`src/app/[locale]/layout.tsx` 当前有：

```ts
export const generateMetadata = getMetadata();
```

当前 `getMetadata()` 在没有传 `canonicalUrl` 时，会 fallback 到 `/`，也就是仍然输出首页 canonical。

为了最小行为变化，首轮不要把 `alternates` 整体设成 `undefined`。正确收敛点是：

- `canonical` 保持现有 fallback 行为
- `languages` 只在明确传了 `canonicalUrl` 时输出
- layout 默认 metadata 不输出首页级 languages，避免污染子页面

在 `getMetadata()` 内部增加判断：

```ts
const hasExplicitCanonicalUrl = Boolean(options.canonicalUrl);
const canonicalPath = options.canonicalUrl || '';
const canonicalUrl = await getCanonicalUrl(canonicalPath, locale || '');
```

返回 metadata 时改成：

```ts
alternates: {
  canonical: canonicalUrl,
  ...(hasExplicitCanonicalUrl
    ? { languages: await buildLanguageAlternates(canonicalPath) }
    : {}),
},
```

这样：

- `getMetadata({ canonicalUrl: '/pricing' })` 会输出正确 canonical + hreflang
- `getMetadata()` 作为 layout 默认 metadata 时保留原来的 canonical fallback
- `getMetadata()` 没有显式 `canonicalUrl` 时不输出 `languages`
- 首页不受影响，因为首页已经显式传了 `canonicalUrl: '/'`

不要在这一轮改 `openGraph.url`、Twitter、robots 等字段，避免无关行为变化。

---

## 自动受益页面

这些页面已经走 `getMetadata({ canonicalUrl })`，改完 helper 后自动修复：

```txt
src/app/[locale]/(landing)/page.tsx
src/app/[locale]/(landing)/pricing/page.tsx
src/app/[locale]/(landing)/blog/page.tsx
src/app/[locale]/(landing)/updates/page.tsx
src/app/[locale]/(landing)/showcases/page.tsx
src/app/[locale]/(landing)/create/page.tsx
src/app/[locale]/(landing)/hairstyles/page.tsx
src/app/[locale]/(landing)/(ai)/ai-image-generator/page.tsx
src/app/[locale]/(landing)/(ai)/ai-video-generator/page.tsx
src/app/[locale]/(landing)/(ai)/ai-music-generator/page.tsx
```

这就是“最小入侵、最大收益”的主要来源：一处 helper 覆盖大部分营销页。

---

## 手写 metadata 页面补丁

### 1. catch-all 静态页和动态页

文件：

```txt
src/app/[locale]/(landing)/[...slug]/page.tsx
```

新增 import：

```ts
import { buildLanguageAlternates, getCanonicalUrl } from '@/shared/lib/seo';
```

在算出 `staticPageSlug` 后，把原来的手写 `canonicalUrl = ...` 替换为：

```ts
const pagePath = `/${staticPageSlug}`;
canonicalUrl = await getCanonicalUrl(pagePath, locale);
const languages = await buildLanguageAlternates(pagePath);
```

所有返回 metadata 的地方补：

```ts
alternates: {
  canonical: canonicalUrl,
  languages,
},
```

这个文件通常覆盖 `/privacy-policy`、`/terms-of-service` 等容易被工具抓到的页面，且当前内容有同 slug 的中英文文件，优先级高。

---

### 2. blog 分类页

文件：

```txt
src/app/[locale]/(landing)/blog/category/[slug]/page.tsx
```

新增：

```ts
import { buildLanguageAlternates, getCanonicalUrl } from '@/shared/lib/seo';
```

在 `generateMetadata()` 里先算统一路径：

```ts
const pagePath = `/blog/category/${slug}`;
const canonicalUrl = await getCanonicalUrl(pagePath, locale);
const languages = await buildLanguageAlternates(pagePath);
```

再把 `alternates` 改成：

```ts
alternates: {
  canonical: canonicalUrl,
  languages,
},
```

分类 slug 通常是稳定枚举，首轮可以按 same-slug 处理。

---

### 3. blog 详情页暂缓

文件：

```txt
src/app/[locale]/(landing)/blog/[slug]/page.tsx
```

首轮不建议给这个页面直接补 `languages`。

原因：

- 数据库文章没有 locale 字段，当前 `getPost({ slug, locale })` 可能用同一个 slug 返回数据库文章
- 本地 MDX 当前看起来有同 slug 的中英文文件，但不能代表后续所有文章都满足
- 如果输出了不存在或不对应的 `/zh/blog/some-post`，错误 hreflang 比缺失 hreflang 更糟

保守处理：

- 先保留现有 canonical
- 不从 root layout 继承错误首页级 alternate
- 等确认文章跨语言 slug 策略后，再给 `blog/[slug]` 补 languages

---

## 不做的事

首轮不要做这些：

- 不改 middleware
- 不通过 request header 猜 pathname
- 不把所有页面 metadata 重写一遍
- 不改 sitemap
- 不改 Open Graph / Twitter 行为
- 不给 auth/docs 顺手加 SEO 规则
- 不引入复杂的 slug 映射表
- 不为尾斜杠或 `envConfigs.app_url` 另起一轮 URL 规范化重构

这些都不是解决当前错误的必要条件。

---

## 验收标准

### `/pricing`

应该接近：

```html
<link rel="canonical" href="https://bananapro.org/pricing" />
<link rel="alternate" hreflang="en" href="https://bananapro.org/pricing" />
<link rel="alternate" hreflang="zh" href="https://bananapro.org/zh/pricing" />
<link rel="alternate" hreflang="x-default" href="https://bananapro.org/pricing" />
```

### `/zh/pricing`

应该接近：

```html
<link rel="canonical" href="https://bananapro.org/zh/pricing" />
<link rel="alternate" hreflang="en" href="https://bananapro.org/pricing" />
<link rel="alternate" hreflang="zh" href="https://bananapro.org/zh/pricing" />
<link rel="alternate" hreflang="x-default" href="https://bananapro.org/pricing" />
```

### `/privacy-policy`

应该接近：

```html
<link rel="canonical" href="https://bananapro.org/privacy-policy" />
<link rel="alternate" hreflang="en" href="https://bananapro.org/privacy-policy" />
<link rel="alternate" hreflang="zh" href="https://bananapro.org/zh/privacy-policy" />
<link rel="alternate" hreflang="x-default" href="https://bananapro.org/privacy-policy" />
```

页面里不应该再出现这种首页级 alternate：

```html
<link rel="alternate" hreflang="en" href="https://bananapro.org" />
<link rel="alternate" hreflang="zh" href="https://bananapro.org/zh" />
```

`/blog/some-post` 首轮只要求不再出现首页级错误 alternate；是否输出文章级 languages 等下一轮确认 slug 策略。

---

## 本地验证命令

```bash
pnpm build
```

启动后抽样：

```powershell
(Invoke-WebRequest http://localhost:3000/pricing).Content |
  Select-String 'canonical|alternate|hreflang'

(Invoke-WebRequest http://localhost:3000/zh/pricing).Content |
  Select-String 'canonical|alternate|hreflang'

(Invoke-WebRequest http://localhost:3000/privacy-policy).Content |
  Select-String 'canonical|alternate|hreflang'
```

---

## 最终判断

这个收敛版更符合“最小入侵、最大收益”：

- 改动小：核心只动 2 个公共文件，外加 2 个高确定性手写 metadata 页面
- 收益大：覆盖首页、pricing、blog 列表、AI 工具页、法律页等主要 SEO 页面
- 风险低：不碰路由、不碰渲染、不碰业务逻辑，不盲目处理文章 slug 映射
- 可维护：以后新营销页只要使用 `getMetadata({ canonicalUrl })`，就自动带正确 hreflang

首轮目标不是把全站所有 metadata 一次性重构干净，而是先把“错误 hreflang”从线上移除，并让主要页面走统一、可维护的生成方式。
