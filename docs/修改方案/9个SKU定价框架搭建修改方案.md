# 9 个 SKU 定价框架搭建修改方案

## 0. 当前结论

当前仓库里的前台 pricing 配置还没有切到最终 9 个 SKU。

现在英文 / 中文价格页仍然只有 3 个 `product_id`：

```text
credits-package
starter-monthly
premium-yearly
```

目标是先把 pricing 框架搭起来，变成 3 条产品线 × 3 档，共 9 个 SKU：

```text
credits_starter
credits_growth
credits_scale
monthly_basic
monthly_pro
monthly_ultimate
annual_basic
annual_pro
annual_ultimate
```

这一步先解决套餐配置源、支付 `product_id`、展示分组和订单授信字段，不继续扩大到模型 route、支付状态机、积分账本、年付按月发放计划任务。

### 0.1 重新审核结论

这个方案方向正确，属于高收益、低入侵的配置型改动；但执行时必须继续收敛。最终定性不是“套餐系统建设”，而是一次：

```text
配置迁移 + 一个极小 UI 兜底修复
```

推荐按下面边界执行：

```text
最稳最小改动 = 2 个 pricing JSON + 1 个 pricing.tsx 静态 grid class 兜底。
```

核心判断：

- 优雅点在于继续复用现有 `pricing.json -> checkout -> order -> credits` 链路，不新增套餐注册表、不新增配置中心、不改数据库。
- 最大收益是一次性把前台售卖口径从 3 个旧 item 对齐到 9 个正式 SKU，后续支付、订单、订阅和积分都能继续围绕 `product_id` 运转。
- 最小入侵是只动配置和一个 Tailwind 静态 class 兜底，不碰支付状态机、webhook、积分 FIFO、任务模型。
- 可维护性提升来自 `product_id / amount / credits / valid_days` 的明确表格和 en / zh 一致性校验，而不是新增抽象层。
- 可回滚性好，因为 pricing JSON 可以直接回退到旧 3 item；布局小修如果做了，也是纯 UI 展示修复。

需要压住的风险：

- 不要新增 `plans.ts`、`pricing-skus.ts`、`credit-policy.ts` 这类第二配置源。
- 不要把 9 个 SKU 同时写进 TypeScript 常量和 JSON，避免双写漂移。
- 不要为了旧订阅兼容提前做数据库迁移；先确认是否已有生产付费订阅。
- 不要为了年付按月发放引入 cron、ledger 分账或订阅周期任务；一期按现有能力一次性授信。
- 不要为了 Creem 预留假 `payment_product_id`；没有真实 id 就不要填。
- 不要改 `settings.ts` 示例来制造“看起来已支持 9 SKU”的假稳定感。
- 不要把模型扣费细节写进套餐卡片，避免 pricing JSON 变成第二个扣费说明源。

---

## 1. 当前代码基础

现有代码已经具备大部分框架能力：

| 能力 | 当前文件 | 结论 |
|---|---|---|
| Pricing 配置源 | `src/config/locale/messages/en/pages/pricing.json`、`src/config/locale/messages/zh/pages/pricing.json` | 仍是 3 个 item，需要改成 9 个 |
| Pricing 分组展示 | `src/themes/default/blocks/pricing.tsx` | 已支持 `groups` + `items` 按 group 过滤 |
| Checkout 数据来源 | `src/app/api/payment/checkout/route.ts` | 服务端按 `product_id` 从 pricing JSON 取金额、周期、积分 |
| 订单授信 | `src/shared/services/payment.ts` | 支付成功后按 order 的 `creditsAmount`、`creditsValidDays` 发积分 |
| 扣费单一来源 | `src/config/ai/credit-costs.ts` | 已有基础 helper；本次不继续扩展模型扣费 |

所以本次不需要新建 `plans.ts`、不需要新建数据库表，也不需要改支付 webhook。

---

## 2. 本次目标

### 必须做

- 把 en / zh pricing JSON 的 `items` 从 3 个替换成 9 个。
- 保持 en / zh 的非翻译字段完全一致。
- 保留现有 `one-time` / `monthly` / `yearly` 三个 group。
- 让每个 group 下展示 3 张卡片。
- 把 `src/themes/default/blocks/pricing.tsx` 的动态 `md:grid-cols-${n}` 改成静态可扫描 class。
- 明确 `payment_product_id` 的保守规则：没有真实 provider product id 就不要写字段。

说明：

