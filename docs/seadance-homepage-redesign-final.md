# Seadance.video 首页短平快改版方案（Final）

> 目标：优先解决 **首页平均停留约 4 秒、跳出率约 80%** 的问题。
> 原则：**不重构 ShipAny 业务底座，不碰支付 / 登录 / 积分 / Provider，只重做首页前 2～3 屏。**

---

## 1. 核心判断

当前首页最大问题不是单纯“丑”，而是：

> **用户第一眼看到的是 Seedance 2.5 资讯与“暂不可用”，而不是一个现在就能生成视频的工具。**

这会让从搜索引擎进入的用户在 3～4 秒内产生错误判断：

- 这是资讯站，不是工具站
- Seedance 2.5 不能用
- 网站可能只是蹭热点
- 没有马上看到真实生成效果
- 没必要继续看

因此第一优先级不是换配色，而是：

**价值主张 → 真实结果 → 立即操作**

---

# 2. 当前首页的 4 个主要问题

## P0-1｜Hero 在“劝退”

当前首页围绕 Seedance 2.5 展开：

- `Seedance 2.5 announced`
- `enterprise preview`
- `Coming soon`
- `Seedance 2.5 is not yet available`
- `Read Seedance 2.5 FAQ`

这套信息虽然事实更谨慎，但不适合作为产品首页第一屏。

### 修改原则

Seedance 2.5：

- 保留 SEO
- 保留独立页面
- 首页只保留轻量 announcement
- **不再作为 Hero 主角**

首页 Hero 主角必须是：

> **现在就能使用的 Seedance AI Video Generator**

---

## P0-2｜AI Video 网站没有用“视频结果”证明自己

目前：

- Generator 默认预览使用 MDN flower.mp4
- Showcase 主要还是静态 JPG
- Hero 没有真正的视频视觉钩子

用户进入 AI Video 网站，最想确认的不是功能列表，而是：

> **“它到底能生成什么样的视频？”**

因此首页必须在第一屏或第一屏下方立即展示真实案例。

### 修改原则

准备 4～6 个高质量真实生成视频：

- 5～10 秒
- muted
- loop
- playsInline
- 优先 WebM / 压缩 MP4
- 视频下显示对应 Prompt

可加入：

`Try this prompt`

点击后：

1. 自动填入 Generator Prompt
2. 自动滚动到 Generator

---

## P0-3｜首页承担了太多“SEO 内容门户”职责

当前首页同时在做：

- Seedance 2.5 新闻
- Seedance 模型百科
- 产品功能介绍
- Generator
- Showcase
- FAQ
- SEO 内容入口

导致首页信息过载。

### 修改原则

首页只承担两个任务：

1. **让用户相信它能生成好视频**
2. **让用户开始生成**

SEO 深度内容继续放：

- `/seedance-2-5`
- `/seedance-2-0`
- `/what-is-seedance`
- `/compare/*`
- `/blog/*`
- `/prompts/*`

---

## P1｜视觉风格太像通用 SaaS 模板

当前视觉：

- 标准 ShipAny 白底 / 卡片
- 普通蓝紫 Primary
- Animated Grid
- 橙色手绘 underline
- 大量 Card + Border

功能没问题，但缺乏 AI Video 产品应该有的“作品感”。

### 推荐视觉方向

不是做夸张 Cyberpunk，而是：

> **Premium Dark Cinema**

关键词：

- 深黑 / 冷灰背景
- 大面积真实视频
- 白色高对比标题
- 少量蓝紫 / 靛蓝高光
- 少边框
- 少卡片
- 大留白
- 视频负责提供主要色彩

**视觉中心永远是视频作品，而不是 UI 装饰。**

---

# 3. 最终首页结构

```text
NAV
│
├── Hero
│   ├── Seedance AI Video Generator
│   ├── 一句话价值主张
│   ├── Generate Video
│   ├── Watch Examples
│   └── 1 个高质量真实视频
│
├── Generator
│   ├── Text to Video
│   ├── Image to Video
│   └── Video to Video
│
├── Made with Seedance
│   ├── Video 01
│   ├── Video 02
│   ├── Video 03
│   ├── Video 04
│   └── Try this prompt
│
├── Why Seedance
│   ├── Cinematic Motion
│   ├── Character Consistency
│   └── Up to 1080p where supported
│
├── Seedance 2.5 Update
│   └── 一个简短区块 → Learn more
│
└── FAQ + CTA
```

