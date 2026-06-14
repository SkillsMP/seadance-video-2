# DuctTapeAI 首页生成器与左侧侧边栏改造方案

> 目标项目：`D:\project3\shipany-2\bananapro-org`  
> 参考站点：<https://ducttapeai.com/>、<https://ducttapeai.com/text-to-image>  
> 本地参考项目：`D:\project3\shipany-2\videofly-template-main`  
> 调研日期：2026-06-09  
> 目标：学习 DuctTapeAI 首页生成器框和工具页左侧侧边栏的产品形态，结合 VideoFly 现成思路，把当前项目的图片生成入口改造成更像“轻量创作工作台”的体验。要求低入侵、高收益、高内聚、低耦合，不影响已有生成、积分、上传、轮询、下载和 promptKey 链路。

## 1. 结论

最优平衡点不是重写生成器，而是给现有 `ImageGenerator` 增加两种更好的展示形态：

```text
首页：Compact Prompt Box
  用更轻的输入框、模式胶囊、模型胶囊、设置弹层、prompt suggestions 承担首屏转化。

/create：Tool Workbench
  用左侧工具导航 + 左侧生成面板 + 右侧预览/结果区，承担真正创作流程。
```

底层仍复用当前项目已经跑通的能力：

```text
MODELS / controls / calculateModelCredits
/api/ai/providers
/api/ai/generate
/api/ai/query
/api/prompts/by-title
ImageUploader
fetchUserCredits
task polling
download image
AUTO_SAVE_SHOWCASE
```

不建议直接照搬 DuctTapeAI 或 VideoFly 的组件代码。VideoFly 的组件形态值得学，但它的首页生成器和工具页也有较大的本地业务耦合；当前项目更适合“借鉴布局和交互，保留自己的生成链路”。

## 2. 参考页观察

### DuctTapeAI 首页

公开抓取能确认的结构：

1. 首屏导航包含 Image Generator、AI Video Generator、Prompts、Pricing、Blog。
2. Hero 文案后直接出现 `AI Image Generator`。
3. 生成器核心露出很轻：`AI Image`、`Generate`、计数/积分、prompt suggestion chips，例如 Cyberpunk City、Ocean Sunset、Space Journey、Cherry Blossoms。
4. 多语言首页公开文本还能看到更完整的控件：文本生成 / 图片生成模式、模型选择、Prompt、Aspect Ratio、Quality、Credits、Image Preview。

值得学习的是：

- 首页生成器不是后台表单，而是一个“低心理成本的 prompt box”。
- 复杂设置不抢首屏，先让用户输入和点击。
- suggestion chips 直接降低空白输入成本。
- 生成器和图库、定价、FAQ 在同一首页闭环里，转化路径短。

### DuctTapeAI `/text-to-image`

`https://ducttapeai.com/text-to-image` 在本次抓取中没有返回可验证正文；因此本方案不假设它的具体 DOM、类名或完整布局。

但用户明确提到它的左侧侧边栏形态，结合 DuctTapeAI 的产品结构和 VideoFly 本地实现，可以抽象为：

```text
左侧：工具导航 / 模式入口 / 用户资产入口
中间：当前工具的生成设置
右侧：预览、结果、历史或空状态
```

这里应该学习“工作台信息架构”，不要复制不可验证的页面细节。

### VideoFly 本地项目

VideoFly 里有三块很有参考价值：

```text
src/components/landing/hero-section.tsx
src/components/video-generator/video-generator-input.tsx
src/components/layout/sidebar.tsx
src/components/tool/tool-page-layout.tsx
src/components/tool/generator-panel.tsx
```

可学习点：

1. 首页生成器采用 `VideoGeneratorInput`：大输入框 + 顶部胶囊选择器 + 设置 Popover + suggestion chips + 右侧圆形提交按钮。
2. 工具页侧边栏由配置 `sidebarNavigation` 驱动，桌面固定左侧，移动端用 Sheet。
3. 工具页布局有清晰的生成区和结果区，移动端用 `generator/result` tab 切换。
4. `GeneratorPanel` 把工具页表单做成固定宽度面板，底部固定积分和生成按钮。

不建议照搬点：

1. `VideoGeneratorInput` 自身也很大，和当前 `ImageGenerator` 的胖组件问题类似。
2. VideoFly 是视频站，包含视频任务、本地历史、通知、乐观冻结积分等逻辑，不能直接迁移到图片生成器。
3. Pollo.ai 风格的深色面板不一定适合 Banana Pro 当前主题，应该使用现有 shadcn token 和项目色彩。

## 3. 当前项目现状