```text
pricing.tsx 修复不是重构，不是新增抽象，也不是业务逻辑变化；
它只是避免 9 SKU 后 Tailwind 没有编译动态 grid class。
```

### 暂时不做

- 不改支付订单表、订阅表、积分表结构。
- 不做年付按月发放计划任务。
- 不做旧订阅迁移。
- 不做后台套餐管理页面。
- 不做 provider/model 维度的动态二次计费。
- 不把成本、毛利、供应商 route 写进前台配置。
- 不改 `src/shared/services/settings.ts` 示例。

---

## 3. 目标 SKU 表

`amount` 使用美元最小单位，`1490` 表示 `$14.90`。

| product_id | group | 产品线 | 档位 | interval | amount | price | credits | valid_days | plan_name |
|---|---|---|---|---|---:|---:|---:|---:|---|
| `credits_starter` | `one-time` | 一次性积分包 | Starter | `one-time` | 1490 | `$14.90` | 400 | 365 | 空 |
| `credits_growth` | `one-time` | 一次性积分包 | Growth | `one-time` | 3990 | `$39.90` | 1200 | 365 | 空 |
| `credits_scale` | `one-time` | 一次性积分包 | Scale | `one-time` | 9990 | `$99.90` | 3600 | 365 | 空 |
| `monthly_basic` | `monthly` | 月付订阅 | Basic | `month` | 990 | `$9.90` | 360 | 30 | `Basic` |
| `monthly_pro` | `monthly` | 月付订阅 | Pro | `month` | 2990 | `$29.90` | 1200 | 30 | `Pro` |
| `monthly_ultimate` | `monthly` | 月付订阅 | Ultimate | `month` | 7990 | `$79.90` | 3600 | 30 | `Ultimate` |
| `annual_basic` | `yearly` | 年付订阅 | Basic | `year` | 9900 | `$99` | 4320 | 365 | `Basic` |
| `annual_pro` | `yearly` | 年付订阅 | Pro | `year` | 29900 | `$299` | 14400 | 365 | `Pro` |
| `annual_ultimate` | `yearly` | 年付订阅 | Ultimate | `year` | 79900 | `$799` | 43200 | 365 | `Ultimate` |

一期按当前支付与积分系统能力执行：

```text
年付订阅支付成功后一次性发放全年积分。
```

原因是当前授信逻辑来自 `order.creditsAmount`，没有月度拆分发放任务。如果要做“年付按月发放”，需要另起计划任务和积分账本方案，不放在本次框架改动里。

---

## 4. 需要修改的文件

| 文件 | 修改内容 |
|---|---|
| `src/config/locale/messages/en/pages/pricing.json` | 必改：改成 9 个英文 SKU |
| `src/config/locale/messages/zh/pages/pricing.json` | 必改：改成 9 个中文 SKU，结构字段和英文完全一致 |
| `src/themes/default/blocks/pricing.tsx` | 建议同 PR 小修：把动态 grid class 改成静态可扫描 class |

不改 `src/shared/services/settings.ts`。它不是运行时必需项，示例占位符变化不能提升真实可用性，反而容易制造误解。

---

## 5. Pricing JSON 字段约束

英文和中文 `pricing.json` 里，这些必填字段必须完全一致：

```text
product_id
interval
amount
currency
credits
valid_days
group
plan_name
```

这些可选支付字段可以共同缺失；如果出现，必须 en / zh 完全一致：

```text
payment_product_id
payment_providers
currencies
```

只允许翻译这些字段：

```text
title
description
features_title
features
tip
button.title
product_name
FAQ 文案
CTA 文案
```

建议 groups 维持：

```json
[
  {
    "name": "one-time",
    "title": "Pay as you go"
  },
  {
    "name": "monthly",
    "title": "Monthly",
    "is_featured": true
  },
  {
    "name": "yearly",
    "title": "Annual",
    "label": "Pay 10 months, get 12"
  }
]
```

中文只翻译 `title` 和 `label`，不要改 `name`。

`payment_product_id` 规则：

- 没有真实 provider product id，就不要写 `payment_product_id` 字段。
- 不要写空字符串。
- 不要写 `prod_xxx`、`price_xxx` 这类假值。
- 如果使用 Creem，必须填真实 Creem product id，且 en / zh 完全一致。

---

## 6. 单个 item 推荐结构

英文示例：