---

# 4. Hero 最终建议

## Announcement

```text
Seedance 2.5 announced · Track release updates →
```

它只是新闻条，不抢主标题。

---

## H1

推荐：

```text
Seedance AI Video Generator
```

副标题价值表达：

```text
Turn text and images into cinematic AI videos with Seedance.
Create with the available Seedance 2.0 workflow today.
```

也可以更偏营销：

```text
Turn Your Ideas Into Cinematic Videos
```

副标题：

```text
Create smooth, cinematic AI videos from text or images with Seedance.
```

---

## CTA

Primary：

```text
Generate Video
```

Secondary：

```text
Watch Examples
```

不建议：

```text
Read Seedance 2.5 FAQ
```

FAQ 不是首页首屏主要 CTA。

---

# 5. Hero 视觉结构

PC 推荐：

```text
┌────────────────────────────────────────────────────────┐
│ Seedance 2.5 announced · Track updates →              │
│                                                        │
│ Seedance AI               ┌─────────────────────────┐  │
│ Video Generator           │                         │  │
│                           │   REAL VIDEO LOOP       │  │
│ Turn text and images      │                         │  │
│ into cinematic video.     │                         │  │
│                           └─────────────────────────┘  │
│ [ Generate Video ]                                   │
│ [ Watch Examples ]                                   │
└────────────────────────────────────────────────────────┘
```

移动端：

```text
H1
Description
CTA
Video
```

不要让首屏出现大量介绍文字。

---

# 6. Generator 修改原则

Generator 本身不用重构业务逻辑。

只优化第一印象。

## 必改

### 1. 删除 MDN flower.mp4

替换为真正的 Seedance 成片。

当前 temporary demo 不适合作为产品信任证明。

### 2. 不要让未登录用户第一眼看到：

```text
0 credits
Remaining 0
```

更合理：

未登录：

```text
Sign in to generate
```

登录后再显示 credits。

### 3. Loading 状态弱化

避免初始视觉像：

```text
Model Loading...
Loading...
Cost 0 credits
```

Loading 可以 Skeleton 化，不要成为页面主视觉。

---

# 7. Showcase 改造

标题：

```text
Made with Seedance
```

而不是抽象的：

```text
Seedance Creative Workflows
```

### 卡片内容

```text
[ Video ]

Cinematic Night Drive

"A cinematic tracking shot of..."

[ Try this prompt ]
```

推荐 4～6 个作品类型：

- Cinematic portrait
- Product advertising
- Anime / stylized scene
- Sci-fi environment
- Character motion
- Camera movement demo

这里的目标不是解释 Seedance。

而是：

> **让用户看到结果后产生“我也想试一下”。**

---

# 8. 首页应该删除 / 下沉的内容

首页删除或大幅压缩：

### 删除

- `Meet Seedance 2.5`
- `What Seedance 2.5 Means for Creators`
- 大段 2.5 capability 说明
- Hero 的 `Seedance 2.5 is not yet available`
- Hero 的 `Read Seedance 2.5 FAQ`

### 下沉到独立页面

Seedance 2.5 深度内容：

```text
/seedance-2-5
```

首页最多保留：

```text
Seedance 2.5 is coming
Longer generation · multimodal references · stronger consistency

[ Explore Seedance 2.5 ]
```

---

# 9. Navigation 精简

当前导航信息量过大。

首页 Header 第一层建议：

```text
Models
Examples
Prompts
Pricing

[ Generate Video ]
```

Compare / Developers / Resources 等内容可以继续存在：

- 放 Mega Menu
- 或 Footer
- 或二级入口

但不要抢主路径。

主路径只有：

```text
SEE RESULT → TRY PRODUCT
```

---

# 10. Theme 策略

## 不建议第一步就全站重做 Theme

