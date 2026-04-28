# hreflang 修复方案

> 复审结论：原方向正确，但首版范围要收敛。  
> 最稳做法是先消除“错误 alternate”，再给核心 SEO 页面补正确 alternate，不在第一轮处理 auth/docs/slug 映射等低确定性范围。

---

## 一句话结论

采用保守版修复：

1. 删除 `src/app/layout.tsx` 里的全站手写 `hreflang`
2. 扩展 `src/shared/lib/seo.ts`，把 canonical URL 和 hreflang URL 统一到同一个 URL builder
3. 只补齐当前最容易被 SEO 工具提示的手写 metadata 页面：`blog/[slug]`、`blog/category/[slug]`、`[...slug]`

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

所以修复原则很简单：

- root layout 不生成 page-specific alternate
- 页面 metadata 才生成当前页面的 hreflang
- 默认语言判断统一使用 `defaultLocale`，不写死 `en`

---

## 保守版改动范围

### 必改文件

```txt
src/app/layout.tsx
src/shared/lib/seo.ts
```

### 建议首轮补丁文件

```txt
src/app/[locale]/(landing)/blog/[slug]/page.tsx
src/app/[locale]/(landing)/blog/category/[slug]/page.tsx
src/app/[locale]/(landing)/[...slug]/page.tsx
```

### 暂不处理

```txt
src/app/[locale]/(auth)/*
src/app/[locale]/(docs)/*
```

原因：

- auth 页面通常不是 SEO 重点，首轮不值得扩大范围
- docs 是否需要收录要先确认产品策略
- 这两个范围不影响当前主要问题的收益

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

### 2. 在 SEO helper 里统一 URL 生成逻辑

文件：

```txt
src/shared/lib/seo.ts
```

把 locale 配置 import 改为：

```ts
import { defaultLocale, locales } from '@/config/locale';
```

不要新增一套和 `getCanonicalUrl()` 平行的 `buildLocalizedUrl()`。

现有 `getCanonicalUrl()` 已经负责：

- 拼接 `envConfigs.app_url`
- 给非默认语言加 `/${locale}`
- 处理 `/` 结尾

所以应该把它改造成一个通用、同步、可复用的 URL builder，让 canonical 和 hreflang 都调用同一套逻辑。

建议改成：

```ts
function normalizeCanonicalPath(path: string) {
  const normalized = path ? (path.startsWith('/') ? path : `/${path}`) : '/';
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

export function buildCanonicalUrl(path: string, locale: string) {
  if (path.startsWith('http')) {
    return path;
  }

  const appUrl = envConfigs.app_url.replace(/\/+$/, '');
  const pagePath = normalizeCanonicalPath(path);
  const localePrefix = !locale || locale === defaultLocale ? '' : `/${locale}`;

  return `${appUrl}${localePrefix}${pagePath === '/' ? '' : pagePath}`;
}

export function buildLanguageAlternates(path: string) {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, buildCanonicalUrl(path, locale)])
  );

  return {
    ...languages,
    'x-default': buildCanonicalUrl(path, defaultLocale),
  };
}
```

然后删除或替换原来的 `getCanonicalUrl()`，不要保留两套 URL 拼接函数。

如果想进一步减少 diff，也可以保留函数名 `getCanonicalUrl`，但内部必须成为唯一 URL builder，`buildLanguageAlternates()` 也要调用它。重点不是函数名，而是只能有一套规则。

---

### 3. 保留 canonical fallback，只给 languages 加条件

`src/app/[locale]/layout.tsx` 当前有：

```ts
export const generateMetadata = getMetadata();
```

当前 `getMetadata()` 在没有传 `canonicalUrl` 时，会通过 `getCanonicalUrl('')` fallback 到 `/`，也就是仍然输出首页 canonical。

为了最小行为变化，首轮不要把 `alternates` 整体设成 `undefined`。否则会改变 locale layout 之前已有的 canonical 输出。

正确收敛点是：

- `canonical` 保持现有 fallback 行为
- `languages` 只在明确传了 `canonicalUrl` 时输出
- 这样 layout 可以继续有 canonical，但不会再输出首页级 hreflang 污染子页面

在 `getMetadata()` 内部增加判断：

```ts
const hasExplicitCanonicalUrl = Boolean(options.canonicalUrl);
const canonicalPath = options.canonicalUrl || '/';

const canonicalUrl = buildCanonicalUrl(
  canonicalPath,
  locale || ''
);
```

返回 metadata 时改成：

```ts
alternates: {
  canonical: canonicalUrl,
  ...(hasExplicitCanonicalUrl
    ? { languages: buildLanguageAlternates(canonicalPath) }
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
import { buildCanonicalUrl, buildLanguageAlternates } from '@/shared/lib/seo';
```

在算出 `staticPageSlug` 后，把原来的手写 `canonicalUrl = ...` 替换为：

```ts
const pagePath = `/${staticPageSlug}`;
canonicalUrl = buildCanonicalUrl(pagePath, locale);
```

所有返回 metadata 的地方补：

```ts
alternates: {
  canonical: canonicalUrl,
  languages: buildLanguageAlternates(pagePath),
},
```

这个文件通常覆盖 `/privacy-policy`、`/terms-of-service` 等容易被工具抓到的页面，优先级高。

---

### 2. blog 分类页

文件：

```txt
src/app/[locale]/(landing)/blog/category/[slug]/page.tsx
```

新增：

```ts
import { buildCanonicalUrl, buildLanguageAlternates } from '@/shared/lib/seo';
```

在 `generateMetadata()` 里先算统一路径：

```ts
const pagePath = `/blog/category/${slug}`;
const canonicalUrl = buildCanonicalUrl(pagePath, locale);
```

再把 `alternates` 改成：

```ts
alternates: {
  canonical: canonicalUrl,
  languages: buildLanguageAlternates(pagePath),
},
```

分类 slug 通常是稳定枚举，首轮可以按 same-slug 处理。

---

### 3. blog 详情页

文件：

```txt
src/app/[locale]/(landing)/blog/[slug]/page.tsx
```

这里要比普通页面保守一点。

如果可以确认中英文文章 slug 相同，并且每个语言版本都真实存在，可以直接补：

```ts
import { buildCanonicalUrl, buildLanguageAlternates } from '@/shared/lib/seo';

// ...

const pagePath = `/blog/${slug}`;
const canonicalUrl = buildCanonicalUrl(pagePath, locale);

alternates: {
  canonical: canonicalUrl,
  languages: buildLanguageAlternates(pagePath),
},
```

如果不能确认，不要盲目输出所有语言 alternate。错误 hreflang 比缺失 hreflang 更糟。

保守处理方式是：

- 首轮只删除 root layout 的错误 alternate
- blog 详情页先保留 canonical
- 等确认文章跨语言 slug 策略后，再补 `languages`

这比为了追求“全量修复”而输出不存在的 `/zh/blog/some-post` 更稳。

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

这个保守版比原方案更优：

- 改动小：核心只动 2 个公共文件，外加 2 到 3 个手写 metadata 页面
- 收益大：覆盖首页、pricing、blog 列表、AI 工具页、法律页等主要 SEO 页面
- 风险低：不碰路由、不碰渲染、不碰业务逻辑
- 可维护：以后新营销页只要使用 `getMetadata({ canonicalUrl })`，就自动带正确 hreflang

首轮目标不是把全站所有 metadata 一次性重构干净，而是先把“错误 hreflang”从线上移除，并让主要页面走统一、可维护的生成方式。
