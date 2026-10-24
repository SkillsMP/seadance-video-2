# Scripts 运维与测试脚本指南

本目录包含了项目日常运维、数据库管理、Stripe 支付排错、AI 模型与视频契约测试、埋点回归等所有 CLI 脚本工具。

---

## 目录结构全景

```text
scripts/
├── analytics/                          # 📊 8 个数据埋点回归测试套件（独立子目录）
├── README.md                           # 📖 全量脚本速查与运维指南手册
│
├── with-env.ts                         # 🌟 环境变量加载核心基础
├── ensure-db-schema.ts                 # 🌟 Drizzle 数据库迁移守护
├── init-rbac.ts                        # 🌟 系统角色权限初始化（建站必用）
├── assign-role.ts                      # 🔧 命令行提升管理员
├── seed-blogs.ts                       # 🔧 博客文章数据库初始化
│
├── check-stripe-mode.ts                # 🔧 Stripe Key 模式排查（Test/Live）
├── check-promotion-codes.ts            # 🔧 Stripe 优惠码配置查询
├── verify-stripe-promo-codes.ts        # 🔧 Stripe 线上优惠码校验
├── clear-promotion-codes.ts            # 🔧 Stripe 优惠码重置清空
│
├── validate-ai-models.ts               # 🌟 AI 视频模型注册表校验
├── test-resolve-final-options.ts       # 🌟 视频生成参数解析单测
├── test-calculate-model-credits.ts     # 🌟 动态积分扣费计算校验
├── test-video-image-inputs-smoke.ts    # 🌟 图生视频输入烟雾测试
├── test-model-landing.ts               # 🌟 模型落地页规格与渲染单测
│
├── test-asset-url-security.ts          # 🛡️ 防 SSRF 攻击外部链接安全单测
├── test-schema.ts                      # 📈 VideoObject JSON-LD SEO 单测
├── test-ai-moderation-contract.ts      # 🛡️ 内容安全审核契约单测
├── test-generate-candidate-moderation.ts # 🛡️ 候选提示词审核时序单测
├── test-output-moderation.ts           # 🛡️ 生成后视频机审单测
│
├── grant_credits_to_user.ts            # ⚠️ 临时管理员手动发放积分
└── import-legacy-users.ts              # ⚠️ 老版用户 CSV 批量迁移工具
```

---

## 快速导航与状态总览

| 类别 | 脚本文件 | 推荐运行方式 | 状态 / 价值 | 核心用途 |
| :--- | :--- | :--- | :---: | :--- |
| **环境与基础** | [`with-env.ts`](./with-env.ts) | `tsx scripts/with-env.ts <cmd>` | 🌟 **核心必用** | 注入本地环境变量并执行后续命令 |
| **数据库管理** | [`ensure-db-schema.ts`](./ensure-db-schema.ts) | `pnpm db:migrate` 自动调用 | 🌟 **核心必用** | 确保 public schema 存在，防迁移失败 |
| | [`init-rbac.ts`](./init-rbac.ts) | `pnpm rbac:init` | 🌟 **建站必用** | 初始化系统预设角色与权限（RBAC） |
| | [`assign-role.ts`](./assign-role.ts) | `pnpm rbac:assign -- --email=xx --role=admin` | 🔧 **常用运维** | 命令行授予用户管理员等角色 |
| **支付与促销** | [`check-stripe-mode.ts`](./check-stripe-mode.ts) | `tsx scripts/check-stripe-mode.ts` | 🔧 **排错常用** | 检查 Stripe Key 是 TEST 还是 LIVE 模式 |
| | [`check-promotion-codes.ts`](./check-promotion-codes.ts) | `tsx scripts/check-promotion-codes.ts` | 🔧 **排错常用** | 查看数据库中的 Stripe 优惠码配置 |
| | [`verify-stripe-promo-codes.ts`](./verify-stripe-promo-codes.ts) | `tsx scripts/verify-stripe-promo-codes.ts` | 🔧 **排错常用** | 验证 Stripe 优惠码在 API 端的有效性 |
| | [`clear-promotion-codes.ts`](./clear-promotion-codes.ts) | `tsx scripts/clear-promotion-codes.ts` | 🔧 **排错常用** | 清空或重置促销优惠码 |
| **数据与用户** | [`seed-blogs.ts`](./seed-blogs.ts) | `tsx scripts/seed-blogs.ts` | 🔧 **内容运维** | 将 `content/posts/` 博客导入数据库 |
| | [`grant_credits_to_user.ts`](./grant_credits_to_user.ts) | `tsx scripts/grant_credits_to_user.ts` | ⚠️ **一次性/临时** | 手动为特定邮箱用户发放积分 |
| | [`import-legacy-users.ts`](./import-legacy-users.ts) | `tsx scripts/import-legacy-users.ts --file=xx.csv` | ⚠️ **专项迁移** | 从旧版系统 CSV 备份批量导入用户 |
| **AI 视频与契约** | [`validate-ai-models.ts`](./validate-ai-models.ts) | `pnpm ai:validate-models` | 🌟 **核心回归** | 校验全站模型、工作流、计费配置合法性 |
| | [`test-resolve-final-options.ts`](./test-resolve-final-options.ts) | `pnpm test:video-contract` | 🌟 **核心回归** | 校验时长、画幅、提示词约束与兜底逻辑 |
| | [`test-calculate-model-credits.ts`](./test-calculate-model-credits.ts) | `pnpm exec tsx scripts/test-calculate-model-credits.ts` | 🌟 **核心回归** | 校验所有模型动态积分扣除计算逻辑 |
| | [`test-video-image-inputs-smoke.ts`](./test-video-image-inputs-smoke.ts) | `pnpm test:video-contract` | 🌟 **核心回归** | 图生视频（I2V）输入格式与烟雾测试 |
| | [`test-model-landing.ts`](./test-model-landing.ts) | `pnpm exec tsx scripts/test-model-landing.ts` | 🌟 **核心回归** | 落地页模型规格表、FAQ及结构化数据测试 |
| **安全与 SEO** | [`test-asset-url-security.ts`](./test-asset-url-security.ts) | `tsx scripts/test-asset-url-security.ts` | 🛡️ **安全核心** | 防 SSRF 攻击，校验外部图片/视频 URL 安全 |
| | [`test-schema.ts`](./test-schema.ts) | `tsx scripts/test-schema.ts` | 📈 **SEO回归** | 校验 Google VideoObject JSON-LD 输出 |
| **内容安全审核** | [`test-ai-moderation-contract.ts`](./test-ai-moderation-contract.ts) | `pnpm test:ai-moderation` | 🛡️ **合规核心** | 文本/图像内容审核契约测试 |
| | [`test-generate-candidate-moderation.ts`](./test-generate-candidate-moderation.ts) | `pnpm test:ai-moderation` | 🛡️ **合规核心** | 生成前候选提示词审核测试 |
| | [`test-output-moderation.ts`](./test-output-moderation.ts) | `pnpm test:ai-moderation` | 🛡️ **合规核心** | 生成后视频内容合规审核测试 |
| **数据埋点子目录** | [`analytics/`](./analytics/) (8个测试脚本) | `tsx scripts/analytics/test-analytics-xxx.ts` | 📊 **专用测试套件** | 已收拢至子目录，验证事件入库、合约与漏斗查询 |

