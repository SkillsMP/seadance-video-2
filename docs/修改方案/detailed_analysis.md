# 详细可借鉴改动列表（来自 changes.diff）

以下列出了在 **同行项目** 中值得我们直接采用或参考的具体改动，按模块划分，并附带文件路径、关键行号以及改动概要。

---
## 1. 配置泄露安全修复
| 文件路径 | 关键行号 | 改动概述 |
|---|---|---|
| `src/app/[locale]/(auth)/sign-in/page.tsx` | 15‑18 | 将 `getConfigs` 替换为 `getPublicConfigs`，并加上安全注释，防止 API 密钥泄漏。 |
| `src/app/[locale]/(auth)/sign-up/page.tsx` | 15‑18 | 同上，统一使用 `getPublicConfigs`。 |
| `src/shared/services/settings.ts` | 65‑71 | 新增 `publicSettingNames` 白名单，列出仅可公开的配置键（如 `email_auth_enabled`、`email_verification_enabled`），并在注释中强调不允许暴露凭证。 |

**建议**：在我们项目的登录/注册页面同样使用 `getPublicConfigs`，并在 `settings.ts` 中维护白名单，确保前端仅能获取安全配置。

---
## 2. Admin 面板 UI 增强
| 文件路径 | 关键功能 |
|---|---|
| `src/app/[locale]/(admin)/admin/prompts/[id]/delete/page.tsx` | 删除弹窗确认、错误提示。
| `src/app/[locale]/(admin)/admin/prompts/[id]/edit/page.tsx` | 表单编辑、字段校验、保存成功提示。
| `src/app/[locale]/(admin)/admin/prompts/add/page.tsx` | 新增 Prompt 页面，含富文本编辑器。
| `src/app/[locale]/(admin)/admin/showcases/[id]/delete/page.tsx` | 与 Prompt 类似的删除逻辑。
| `src/app/[locale]/(admin)/admin/showcases/[id]/edit/page.tsx` | Showcase 编辑页面，实现多媒体字段管理。
| `src/app/[locale]/(admin)/admin/showcases/add/page.tsx` | 新增 Showcase 页面，含图片上传组件。
| `src/app/[locale]/(admin)/admin/showcases/page.tsx` | 列表分页、搜索、批量操作按钮。

**建议**：如果我们计划在后台提供 Prompt/Showcase 管理，可直接拷贝这些页面的布局与交互逻辑，只修改路由前缀（`/admin/...`）以及对应的 API 调用路径。

---
## 3. 任务生命周期相关 API（调度、状态、日志）
| 文件路径 | 功能概述 |
|---|---|
| `src/shared/services/ai_task_dispatch.ts` | `dispatch` 函数实现任务入队、并发限制、重试策略。 |
| `src/shared/services/ai_task_status.ts` | `getStatus` API，返回任务当前状态（pending/processing/succeeded/failed）。 |
| `src/shared/services/ai_task_showcase.ts` | `showcase` 接口，将任务结果同步到展示页。 |
| `src/shared/models/ai_task.ts` | 数据模型扩展：新增 `retryCount`、`lastError`、`metadata` 字段，支持更细粒度的错误追踪。 |

**注意**：这套任务体系依赖数据库表 `ai_task`（字段需对应）以及可能的队列服务（如 Cloudflare Queue）。建议在独立分支实现 **Task Lifecycle Upgrade**，先创建迁移脚本再逐步替换现有 `generate` 路由的调度逻辑。

---
## 4. 国际化（i18n）文案补全
| 文件路径 | 新增/更新的键值对示例 |
|---|---|
| `src/config/locale/messages/en/admin/prompts.json` | `"createPrompt": "Create Prompt"`, `"editPrompt": "Edit Prompt"` |
| `src/config/locale/messages/zh/admin/prompts.json` | `"createPrompt": "创建提示词"`, `"editPrompt": "编辑提示词"` |
| `src/config/locale/messages/en/landing.json` | `"welcome": "Welcome to BananaPro"`, `"pricing": "Pricing"` |
| `src/config/locale/messages/zh/landing.json` | `"welcome": "欢迎使用 BananaPro"`, `"pricing": "定价方案"` |

**建议**：把这些新增键同步到我们项目现有的 `locale/messages/*` 文件，确保所有页面在切换语言时都有对应文本。

---
## 5. UI 動效组件（提升 Premium 视觉）
| 组件路径 | 功能描述 |
|---|---|
| `src/shared/components/magicui/avatar-circles.tsx` | 多圆头像动画，适合用户头像墙或团队展示。
| `src/shared/components/magicui/particles.tsx` | 背景粒子特效，可用于 Landing 页面首屏。
| `src/shared/components/ui/animated-grid-pattern.tsx` | 网格动态背景，配合 CSS `backdrop-filter` 实现玻璃幻影（glassmorphism）。

**使用方式**：在需要的页面 `import` 组件后，按照 README 中的 Props（如 `size`, `color`）进行配置。因为项目使用原生 CSS，建议在对应页面的 `<style>` 区块或全局 `index.css` 中加入对应的自定义变量。

---
## 6. Showcase 数据模型扩展
| 文件路径 | 关键新增字段 |
|---|---|
| `src/shared/models/showcase.ts` | `coverImageUrl`, `tags`, `metrics.views`, `metrics.likes`, `metadata.createdAt`, `metadata.updatedAt` |

**建议**：如果我们想在前端展示作品集，可在自己的 `Showcase` 类型中加入上述字段，提升 SEO 与社交分享价值。

---
## 7. 其他值得关注的小改动
| 文件路径 | 小改动概要 |
|---|---|
| `src/shared/components/ui/chart.tsx` | 新增 `responsive` 属性，实现图表自适应。
| `src/shared/components/magicui/particles.tsx` | 优化性能，使用 `requestAnimationFrame` 控制帧率。
| `src/shared/lib/rate-limit.ts` | 删除了冗余 `-1` 行，保持代码整洁。

**结论**：以上改动均可在不破坏我们现有核心生成/定价体系的前提下，提升安全性、运维体验、后台管理以及前端视觉品质。**优先实现** 配置安全修复、i18n 合并、UI 动效组件；随后评估任务调度 API 的迁移路径；最后在需要时逐步引入 Admin 看板页面。
