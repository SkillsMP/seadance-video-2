# AGENTS.md

本文件用于指导 Codex、Antigravity 等 Agent 在本仓库中工作。

## Codex 工作规则

- 未经批准，禁止开 Subagent。

## 项目概览

ShipAny Template Two 是一个现代化全栈 SaaS 应用模板，用于 AI 内容生成，并集成支付处理能力。项目支持多种部署目标，包括 Vercel、Cloudflare、Docker；也支持多种支付服务商，包括 Stripe、PayPal、Creem。

## 常用命令

**开发（Development）：**

```bash
pnpm dev              # 启动开发服务器，使用 Turbopack
pnpm build            # 生产环境构建
pnpm start            # 启动生产服务器
```

**数据库操作（Database Operations）：**

```bash
pnpm db:generate      # 生成 Drizzle 迁移文件
pnpm db:migrate       # 执行数据库迁移
pnpm db:push          # 推送 schema 变更
pnpm db:studio        # 打开 Drizzle Studio
```

**代码质量（Code Quality）：**

```bash
pnpm lint             # 运行 ESLint
pnpm format           # 使用 Prettier 格式化
pnpm format:check     # 检查格式化
```

**Cloudflare 部署：**

```bash
pnpm cf:preview       # 在 Cloudflare 上预览
pnpm cf:deploy        # 部署到 Cloudflare
pnpm cf:typegen       # 生成 Cloudflare 类型
```

## 架构概览

**App Router 结构：**

```text
src/app/[locale]/
├── (landing)/          # 公开页面：首页、价格页等
├── (admin)/            # 管理后台和设置
├── (app)/              # 主应用界面
└── api/                # API routes
```

**核心系统（Core Systems）：**

- **认证（Authentication）**：`src/core/auth/`，集成 Better Auth，并支持动态配置。
- **数据库（Database）**：`src/core/db/`，使用 Drizzle ORM，支持 PostgreSQL / SQLite。
- **权限控制（RBAC）**：`src/core/rbac/`，基于角色的访问控制（Role-Based Access Control）。
- **国际化（Internationalization / i18n）**：`src/core/i18n/`，使用 next-intl，支持中文和英文。

## 关键模式

1. **配置管理（Configuration Management）**：OAuth、支付、存储等设置通过管理后台 `/admin/settings` 写入数据库管理，不主要依赖环境变量。
2. **数据库连接（Database Connection）**：通过 `DB_SINGLETON_ENABLED` 环境变量支持 singleton 和 serverless 两种模式，并会自动检测 Cloudflare Workers 环境。
3. **支付集成（Payment Integration）**：通过 `src/shared/services/payment.ts` 提供多支付服务商支持，并由各服务商实现具体逻辑。
4. **主题系统（Theme System）**：通过 `src/core/theme/` 实现动态主题，结合 CSS variables 和 Tailwind。

## 环境变量要求

- `DATABASE_URL`：PostgreSQL 连接字符串。
- `AUTH_SECRET`：Better Auth 使用的 32 字符密钥，可用 `openssl rand -base64 32` 生成。
- `NEXT_PUBLIC_APP_URL`：应用访问地址。

## TypeScript 路径映射

- `@/*` 映射到 `./src/*`。

## AI 内容生成功能

- 图片生成（Image generation）
- 音频生成（Audio generation）
- 音乐生成（Music generation）
- 视频生成（Video generation）
- 聊天机器人界面（Chatbot interface）

## 数据库 Schema

数据库 schema 位于 `src/core/db/schema/`，使用 Drizzle ORM 定义用户、订阅、积分和 AI 生成记录等数据结构。