核心文件：

```text
src/shared/blocks/generator/image.tsx
src/shared/blocks/generator/generation-controls.ts
src/config/ai/models.ts
src/config/ai/options.ts
src/config/ai/credit-costs.ts
src/app/[locale]/(landing)/page.tsx
src/app/[locale]/(landing)/create/page.tsx
src/app/[locale]/(landing)/(ai)/ai-image-generator/page.tsx
src/themes/default/pages/dynamic-page.tsx
src/shared/components/ui/sidebar.tsx
```

关键现状：

1. 首页、`/create`、`/ai-image-generator` 都复用 `ImageGenerator`。
2. `ImageGenerator` 当前同时负责状态、API、轮询、积分、上传、下载、自动保存和 UI。
3. `generation-controls.ts` 已经把模型 controls 抽象出来，适合继续复用。
4. `models.ts` 已经具备 image family、scene、controls、pricing 信息，不需要另建一套前端配置。
5. 动态页面支持 `section.component`，首页注入生成器很干净。
6. 项目已有 shadcn `ui/sidebar.tsx`，但更偏 dashboard 壳；图片工具页不宜直接套后台 sidebar。

当前最大问题：

```text
ImageGenerator 业务逻辑和展示布局耦合在一个大文件里。
```

如果为了模仿 DuctTapeAI 和 VideoFly 再复制一个新生成器，会出现两套生成逻辑、两套积分判断、两套轮询和下载，后续很容易漂移。

所以正确方向是：

```text
业务状态只保留一套，UI 外观允许多套。
```

## 4. 改造原则

### 必须坚持

1. 不改 `/api/ai/generate` 请求契约。
2. 不改模型注册表结构。
3. 不改积分计算规则。
4. 不改任务轮询和结果解析语义。
5. 不改 `promptKey -> /api/prompts/by-title -> ImageGenerator` 现有链路。
6. 不引入新的全局状态库。
7. 不把 VideoFly 的视频任务、通知、历史存储整套搬进来。
8. 不为了 UI 一次性重构后台、支付、数据库或 prompt 表。

### 可以改

1. 给 `ImageGenerator` 增加 `variant` / `layout` 类型。
2. 把生成器 UI 拆成少量局部组件。
3. 把生成器业务状态抽成一个局部 hook，供多个 view 复用。
4. 新增轻量工具侧栏配置。
5. `/create` 页面改成更工作台化的布局。
6. 首页生成器改成更 compact 的外观。

### 明确不做

```text
不做模型/价格重构
不新增数据库字段
不重写 AI API
不新增复杂 history 系统
不改后台 admin
不让首页承担完整工具页所有设置
不复制对方品牌、文案、素材或徽章
```

## 5. 推荐信息架构

### 首页

首页继续通过 `pages.index.page.sections.generator` 注入生成器，但使用 compact variant：

```tsx
<ImageGenerator
  variant="home"
  srOnlyTitle={t.raw('generator.title')}
/>
```

首页生成器目标：

- 快速输入 prompt。
- 切换 text-to-image / image-to-image。
- 选择模型。
- 展示少量关键设置。
- 显示积分消耗。
- 提供 suggestion chips。
- 点击生成后可以显示 preview/result，但不要像完整工具页一样厚重。

推荐视觉结构：

```text
┌────────────────────────────────────────────────────────┐
│ AI Image  [Text to Image] [Image to Image] [Model v]   │
│                                                        │
│ Prompt textarea                                       │
│                                                        │
│ [+ Reference] [1:1] [2K] [jpg]      Cost 20  [Generate]│
└────────────────────────────────────────────────────────┘

[Cyberpunk City] [Product Poster] [LinkedIn Headshot] [Logo Mockup]
```

### `/create`

`/create` 建议作为真正的图片创作工作台，而不是继续用“features + 两张 Card”的普通落地页。

推荐结构：

```text
Header 保持现有全站 header

┌──────────────┬──────────────────────┬──────────────────────────┐
│ Tool Sidebar │ Generator Panel      │ Preview / Result Panel   │
│              │                      │                          │
│ Text to Image│ Model                │ Empty preview             │
│ Image to Img │ Prompt               │ Generated image grid      │
│ AI Video     │ Reference upload     │ Progress / status         │
│ Prompts      │ Aspect/Resolution    │ Download actions          │
│ Tasks        │ Credits + Generate   │                          │
└──────────────┴──────────────────────┴──────────────────────────┘
```

移动端：

```text
[Generator] [Result] tabs
侧边栏进 Sheet
```

### `/ai-image-generator`