---

## 详细分类说明

### 1. 核心基础设施与常用运维（必须保留）
- **`with-env.ts`**：
  核心环境加载器。执行任何依赖环境变量的命令时，自动读取 `.env.production` 或 `.env.local`。
- **`ensure-db-schema.ts`**：
  在运行 Drizzle 迁移前自动执行，检查 PostgreSQL 数据库中是否存在 `public` schema，若不存在则创建。
- **`init-rbac.ts`**：
  初始化基于角色的权限控制表，自动录入 `admin`、`user`、`vip` 等预设角色与权限范围。
- **`assign-role.ts`**：
  在服务器端快速提升管理员权限：
  `tsx scripts/with-env.ts npx tsx scripts/assign-role.ts --email=admin@example.com --role=admin`
- **`seed-blogs.ts`**：
  用于在数据库为空或部署新站时，将本项目的 Markdown 博客文章自动录入数据库并生成分类。

### 2. Stripe 支付排错工具（排查收款问题时极有用）
- **`check-stripe-mode.ts`**：
  直接读取数据库的 Stripe 配置，输出当前是处于 `TEST` 模式还是 `LIVE` 模式，并检查公钥与私钥模式是否一致。
- **`check-promotion-codes.ts`** / **`verify-stripe-promo-codes.ts`** / **`clear-promotion-codes.ts`**：
  一键检查、校验与清空 Stripe 促销优惠码，排查结账时优惠码无效或配置被覆盖的问题。

### 3. AI 视频业务与核心契约测试（模型接入与上线必跑）
- **`validate-ai-models.ts`**：
  验证 `src/config/ai/models.ts` 内注册的所有视频模型，检查 scene、时长、比例、默认选项、扣费单价和 fallback 是否完备。
- **`test-resolve-final-options.ts`**：
  针对不同的用户输入参数（如 prompt、aspect_ratio、duration），测试模型参数解析器能否正确推导出合法的 API payload 与 fallback 参数。
- **`test-calculate-model-credits.ts`**：
  全面校验每种视频模型在 5秒/10秒、720p/1080p 下的扣费积分计算是否与价格表完全一致。
- **`test-video-image-inputs-smoke.ts`**：
  模拟图生视频、多参考图场景，校验提交的 URL、Base64 或文件格式是否符合规范。
- **`test-model-landing.ts`**：
  检验模型落地页（Seedance 2.0/2.5 等）的各区块（规格表、折叠FAQ、面包屑、结构化数据）是否能够正常解析和渲染。

### 4. 安全防护与 SEO 校验
- **`test-asset-url-security.ts`**：
  极关键的安全防线！验证输入资源链接，拦截 `127.0.0.1`、`localhost`、`169.254.169.254`（云厂商元数据地址）等内网私有 IP，彻底防范 SSRF 漏洞。
- **`test-schema.ts`**：
  验证输出给 Google 的 VideoObject 结构化 JSON-LD 数据符合搜索引擎收录规范。

### 5. 埋点系统单测套件（`scripts/analytics/`）
共 8 个测试文件（已独立收拢至 `scripts/analytics/` 子目录）：
- `test-analytics-contract.ts`：事件契约校验
- `test-analytics-event-record.ts`：事件记录结构
- `test-analytics-service.ts`：客户端事件过滤与规范化
- `test-analytics-queries.ts`：聚合报表查询
- `test-analytics-track.ts`：客户端 track 函数调用
- `test-analytics-business-boundaries.ts`：业务边界拦截
- `test-analytics-route-contract.ts`：API 路由契约
- `test-analytics-funnel-route-contract.ts`：转化漏斗路由契约
可在需要深度调试或升级数据分析系统时运行，日常开发不干扰根目录。
