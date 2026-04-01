## 配置优先级
数据库配置 > 环境变量配置

配置读取逻辑在 src/shared/models/config.ts:

export async function getAllConfigs(): Promise<Configs> {
  // 1. 先读取环境变量
  const envConfigs = getEnvConfigs();
  
  // 2. 再读取数据库配置（会覆盖环境变量）
  const dbConfigs = await getConfigs();
  
  // 3. 合并配置
  return { ...envConfigs, ...dbConfigs };
}

## Showcases 组件的不同演进版本和应用场景。以下是它们的详细对比区别：

1. showcases.tsx (基础网格版)
这是最基础的展示组件，采用标准的卡片式设计。

布局风格：使用标准的 Grid 网格布局 (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)，每一项的大小是固定的。
展示方式：使用 Card 组件，图片下方有明确的标题和描述文本区域。
交互逻辑：
点击卡片通常会直接跳转到对应的 URL。
没有图片放大预览（灯箱）功能。
数据源：完全依赖 section.items 传入的静态数据。
适用场景：适合内容较为规整、文字说明较多、不需要花哨交互的传统案例展示。
2. showcases-flow.tsx (流式布局/瀑布流版)
这是在视觉和交互上进行增强的版本，更强调图片本身。

布局风格：采用 CSS Columns 瀑布流布局 (columns-1 sm:columns-2...)，类似 Pinterest 的样式，图片高度可以不一致。
展示方式：图片占据主体，标题和按钮（如 "Create Similar"）仅在鼠标悬停 (Hover) 时通过渐变遮罩层显示。
交互逻辑：
全屏灯箱 (Lightbox)：点击图片会打开一个全屏预览层，支持点击左右箭头切换上一张/下一张，支持键盘 Esc、左/右键快捷键。
提供了更现代的内联按钮交互（如直接调用 Prompt 生成相似图片）。
数据源：同样依赖传入的静态数据。
适用场景：适合 AI 生成素材展示、艺术画廊等以视觉图片为主、强调用户交互体验的场景。
3. showcases-flow-dynamic.tsx (动态流式布局版)
这是功能最强大的版本，基于 showcases-flow 的视觉风格，但增加了后端数据驱动的能力。

布局风格：与 showcases-flow.tsx 一致（瀑布流）。
展示方式：与 showcases-flow.tsx 基本一致。
核心区别：数据获取方式：
API 驱动：它内部封装了 useEffect 和 fetch，会自动请求 /api/showcases/latest 接口来获取数据。
支持参数过滤：可以通过 Props 传入 tags (标签)、searchTerm (搜索词)、excludeTags (排除标签) 等，实现按类目动态显示。
状态管理：内置了 loading (加载中) 和 error (错误) 状态的处理及 UI 显示。
交互增强：
除了继承灯箱功能外，它还支持配置是否显示描述 (showDescription)、是否隐藏创建按钮 (hideCreateButton) 等。
适用场景：适合需要实时更新、关键词搜索、分类筛选的作品库页面。
对比总结表
特性	showcases.tsx	showcases-flow.tsx	showcases-flow-dynamic.tsx
基础布局	标准网格 (Grid)	瀑布流 (Columns)	瀑布流 (Columns)
视觉风格	传统卡片 (Card)	悬停遮罩 (Modern)	悬停遮罩 (Modern)
全屏预览	❌ 无	✅ 有 (灯箱)	✅ 有 (灯箱)
数据源	静态 (Props)	静态 (Props)	动态 (API 接口)
主要功能	固定展示	交互式展示	动态过滤与库管理
主要依赖	Section Props	Framer Motion, Section Props	API, Framer Motion
建议选择：

如果是简单的官网模块，用 showcases.tsx。
如果是手工配置的精选作品集，用 showcases-flow.tsx。
如果是展示数据库中最新的、可搜索的作品库，用 showcases-flow-dynamic.tsx。

## "showcase":应该放在 index.json 还是放在 landing.json，哪个对

 根据目前的架构设计和代码使用情况，showcase 应该放在 pages\index.json 中。

核心原因：
职责划分 (Separation of Concerns)：