保持 SEO/营销页属性，可以先继续渲染普通 dynamic page。

若第二阶段要统一体验，可以把它的 generator section 也改成：

```tsx
<ImageGenerator variant="marketing" />
```

但不建议第一阶段同时动首页、`/create`、`/ai-image-generator` 三处外观，避免影响面过大。

## 6. 组件架构建议

### 最小但健康的拆法

建议把当前 `ImageGenerator` 拆成“一套 controller + 两三个 view”，但不要拆成十几个小文件。

推荐新增或调整：

```text
src/shared/blocks/generator/image.tsx
  对外 facade，保留 ImageGenerator 导出，避免改所有 import。

src/shared/blocks/generator/use-image-generator.tsx
  只承载当前 image.tsx 里的状态、派生值、effects、actions。

src/shared/blocks/generator/image-generator-home.tsx
  首页 compact prompt box。

src/shared/blocks/generator/image-generator-workbench.tsx
  /create 工作台布局。

src/shared/blocks/generator/image-generator-panels.tsx
  共享的 FormPanel / ResultPanel，小体量即可。

src/shared/blocks/generator/image-tool-sidebar.tsx
  轻量侧边栏，只服务图片工具页。
```

如果担心第一步抽 hook 风险过高，可以退一步：

```text
第一轮只在 image.tsx 内部拆 renderHomeView / renderClassicView。
第二轮再把 controller 抽出来。
```

但长期看，只要要同时维护首页 compact 和工具页 workbench，抽 `useImageGenerator` 是更优雅的平衡点，因为它能防止生成逻辑复制。

### `ImageGenerator` 对外 API

建议只加少量 props：

```ts
type ImageGeneratorVariant = 'classic' | 'home' | 'workbench';

interface ImageGeneratorProps {
  variant?: ImageGeneratorVariant;
  allowMultipleImages?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
  srOnlyTitle?: string;
  className?: string;
  promptKey?: string;
  initialMode?: 'text-to-image' | 'image-to-image';
}
```

默认保持：

```ts
variant = 'classic'
```

这样现有调用如果不改，行为保持原样。

### Controller 返回结构

`useImageGenerator` 不要变成万能全局服务，只服务这个生成器：

```ts
return {
  state: {
    activeTab,
    prompt,
    referenceImageItems,
    generatedImages,
    isGenerating,
    progress,
    taskStatus,
    selectedFamily,
    selectedControlValues,
    previewImage,
  },
  derived: {
    availableFamilyOptions,
    selectedControlEntries,
    costCredits,
    remainingCredits,
    canGenerate,
    promptLength,
    isPromptTooLong,
    isTextToImageMode,
    modelAvailabilityMessage,
  },
  actions: {
    setActiveTab,
    setPrompt,
    setSelectedFamily,
    handleControlChange,
    handleReferenceImagesChange,
    handleGenerate,
    handleDownloadImage,
    setIsShowSignModal,
  },
  refsOrFlags: {
    isMounted,
    isCheckSign,
    user,
    isLoadingCredits,
    isLoadingProviders,
    isReferenceUploading,
    hasReferenceUploadError,
  },
};
```

注意：不要把 `/api/ai/generate`、`fetchUserCredits`、`pollTaskStatus` 抽到跨模块服务里。那会扩大边界，收益不大。

## 7. 首页生成器设计细节

### 保留业务能力

首页 compact 不是假表单，仍然调用现有生成链路：

- 未登录：打开登录弹窗。
- 积分不足：显示购买入口。
- provider 未配置：显示现有 modelAvailabilityMessage。
- image-to-image：要求上传 reference image。
- promptKey：继续能预填 prompt 和 preview image。

### 收敛首屏控件

首页只展示最高频控件：

```text
mode
model
prompt
reference image entry
aspect_ratio
resolution
output_format
credits
generate
suggestions
```

其他复杂提示、长说明、结果详情可以放到 `/create`。

### 控件呈现方式

建议学习 VideoFly 的胶囊和 Popover：

- `mode`：segmented/tabs。
- `model`：dropdown capsule。
- `aspect_ratio / resolution / output_format`：一个 Settings Popover。
- `generate`：右侧主按钮，桌面可以是 icon+text，移动端全宽。
- `suggestions`：chips，点击填入 prompt。

这样比当前两张 Card 更轻，也更接近 DuctTapeAI 首页。

## 8. 左侧侧边栏设计

### 不复用 dashboard sidebar

当前 `src/shared/components/ui/sidebar.tsx` 是 shadcn 通用能力，可以复用底层 Sheet/Dialog/样式思想，但不建议把 dashboard 的 `DashboardLayout` 和 `shared/blocks/dashboard/sidebar.tsx` 用到图片工具页。

