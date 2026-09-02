# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

需要快速获得可用 AI 视频成片的创作者、营销人员和小型制作团队。

## Product Purpose

Seadance Video 是独立的 Seedance 信息与视频生成平台。首页帮助访客理解 Seedance 模型状态，并使用本站当前实际接入的模型开始视频生成。

## Positioning

以清晰区分“模型官方发布状态”和“本站生成器实际可用状态”为前提，提供面向生产的 Seedance 视频工作流。

## Operating Context

用户在浏览器中选择真实可用的模型和输入模式，配置输出参数、查看积分预估、提交生成任务并下载结果。

## Capabilities and Constraints

- 当前生成器配置提供 Seedance 2.0 文生视频、图生视频和视频生视频工作流。
- Seedance 2.5 已由 ByteDance Seed 正式发布，但本站是否可生成必须以项目实际模型配置为准。
- 不虚构模型可用性、生成阶段、耗时、价格或输出规格。
- 保持现有 Next.js、Tailwind、ShipAny 组件体系以及生成、计费、登录和任务状态逻辑。

## Brand Commitments

- 名称：Seadance Video。
- 语气直接、可靠、有电影感，不夸大，也不暗示官方身份。
- 参考 Video Lite 的生成器优先层级与克制表达，不复制其品牌或页面编排。

## Evidence on Hand

- `docs/design-v0.2.md`：本轮视觉方向、事实边界与实施范围。
- `src/config/ai/models.ts`：本站生成器当前实际模型能力。
- `src/config/locale/messages/{en,zh}/pages/index.json`：首页双语内容。
- 项目中没有可用于证明客户数量、生成速度或商业效果的材料，不应制造相关宣传数字。

## Product Principles

- 成片先行，控件退后，状态清楚。
- 模型发布事实与本站可用能力分开表达。
- 生成器是核心任务，营销内容不得干扰开始生成。
- 通过现有系统的最小改动获得一致、专业的体验。

## Accessibility & Inclusion

面向键盘、触控和辅助技术可用，满足 WCAG AA 对比度、可见焦点、输入标签和非颜色状态提示。
