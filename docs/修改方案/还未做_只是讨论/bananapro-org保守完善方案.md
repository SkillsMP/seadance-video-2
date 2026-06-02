# bananapro-org 保守完善方案（收敛版）

> 适用仓库：`maxcoder11/bananapro-org`  
> 目标：在尊重原作者商用级模板能力的前提下，只做少量上线加固和链路补洞，不大改架构、不重写 UI、不提前扩复杂系统。  
> 原则：**只修真实风险，只补现有链路缺口；能保持行为不变就不改变行为；能复用现有机制就不新增机制。**

---

## 一句话结论

当前项目已经具备较完整的商用模板基础。最稳的路线不是重构，而是在现有能力上做“窄范围补强”：

```txt
P0：下载代理防滥用
P0：上传入口安全边界
```

第一阶段只建议先做两项：

```txt
PR 0：/api/proxy/file SSRF + 下载防滥用
PR 1：上传入口安全加固
```

这两项都是明确的安全和成本风险，收益高、改动小、回滚容易。其他已经可用的能力先不改。

---

## 收敛原则

### 1. 不贬低原模板

原项目不是“不能商用”，而是作为具体站点上线前，还需要按业务场景补齐少量安全和 SEO 边界。

### 2. 不顺手重构

每个 PR 只解决一个问题。不要在一个 PR 里混合：

```txt
安全
AI 生成链路
SEO
数据库 migration
UI 改版
支付
权限
i18n core
```

### 3. 不提前设计大系统

短期不做：

```txt
完整 model-capabilities 系统
复杂 key pool
素材库系统
复杂 webhook 签名体系
Prompt / Showcase 大规模 schema 扩展
App Shell / Sidebar 大改
生成器 UI 大重写
```

---

## 当前核对后的关键修正

| 原判断 | 收敛后判断 |
|---|---|
| 新增 `public/robots.txt` | 不做。项目已有 `src/app/robots.ts`，不要并存 |
| dynamic sitemap | 暂不做。当前 `public/sitemap.xml` 可用，后续手动维护即可 |
| `/api/upload` 单点加固 | 不够。还要覆盖 `/api/storage/upload-image` |
| proxy 只允许 image/video | 不够。现有 music 下载也走 proxy，需允许 `audio/*` |
| credit calculator | 暂不做。现有 scene price 可用，先保持不变 |
| notify route | 暂不做。当前 query 轮询可用，除非确认 provider callback 404 影响真实任务 |
| task lifecycle 新增 `initializing` 状态 | 暂不做。现有 `pending / processing / success / failed` 可用 |

---

## 已可用，先不改

以下能力当前可用，不作为本轮修改目标：

```txt
src/app/robots.ts
public/sitemap.xml
/api/ai/query
/api/ai/generate 的现有扣费规则
candidates fallback
现有 task 失败退款基础
Prompt / Showcase 基础表和后台
现有生成器 UI
auth
payment
middleware
root layout
pricing
i18n core
```

判断标准：只要不是明确安全风险、成本风险或已经影响线上主链路，就先不动。

---

# PR 0：`/api/proxy/file` 下载代理防滥用

## 目标

只改：

```txt
src/app/api/proxy/file/route.ts
```

当前接口直接 `fetch(url)`，风险真实且改动面很小，应作为第一优先级。

## 最小实现

```txt
1. 只允许 http / https
2. 禁止 localhost、127.0.0.1、::1
3. 禁止私网 IP：10/8、172.16/12、192.168/16
4. 禁止 link-local / metadata 地址：169.254/16，尤其 169.254.169.254
5. 禁止重定向到不允许的地址
6. 增加超时，建议 10s
7. 限制响应大小，建议 10MB 起步
8. 限制 content-type：image/*、video/*、audio/*
9. 返回 cache-control: no-store
```

## 为什么允许 `audio/*`

现有音乐下载也调用：

```txt
/api/proxy/file?url=...
```

如果只允许图片和视频，会破坏音乐下载。

## 不做

```txt
不改前端下载逻辑
不加通用 rate limiter
不改 storage
不改 AI provider
```

## 验收

```txt
外部图片 / 视频 / 音频可下载
localhost 被拒绝
127.0.0.1 被拒绝
169.254.169.254 被拒绝
非 http/https 被拒绝
超大响应被中断
非媒体 content-type 被拒绝
```

---

# PR 1：上传入口安全加固

## 目标

只加固已有上传入口：

```txt
src/app/api/upload/route.ts
src/app/api/storage/upload-image/route.ts
```

不新增表、不做素材库、不做后台资产页。

## 最小安全线

```txt
1. 必须登录
2. 只允许 image/jpeg、image/png、image/webp
3. 单文件大小限制 5MB 或 10MB
4. 多文件接口限制单次文件数量
5. 使用服务端生成的安全文件名
6. 拒绝 svg、html、js、exe、gif、avif、heic 等首版不需要的类型
```

