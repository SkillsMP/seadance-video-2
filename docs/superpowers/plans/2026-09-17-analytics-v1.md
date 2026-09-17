# Analytics V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The repository explicitly forbids Subagents, so execution stays in the current task.

**Goal:** 在不改变现有生成、扣费、支付和认证业务语义的前提下，增加一层自建事件事实表，覆盖访客到生成、注册、结算和支付的 V1 主链路，并提供可复用的三类基础查询。

**Architecture:** 事件名与属性约束集中在纯 TypeScript 契约模块；服务端负责身份、订单、任务和支付等权威事件，浏览器仅负责行为事件并通过现有 API 上报；Drizzle 只新增一张 PostgreSQL `events` 表。统计写入均在原业务成功提交之后独立执行，失败只记录日志，不影响原流程。`build_id` 只作为可空预留字段，版本 cohort、GA4 业务同步和 MCP 后移。

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, existing `tsx` + `node:assert` scripts.

**Spec:** `docs/seadance-site-analytics-ai-growth-design.md`

## Global Constraints

- 只修改本计划涉及的 analytics 文件和既有主链路的最小接入点。
- 不引入依赖，不重构现有生成、扣费、支付、认证流程，不把统计写入业务事务。
- 服务端事件不接受浏览器伪造的 `user_id`、订单金额、支付结果或任务结果。
- 不保存 prompt、生成结果 URL、完整错误堆栈、支付响应和其他敏感原文。
- 所有统计写入失败必须被隔离；重复事件通过 `dedupe_key` 安全忽略。
- 先写失败测试，再写对应的最小生产代码；每个阶段运行针对性检查。

---

## Task 1: Add the V1 event contract

**Files:**

- Create: `src/shared/lib/analytics/events.ts`
- Create: `scripts/test-analytics-contract.ts`

- [ ] Write assertions for the 14 V1 event names, allowed source values, duration buckets, safe property filtering, and client/server event classification.
- [ ] Run `pnpm exec tsx scripts/test-analytics-contract.ts` and confirm it fails because the contract module is not implemented.
- [ ] Implement the event-name union, small event metadata map, bounded property sanitizer, duration bucket helper, and typed client/server input shapes.
- [ ] Run the contract test again and keep the API limited to helpers used by the remaining tasks.

## Task 2: Add the PostgreSQL events table and persistence model

**Files:**

- Modify: `src/config/db/schema.postgres.ts`
- Create: `src/shared/models/event.ts`
- Create: `scripts/test-analytics-event-record.ts`

- [ ] Write assertions for building a normalized event row, defaulting schema version/source/timestamps, dropping unsafe properties, and producing a stable dedupe key when supplied.
- [ ] Run the persistence test and confirm the expected failure before adding the model.
- [ ] Add only the `events` table with the V1 fields and indexes needed for event/time, user/time, and anonymous/time queries; keep `build_id` nullable.
- [ ] Implement a small insert function using `onConflictDoNothing` for `dedupe_key`; do not add foreign keys or a second user/generation/order fact model.
- [ ] Run the persistence test, TypeScript check for the touched modules, and `pnpm db:generate` if the repository’s local database configuration permits it.

## Task 3: Add isolated server/client analytics entry points

**Files:**

- Create: `src/shared/services/analytics-events.ts`
- Create: `src/app/api/analytics/events/route.ts`
- Create: `src/shared/lib/analytics/track.ts`
- Create: `scripts/test-analytics-service.ts`

- [ ] Write service assertions for client payload validation, server-owned identity fields, event-specific dedupe keys, and failure isolation.
- [ ] Run the service test before implementation and confirm failure.
- [ ] Implement `recordEvent` for trusted server callers and a client-event route that derives the authenticated user from the existing auth session, accepts only safe anonymous/session context, and never accepts client-owned order/user authority.
- [ ] Implement a fire-and-forget browser `track()` that reuses the existing cookie utilities for anonymous/session IDs, honors an explicit denied analytics cookie, and silently handles network failure.
- [ ] Keep request payloads small and bounded; do not add queues, retries, GA4 writes, MCP, or consent UI in V1.
- [ ] Run the service tests and lint/type checks for the new modules.

## Task 4: Connect the existing business boundaries

**Files:**

- Modify: `src/app/api/ai/generate/route.ts`
- Modify: `src/app/api/ai/query/route.ts`
- Modify: `src/app/api/payment/checkout/route.ts`
- Modify: `src/shared/services/payment.ts`
- Modify: `src/app/[locale]/(landing)/layout.tsx`
- Modify: `src/themes/default/blocks/pricing.tsx`
- Modify: `src/shared/blocks/generator/video.tsx`
- Modify: `src/shared/blocks/generator/image.tsx`
- Modify: `src/app/[locale]/(oauth)/auth-callback/page.tsx`

- [ ] Add server events only after the existing operation has succeeded: `generation_started`, terminal generation events, `checkout_started`, `purchase`, and the authentication success event at the existing callback boundary.
- [ ] Add client behavior events at existing UI boundaries: `landing_view`, `pricing_view`, `tool_start`, `upload_completed`, `result_view`, `download_result`, and client-visible `generation_submit_failed`.
- [ ] Use task/order IDs and fixed error types or duration buckets as properties; do not move or duplicate business state transitions.
- [ ] Ensure terminal polling emits one logical success/failure event per task through a task-based dedupe key.
- [ ] Run the existing focused tests plus lint/type checks; inspect the diff for unrelated changes.

## Task 5: Add the three V1 read paths and verify the handoff

**Files:**

- Modify: `src/shared/services/analytics-events.ts`
- Create: `src/app/api/analytics/funnel/route.ts`
- Create: `scripts/test-analytics-queries.ts`
- Modify: `docs/seadance-site-analytics-ai-growth-design.md`

- [ ] Write query assertions for the ordered funnel, source/landing-page breakdown, and generation guidance breakdown; assert that counts are distinct users/tasks/orders where the spec requires it.
- [ ] Run the query test before implementation and confirm failure.
- [ ] Implement only bounded aggregate reads over `events` plus existing business tables; return sample-size/coverage information and no raw event dump by default.
- [ ] Expose one internal/admin-protected route or service entry point consistent with the repository’s existing admin authorization pattern; do not build a dashboard in V1.
- [ ] Update the design document’s V1 checklist to reflect the implemented boundaries while keeping V2 appendices intact.
- [ ] Run fresh verification: contract/service/query tests, `pnpm lint`, `pnpm format:check`, and the narrowest available build/type check. Review `git diff --stat` and `git diff` before reporting completion.