landing.json：主要用于存放全局布局组件的文案，例如 header（导航栏）和 footer（页脚）。这些内容在整个落地页站点的所有页面中通常是共享的。
pages\index.json：专门用于存放首页 (Index Page) 的具体业务区块内容。showcase 作为首页的一个展示模块，属于页面级内容。
代码消费逻辑 (Code Usage)：

在 src\app\[locale]\(landing)\page.tsx 第 16 行中，代码明确使用了 getTranslations('pages.index') 来加载数据：
typescript
const t = await getTranslations('pages.index');
在第 21 行的 showSections 数组中包含了 'showcase'。
这说明 LandingPage 组件预期从 pages.index 命名空间下读取该区块的内容。如果放在 landing.json 中，首页将无法直接通过该配置渲染出内容。
项目一致性：

观察 pages\index.json 可以看到 hero, introduce, benefits, usage 等首页主要区块都已经迁移到了这里。为了保持结构一致，showcase 也应该归类于此。

## 不用用动态数据库注入，改成pages/index.json
从旧 landing.json + hidden + DB 注入 迁到 pages/index.json

经过讨论，确认了首页显示不全以及存在数据库注入的问题根源及解决方案：

### 1. 现状分析
- **数据源**：`src/app/[locale]/(landing)/page.tsx` 目前使用的是 `getTranslations('landing')`。而 `landing.json` 中许多区块被设置了 `"hidden": true`，导致你的修改在 `pages/index.json` 中生效但页面没变化。
- **硬编码注入**：`page.tsx` 中对 `showcases-flow` 进行了特殊处理，强制从数据库拉取数据并注入 `ShowcasesFlowDynamic` 组件

### 2. 核心细节补充
- **`show_sections` 是过滤器而非排序器**：
区块的渲染顺序取决于 sections JSON 对象里 key 的顺序，show_sections 只负责"显/隐"过滤。你在 index.json 里的 show_sections 数组顺序不影响渲染顺序。这意味着你要控制顺序，需要在 sections 对象里按顺序写。
翻了 dynamic-page.tsx 的源码：
Object.keys(page.sections).map(async (sectionKey) => {
  if (page.show_sections && !page.show_sections.includes(sectionKey)) {
    return null;  // 只是过滤，不重新排序
  }
- **结构匹配**：`pages/index.json` 的 `"page"` 对象结构与 `DynamicPage` 类型完美契合，可以直接通过 `t.raw('page')` 获取并传递。

### 3. 改造方案建议
你可以按照以下步骤对 `page.tsx` 进行“瘦身”：

1. **更改数据源**：
   ```typescript
   const t = await getTranslations('pages.index');
   const page: DynamicPage = t.raw('page');
   ```
2. **删除冗余逻辑**：
   - 删掉 `getLatestShowcases` 的数据库调用。
   - 删掉手动构建 `showSections` 数组的逻辑。
   - 删掉对 `showcases-flow` 的 `if` 拦截动态注入逻辑。
3. **性能优化**：
   - 删掉 `export const dynamic = 'force-dynamic'`。
   - 删掉 `export const revalidate = 0`。
   - 这样首页将从动态渲染转为**静态生成**，加载速度极快。
4. **保留案例区（可选）**：
   - 如果还想显示案例，只需将静态的 items 数据手工写入 `pages/index.json` 的 `sections["showcases-flow"]` 对象中。

---
**总结**：直接让 `page.tsx` 变成一个纯粹的“配置加载器”，将所有控制权（显示哪些、顺序如何、文案内容）交还给 `pages/index.json`。

```typescript
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getThemePage } from '@/core/theme';
import { DynamicPage } from '@/shared/types/blocks/landing';

// 如果不再依赖数据库，你可以删掉这两行，让 Next.js 将首页编译为更快的纯静态页面！
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 1. 将数据源改为你想要的 pages/index.json
  const t = await getTranslations('pages.index');
  // 按照你的 index.json 结构，直接提取外层的 "page" 对象
  const page: DynamicPage = t.raw('page');

  // 2. 加载页面组件
  const Page = await getThemePage('dynamic-page');

  // 3. 直接渲染，完全由你 index.json 下的 show_sections 和 sections 决定
  return <Page locale={locale} page={page} />;
}
```