```json
{
  "title": "Pro Monthly",
  "description": "Best for regular image and video generation.",
  "features_title": "Includes",
  "features": [
    "1,200 credits per month",
    "Credits work for image and video generation",
    "Credits valid for 30 days",
    "Cancel anytime"
  ],
  "interval": "month",
  "amount": 2990,
  "currency": "USD",
  "price": "$29.90",
  "original_price": "$39.90",
  "unit": "/ month",
  "label": "Popular",
  "is_featured": true,
  "tip": "Cancel anytime.",
  "button": {
    "title": "Subscribe",
    "url": "/#pricing",
    "icon": "RiBankCardLine"
  },
  "product_id": "monthly_pro",
  "product_name": "Pro Monthly",
  "credits": 1200,
  "valid_days": 30,
  "group": "monthly",
  "plan_name": "Pro"
}
```

注意：

- `payment_product_id` 不确定时不要填假值。
- 如果使用 Creem，必须配置真实 `payment_product_id` 或 `creem_product_ids` 映射。
- 如果使用 Stripe / PayPal 动态价格，可以先不填 `payment_product_id`。
- 如果配置多币种，币种级 `currencies[].payment_product_id` 优先于 item 级 `payment_product_id`。
- 套餐卡片只讲额度、有效期、周期和订阅属性，不写具体模型扣费细节。
- 详细模型扣费应该由后续第 4 份落地文档或 `credit-costs.ts` 驱动，不在 pricing JSON 里重复维护。

---

## 7. 支付映射规则

### 7.1 Stripe

当前 Stripe provider 使用动态 `price_data` 创建 checkout session。

结论：

- 9 个 SKU 可以不填 `payment_product_id`。
- 本次不改 `settings.ts` 的 `stripe_promotion_codes` 示例。
- 如果生产要绑定预设优惠码，应该在真实后台配置里填真实 promotion code。

### 7.2 PayPal

当前 PayPal provider 也是动态创建 order / subscription plan。

结论：

- 9 个 SKU 可以不填 `payment_product_id`。
- 仍然要确认 webhook 和 subscription 回调能正确写入 `order_no` metadata。

### 7.3 Creem

当前 Creem provider 创建 checkout 时要求 `order.productId`。

结论：

- 如果默认支付通道是 Creem，必须为 9 个 SKU 配真实 Creem product id。
- 可以在 pricing item 里填 `payment_product_id`。
- 也可以在后台配置 `creem_product_ids` JSON 映射。
- 本次不改 `settings.ts` 的 `creem_product_ids` 示例。
- 不允许用假 `prod_xxx` 占位符冒充真实配置。

---

## 8. Pricing 组件布局风险

`src/themes/default/blocks/pricing.tsx` 当前 grid class 是动态拼出来的：

```tsx
className={`mx-auto mt-0 grid w-full gap-6 md:grid-cols-${
  pricing.items?.filter((item) => !item.group || item.group === group)?.length
}`}
```

现在每组只有 1 个 item，所以这个问题不明显。改成每组 3 个 item 后，如果 Tailwind 没有生成 `md:grid-cols-3`，页面可能仍然显示成单列。

建议本次同 PR 直接改成静态可扫描 class：

```tsx
const visibleItems =
  pricing.items?.filter((item) => !item.group || item.group === group) || [];
const gridColsClass =
  visibleItems.length >= 3
    ? 'md:grid-cols-3'
    : visibleItems.length === 2
      ? 'md:grid-cols-2'
      : 'md:grid-cols-1';
```

然后容器使用：

```tsx
className={cn('mx-auto mt-0 grid w-full gap-6', gridColsClass)}
```

这属于布局兜底，不改变业务逻辑。

修改时只做这一处，不抽新组件、不改卡片结构、不重做 pricing UI。

---

## 9. 旧 product_id 处理

替换 9 个 SKU 前先确认生产环境是否已有付费订单或订阅使用旧 id。这个检查是上线前 gate，不是本次默认开发任务：

```text
credits-package
starter-monthly
premium-yearly
```

如果还没有生产付费用户：

- 可以直接替换 pricing JSON。
- 新订单只会使用新的 9 个 `product_id`。

如果已经有生产付费订阅：

- 暂停上线。
- 不要在本 PR 顺手写兼容层。
- 不要在本 PR 顺手做数据库迁移。
- 旧订阅兼容应该单独评估，不要混进这次配置迁移。

推荐映射只作为人工迁移参考，不自动写死：

| 旧 product_id | 建议迁移目标 |
|---|---|
| `credits-package` | `credits_starter` 或按实际购买金额映射 |
| `starter-monthly` | `monthly_basic` 或 `monthly_pro`，取决于原价格承诺 |
| `premium-yearly` | `annual_pro`，取决于原价格承诺 |