原因：

1. dashboard sidebar 有用户、library、bottom_nav 等后台语义。
2. `/create` 是创作工具，不是后台。
3. 套后台壳会引入不必要的依赖和视觉重量。

### 新增轻量配置

建议新增：

```text
src/shared/blocks/generator/image-tool-sidebar.tsx
src/config/generator-tools.ts
```

配置示例：

```ts
export const imageToolNav = [
  { id: 'text-to-image', title: 'Text to Image', href: '/create?mode=text-to-image', icon: 'Type' },
  { id: 'image-to-image', title: 'Image to Image', href: '/create?mode=image-to-image', icon: 'ImagePlus' },
  { id: 'ai-video', title: 'AI Video', href: '/ai-video-generator', icon: 'Video' },
  { id: 'prompts', title: 'Prompts', href: '/prompts', icon: 'BookOpenText' },
  { id: 'tasks', title: 'AI Tasks', href: '/activity/ai-tasks', icon: 'ListChecks' },
  { id: 'credits', title: 'Credits', href: '/settings/credits', icon: 'Gem' },
];
```

V1 可以先不用 i18n 配置，直接在组件里用英文；如果要严谨，放入：

```text
src/config/locale/messages/en/ai/image.json
src/config/locale/messages/zh/ai/image.json
```

但为了少改 locale 文件，第一版可以只做英文导航，后续再补中文。

### `/create?mode=...`

建议给 `/create` 增加可选参数：

```text
/create?mode=text-to-image
/create?mode=image-to-image
```

实现方式：

```tsx
<ImageGenerator
  variant="workbench"
  promptKey={promptKey}
  initialMode={mode}
/>
```

这不会破坏现有 `/create?prompt=xxx`，只是新增更明确的模式入口。

## 9. 页面接入方案

### 首页

文件：

```text
src/app/[locale]/(landing)/page.tsx
```

改动：

```tsx
generator: {
  component: (
    <ImageGenerator
      variant="home"
      srOnlyTitle={t.raw('generator.title')}
    />
  ),
},
```

### `/create`

文件：

```text
src/app/[locale]/(landing)/create/page.tsx
```

建议去掉当前 create 页的 `features` 区块，只保留 workbench：

```tsx
const page: DynamicPage = {
  sections: {
    generator: {
      component: (
        <ImageGenerator
          variant="workbench"
          srOnlyTitle={t.raw('generator.title')}
          promptKey={promptKey}
          initialMode={mode}
        />
      ),
    },
  },
};
```

这是低风险的，因为 `/create` 本身就是工具页，不需要先展示 `custom-features`。

### `/ai-image-generator`

第一阶段不动。等首页和 `/create` 稳定后，再决定是否改成 `variant="classic"` 或 `variant="workbench"`。

## 10. 最小改动清单

### P0 必做

```text
src/shared/blocks/generator/image.tsx
src/shared/blocks/generator/use-image-generator.tsx
src/shared/blocks/generator/image-generator-home.tsx
src/shared/blocks/generator/image-generator-workbench.tsx
src/shared/blocks/generator/image-generator-panels.tsx
src/shared/blocks/generator/image-tool-sidebar.tsx
src/app/[locale]/(landing)/page.tsx
src/app/[locale]/(landing)/create/page.tsx
```

### P0 可选

```text
src/config/generator-tools.ts
src/config/locale/messages/en/pages/create.json
src/config/locale/messages/zh/pages/create.json
src/config/locale/messages/en/ai/image.json
src/config/locale/messages/zh/ai/image.json
```

### 暂不做

```text
src/app/api/ai/generate/route.ts
src/app/api/ai/query/route.ts
src/config/ai/models.ts
src/config/ai/credit-costs.ts
src/config/db/schema.*
src/shared/models/prompt.ts
src/shared/blocks/dashboard/*
src/app/[locale]/(landing)/(ai)/ai-image-generator/page.tsx
```

## 11. 实施顺序

### 第一步：先拆共享状态，不改 UI

目标：验证抽取 controller 后 classic UI 行为不变。

动作：

1. 从 `image.tsx` 抽出 `useImageGenerator`。
2. `ImageGenerator variant="classic"` 继续渲染现有两列 Card。
3. 首页、`/create`、`/ai-image-generator` 暂时不改 variant。

验收：

1. 文生图和图生图正常。
2. provider 加载正常。
3. promptKey 正常。
4. 积分显示和积分不足判断正常。
5. 生成、轮询、下载正常。