## 为什么要覆盖两个接口

`/api/upload` 被生成器用于保存图片；`/api/storage/upload-image` 被通用图片上传组件使用。只修其中一个，另一个仍可能成为公开图床入口。

## 不做

```txt
不新增 public/robots.txt
不改 src/app/robots.ts
不做复杂频率限制
不做每日上传配额
不做素材库表
不做图片审核
```

说明：项目已有 `src/app/robots.ts`，继续复用即可。

---

# 暂不做：sitemap 动态化

当前 `public/sitemap.xml` 已经可用。虽然动态 sitemap 更易维护，但不是当前最重要的问题。

本轮不新增：

```txt
src/app/sitemap.ts
```

本轮不替换：

```txt
public/sitemap.xml
```

后续如果页面数量明显增加，或经常忘记手动更新 sitemap，再单独评估。

---

# 暂不做：credit calculator 抽离

当前扣费逻辑虽然写在 `generate route` 里，但行为明确、可用，短期不需要为了“更干净”而抽离。

暂不新增：


```txt
src/extensions/ai/credit-calculator.ts
```

暂不修改：

```txt
src/app/api/ai/generate/route.ts
```

后续如果要接入模型差异定价，再同步改：

```txt
后端扣费
前端展示
余额不足校验
价格文案
测试用例
```

不要只改后端扣费，避免用户看到的价格和实际扣费不一致。

---

# 暂不做：AI notify 路由

当前 `/api/ai/query` 轮询链路可用，notify 不作为第一阶段目标。

只有确认某个 provider 的 callback 404 已经影响真实任务状态时，再新增：

```txt
src/app/api/ai/notify/[provider]/route.ts
```

届时也要保持最小实现：

```txt
callback 只作为提示
根据 provider + taskId 找本地任务
用 provider.query() 服务端确认真实状态
更新失败状态时带 task.creditId，复用现有退款逻辑
```

不直接信任 callback body 改任务状态。

---

# 暂不做：task lifecycle 优化

孤儿任务风险存在，但不是当前最小改动项。它会牵涉：

```txt
generate route
createAITask
updateAITaskById
query route
失败退款
前端 pending 状态
```

短期不新增 `initializing` 状态。现有状态先保持：

```txt
pending
processing
success
failed
canceled
```

后续确实要做时，也优先复用：

```txt
status = pending
taskId = null
taskInfo.status = initializing
```

---

# 暂不做：Prompt / Showcase SEO 页面化

已有基础表、后台和展示流，先不为了 SEO 扩表或新建大量页面。

后续如果要做，再按这个顺序：
```txt
1. 先增强现有 /showcases
2. 再新增 /prompts
3. 最后才考虑 /prompts/[slug] 和 /showcases/[slug]
```

## 不做

```txt
不先扩 prompt schema
不先扩 showcase schema
不做复杂 JSON-LD
不做大规模详情页生成
不做后台管理大改
```

字段应由页面真实需要倒推，不要先凭想象 migration。

---

## 明确不碰

短期不碰：

```txt
auth core
payment
middleware
root layout
pricing
i18n core
ImageGenerator 大重写
VideoGenerator 大重写
App Shell / Sidebar
数据库大重构
```

除非某个 PR 的目标明确需要，否则不顺手修改。

---

## 推荐执行方式

每个 PR 开始前先让 Codex 输出：

```txt
1. 会修改哪些文件
2. 为什么必须修改
3. 不会修改哪些文件
4. 风险点
5. 回滚方式
```

确认后再改代码。

每个 PR 完成后至少运行：

```bash
pnpm lint
pnpm build
```

如果只改文档，不需要跑 build。

---

## 最终优先级

| 优先级 | PR | 目标 | 改动大小 | 收益 | 是否执行 |
|---|---|---|---:|---:|---|
| P0 | PR 0 | `/api/proxy/file` 防 SSRF / 防滥用 | 小 | 极高 | 是 |
| P0 | PR 1 | 上传入口安全加固 | 小 | 高 | 是 |

观察但暂不执行：

| 项目 | 判断 |
|---|---|
| sitemap 动态化 | 当前静态 sitemap 可用，先手动维护 |
| credit calculator 抽离 | 当前扣费规则可用，先不为抽象而抽象 |
| AI notify 路由 | 当前 query 轮询可用，除非确认 callback 404 影响真实任务 |
| task lifecycle 优化 | 有价值但改动面较大，后置 |
| Prompt / Showcase SEO 页面化 | 有价值但不是当前最重要安全项，后置 |

---

## 最终结论

本方案收敛为两步先行：

```txt
先修 proxy；
再修上传。
```

其余能用的先不改，包括 sitemap、robots、AI query、现有扣费、生成器 UI、auth、payment、i18n 等。这样既尊重原商用模板的完整度，也能把改动集中在当前最真实的安全和成本风险上。