第一轮优先：

```text
结构 > 视频资产 > Hero > Generator > Showcase > 色彩
```

如果结构没解决，只改 `theme.css`，收益有限。

---

## 推荐 Theme 方向

```text
Background:
#08090D / #0B0D12

Surface:
#11131A

Foreground:
接近白色

Muted:
冷灰

Primary:
Indigo / Electric Blue

Accent:
少量 Violet
```

原则：

- 不要大面积紫色渐变
- 不要泛滥玻璃拟态
- 不要每块内容都 Card
- 视频区域可以更亮
- UI 主体保持克制

---

## Dark Mode

可以测试默认 Dark：

```env
NEXT_PUBLIC_APPEARANCE=dark
```

但它不是这次改版成功的核心。

核心仍然是：

> **真实视频 + 产品型 Hero + 立即生成。**

---

# 11. ShipAny Two 推荐实现方式

不要推翻 ShipAny。

现有结构非常适合短平快改造。

## 第一阶段只动这些

### 1.

```text
src/config/locale/messages/en/pages/index.json
```

负责：

- Hero 文案
- section 顺序
- 删除 / 下沉 2.5 内容
- Showcase 内容

中文同步：

```text
src/config/locale/messages/zh/pages/index.json
```

---

### 2.

```text
src/config/locale/messages/en/landing.json
```

负责：

- 精简 Header Navigation
- CTA

中文同步。

---

### 3.

```text
src/shared/blocks/generator/video.tsx
```

只处理：

- 替换 MDN 默认视频
- 优化 anonymous / loading / credits 第一印象

不要改生成逻辑。

---

### 4. 新建自定义 Theme

推荐按 ShipAny Two 官方方式：

```text
src/themes/seadance/
```

第一版甚至只覆盖：

```text
blocks/hero.tsx
blocks/showcases.tsx
```

其它组件继续 fallback 到 default theme。

这样：

- 改动小
- 容易回滚
- 不破坏 ShipAny
- 后续逐步升级

---

# 12. 第一轮只做 6 件事

这是最推荐的 MVP。

## P0

- [x] H1 不再主打 Seedance 2.5
- [x] 删除 Hero 的“2.5 unavailable”劝退提示
- [x] Hero 放真正 Seedance 视频
- [x] MDN flower.mp4 替换
- [x] Showcase 改成真实循环视频
- [x] 精简首页 2.5 内容

## P1

- [x] Generator anonymous 状态优化
- [x] 导航精简
- [ ] Dark cinematic theme
- [ ] Try this prompt
- [ ] 移动端首屏优化

---

# 13. 不要做的事情

第一轮禁止扩大范围：

- 不改 Stripe
- 不改登录
- 不改数据库
- 不改 AI Provider
- 不改积分计算
- 不重构 Generator
- 不重写整套 ShipAny
- 不为追求视觉一次性魔改几十个组件
- 不堆动画
- 不先做完整 Design System

---

# 14. 数据验证

上线后重点观察：

```text
Homepage bounce rate
Average engagement time
Scroll depth
#generator click rate
Generate button click rate
Sign-in modal open rate
Pricing click rate
```

### 第一阶段成功标准

不预设“必须达到 30 秒”这种没有依据的数字。

只看是否出现明显方向性改善：

```text
4s → 明显上升
80% bounce → 明显下降
Generator interaction → 明显增加
```

如果数据改善，再继续做第二轮视觉 polish。

---

# 15. 最终决策

## 定位

首页从：

> **Seedance 2.5 新闻 / SEO 信息首页**

改成：

> **Seedance AI Video Generator 产品首页**

## 信息顺序

从：

```text
2.5 新闻
↓
2.5 不可用
↓
大量介绍
↓
工具
```

改成：

```text
真实视频结果
↓
现在可以生成
↓
Generator
↓
更多真实案例
↓
产品能力
↓
2.5 新闻 / SEO 信息
```

---

# 一句话执行原则

> **先让用户在 3 秒内看到“它能生成什么”，再让他马上试；Seedance 2.5 的新闻和 SEO 内容全部退到产品体验之后。**