### 第二步：首页切 compact

目标：只改首页外观，不碰 `/create`。

动作：

1. 新增 `ImageGeneratorHome`。
2. 首页 `page.tsx` 改为 `variant="home"`。
3. 增加 suggestion chips，先用本地常量，不接数据库。

验收：

1. 首页首屏更轻。
2. suggestion 点击能填 prompt。
3. 设置 Popover 能正确改变 `selectedControlValues`。
4. 生成结果仍来自同一 controller。

### 第三步：`/create` 切 workbench

目标：引入左侧侧边栏和结果区。

动作：

1. 新增 `ImageToolSidebar`。
2. 新增 `ImageGeneratorWorkbench`。
3. `/create` 传 `variant="workbench"`。
4. 支持 `mode` searchParam。
5. 移动端增加 `Generator / Result` tab。

验收：

1. `/create` 仍支持 `?prompt=xxx`。
2. `/create?mode=text-to-image` 默认文生图。
3. `/create?mode=image-to-image` 默认图生图。
4. 左侧导航 active 状态正确。
5. 移动端不横向溢出。

### 第四步：再考虑 `/ai-image-generator`

目标：只在前两步稳定后做。

可选方向：

1. 保持营销页 classic，不动。
2. 改成 `variant="home"`，让营销页更轻。
3. 改成 `variant="workbench"`，让它成为另一个工具页。

建议：短期不动，避免 SEO 页面结构变化过大。

## 12. 风险点与控制方式

### 风险 1：抽 hook 引入行为漂移

控制：

- 第一阶段抽完后不改 UI，先跑通 classic。
- 不改函数名语义，不改 API payload。
- 对 `handleGenerate`、`pollTaskStatus`、`saveShowcase` 保持原逻辑。

### 风险 2：首页 compact 缩掉必要校验

控制：

- `canGenerate` 只从 controller 派生，不在 view 里重写。
- view 只负责展示和调用 action。

### 风险 3：workbench 和现有 landing header/footer 冲突

控制：

- 不改 route group layout。
- workbench 用 section 内部布局。
- 顶部预留 `pt-20` 或沿用现有 section padding，避免被 fixed header 遮挡。

### 风险 4：左侧侧边栏变成新后台

控制：

- 侧栏只放工具入口，不放复杂用户系统。
- 不接 dashboard sidebar 的用户、library、footer 结构。

### 风险 5：移动端过重

控制：

- 侧边栏在移动端进 Sheet。
- generator/result 用 tabs。
- 结果图片 grid 使用固定 aspect/min-height，避免布局跳动。

## 13. 验收清单

### 功能

1. 首页 compact 生成器能完成一次 text-to-image。
2. 首页 compact 能切换 image-to-image 并上传参考图。
3. `/create` workbench 能完成一次 text-to-image。
4. `/create` workbench 能完成一次 image-to-image。
5. `/create?prompt=xxx` 仍能自动加载 prompt 和 preview。
6. 下载按钮正常。
7. 生成中 progress 和状态文案正常。
8. 积分不足、未登录、provider 未配置状态正常。

### UI

1. 首页生成器在桌面、平板、移动端不溢出。
2. prompt textarea、chips、按钮文本不重叠。
3. `/create` 左侧侧边栏在桌面固定，移动端 Sheet 正常。
4. workbench 右侧空状态和生成结果区不挤压左侧表单。
5. 暗色模式下边框、背景、按钮可读。

### 回归

1. `/ai-image-generator` 未改动或行为保持原样。
2. `/activity/ai-tasks` 不受影响。
3. `/pricing` 不受影响。
4. admin prompts/showcases 不受影响。
5. `pnpm lint` 或至少 TypeScript 检查通过。

## 14. 最终建议

这次不要把目标理解成“把 DuctTapeAI 和 VideoFly 的代码搬进来”。更好的工程方案是：

```text
保留 bananapro-org 的生成链路
抽出 ImageGenerator controller
新增首页 compact view
新增 /create workbench view
新增轻量 image tool sidebar
默认 classic 保持兼容
```

这样改动面小，但收益明显：

- 首页更像真实 AI 工具站，而不是普通表单区块。
- `/create` 更像可长期扩展的创作工作台。
- 生成逻辑仍只有一套，不会产生维护漂移。
- 后续要加 `/text-to-image`、`/image-to-image`、`/prompts`、`/models/nano-banana-pro` 都有清晰入口。

一句话路线：

```text
先换生成器外观和页面信息架构，不动底层生成链路；
先让首页转化更强、/create 更像工作台；
再逐步补工具矩阵和长尾页面。
```