---

## 10. 推荐实施顺序

1. 先确认是否已有生产付费订单或活跃订阅使用旧 `product_id`。
2. 读取 en / zh pricing JSON，确认当前 3 个 item。
3. 将英文 pricing JSON 改成 9 个 item。
4. 将中文 pricing JSON 改成同结构 9 个 item。
5. 修改 `pricing.tsx`，把动态 `md:grid-cols-${n}` 改成静态可扫描 class。
6. 用脚本校验 en / zh JSON 可解析。
7. 校验 en / zh 的 9 个 `product_id`、`amount`、`credits`、`valid_days` 完全一致。
8. 本地打开 `/pricing`，确认三个 tab 每个都有 3 张卡片。
9. 使用登录用户分别点 3 类产品线至少各 1 个 SKU，确认 checkout 能创建订单。
10. 如果默认支付通道是 Creem，先配置真实 Creem product id 再测。
11. 验证订阅续费时，现有 renewal 逻辑仍会按 subscription/order 的 credits 字段再次授信；只验证，不重构。

---

## 11. 验收命令

JSON 解析：

```bash
node -e "const fs=require('fs'); for (const p of ['src/config/locale/messages/en/pages/pricing.json','src/config/locale/messages/zh/pages/pricing.json']) { JSON.parse(fs.readFileSync(p,'utf8')); console.log(p, 'ok') }"
```

检查旧 id 是否还在前台 pricing 配置里：

```bash
rg "credits-package|starter-monthly|premium-yearly" src/config/locale/messages/en/pages/pricing.json src/config/locale/messages/zh/pages/pricing.json
```

检查新 id 数量：

```bash
rg "credits_starter|credits_growth|credits_scale|monthly_basic|monthly_pro|monthly_ultimate|annual_basic|annual_pro|annual_ultimate" src/config/locale/messages
```

如果改了 TypeScript：

```bash
pnpm lint
npx tsc --noEmit
```

---

## 12. 验收清单

| 检查项 | 通过标准 |
|---|---|
| SKU 数量 | en / zh pricing JSON 都是 9 个 item |
| 分组 | `one-time` / `monthly` / `yearly` 每组 3 个 item |
| product_id | 9 个新 id 完全一致，旧 id 不再用于前台购买 |
| 金额 | `amount` 使用美元最小单位 |
| 积分 | `credits` 和目标 SKU 表一致 |
| 有效期 | 一次性和年付 365 天，月付 30 天 |
| 年付授信 | 一期按全年积分一次性发放 |
| Checkout | 服务端仍按 pricing item 取金额、周期、积分 |
| 支付映射 | Creem 已有真实 product id；Stripe / PayPal 可动态创建 |
| 前台展示 | 不展示供应商、成本、毛利、route、fallback |
| 布局 | 每个 tab 下 3 张卡片正常展示 |
| 续费授信 | 订阅续费仍按现有 renewal 逻辑发放 credits |
| 改动范围 | 没有改支付 webhook、积分账本、数据库结构 |

---

## 13. 回滚方案

这次方案必须保持可回滚。

如果上线前发现问题：

- 还原 en / zh pricing JSON 到旧 3 个 item。
- 如果改过 `pricing.tsx`，可以保留静态 grid class 修复；它不依赖 9 SKU，也不影响业务。
- 如果只是不想保留任何代码改动，回退 `pricing.tsx` 即可。

如果已经产生了新订单：

- 不要直接改数据库。
- 先保留新 `product_id` 对应的 pricing item，等订单完成或退款处理完再清理。
- 回滚价格页展示时，可以临时隐藏新 SKU，但不要删除仍可能被回调读取的订单记录。

回滚边界：

```text
只回滚 pricing 配置和可选 UI 修复；
不回滚支付状态机；
不回滚积分账本；
不做批量数据库改写。
```

---

## 14. 和第 4 份落地文档的关系

这份文档只负责“先搭框架”。

执行完本方案后，再回头整理：

```text
docs/定价/4.前台定价与积分扣费AI落地文档.md
```

第 4 份文档应该基于已经落地的 9 个 SKU 框架继续写：

- 前台套餐展示文案
- Credits 使用说明
- 生成器扣费展示
- 后续 `credit-costs.ts` 的 family override
- 免费额度边界

不要在第 4 份文档里再混入“当前还是 3 个 SKU”的过渡状态。
