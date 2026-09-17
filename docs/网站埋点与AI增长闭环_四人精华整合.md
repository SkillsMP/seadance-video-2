# 网站埋点 + GA4 + 自建事件表 + AI Agent：四人方法精华整合

> 资料基础：虾哥（浅滩小虾米）、Niko、王焱，以及你转述的哥飞分享。  
> 目标：给独立开发者 / AI 工具站做一套**够轻、能落地、能复盘、以后能交给 AI Agent 的数据闭环**。  
> 本文将“原作者观点”和“综合后的落地方案”分开写，避免把几个人的思路混在一起。

---

## 0. 一句话结论

四个人的方法拼在一起，可以形成这一条完整链路：

```text
GSC
看搜索机会
page + query + impressions + clicks + position
        │
        ▼
GA4
看用户行为与漏斗
来源 + 页面 + 事件 + 语言 + 设备 + 漏斗
        │
        ▼
自建 Events / Users / Generations / Orders
看真实业务事实
匿名访客 → 用户 → 生成 → 订单 → 付款
        │
        ▼
AI Agent / MCP
读数据 → 找异常 → 判断原因 → 提修改 → 执行 → 再观察
```

核心不是“装哪个统计工具”，而是：

> **让搜索数据、行为数据、业务数据最终能被 AI 读取并形成反馈闭环。**

---

# 1. 四个人各自解决什么问题

| 人 | 核心问题 | 最值得吸收的东西 |
|---|---|---|
| 虾哥 | 站点到底哪里出了问题，什么时候该改 | GSC + GA4 + 收入三层分工；7/28 天复盘；关键事件；样本阈值；先验数据可信度 |
| Niko | 独立开发早期怎么用 GA4，不被复杂功能拖死 | 少用“大厂屠龙刀”；重点找异常值；看流量质量而不是只看流量；Explore 才是深挖入口 |
| 王焱 | GA4 埋点具体应该怎么设计、怎么验收、怎么建报表 | 事件字典、参数白名单、固定枚举、耗时分桶、失败原因、三张表、14 个月保留、生产 host 过滤 |
| 哥飞 | 为什么要自建事件表，以及数据怎么变成 AI 的能力 | 自己记录 visitor→user→order；直接关联生成记录；MCP 给 Claude/Agent 读写后台，成为“决策中枢” |

---

# 2. 虾哥：先把“搜索、行为、收入”分开看

虾哥的方法最适合解决：

> **“我这个站到底该不该改？该改 SEO、产品、埋点还是收入链路？”**

他的核心结构是三层。

## 2.1 GSC：Google 有没有看到你

GSC 主要回答：

- 页面有没有 impressions；
- 用户搜什么 query；
- 哪个 page 在吃哪个 query；
- CTR、position 有没有机会。

重点不是只看 query，而是：

```text
page + query
```

因为同一个词可能落到不同页面。只看词、不看页面，很容易改错页面。

---

## 2.2 GA4：用户进来之后有没有操作

GA4 负责回答：

- 用户有没有真的访问；
- 从哪里来的；
- 看了什么页面；
- 有没有操作；
- 事件有没有真的到达；
- 漏斗在哪一步掉。

工具站只看 `page_view` 基本不够。

虾哥列出的典型业务事件包括：

```text
tool_submit
result_view
copy_result
upload_completed
generation_started
generation_result_view
download_result
login_complete
checkout_started
purchase
```

本质上就是：

> **访问 ≠ 使用；使用 ≠ 得到结果；得到结果 ≠ 商业转化。**

---

## 2.3 收入数据：看结果，不拿它当诊断工具

收入受很多因素影响：

- 国家结构；
- RPM；
- 支付链路；
- 广告状态；
- 商业意图；
- 设备结构；
- 平台限制。

所以判断顺序应该是：

```text
先看搜索
↓
再看行为
↓
最后看收入能不能归因
```

收入是**结果指标**，不是第一诊断层。

---

## 2.4 虾哥最重要的复盘节奏

不要每天打开后台看一眼然后焦虑。

更好的方式是给不同动作不同观察周期。

### 修埋点

```text
24–48 小时：看 Realtime / 标准报表是否有数据
7 天：看事件
14 天：看漏斗
```

### SEO 页面

```text
7–14 天：先看有没有曝光
28 天：再看点击与 query
45–60 天：看稳定性
```

### Title / Meta / H1

```text
7 天
14 天
28 天
```

不要同一批页面三天一改，否则后面无法知道到底哪个动作有效。

---

## 2.5 小站一定要有“样本意识”

虾哥给出的经验阈值非常适合小站：

| 指标 | 样本太小时怎么处理 |
|---|---|
| GSC impressions < 100 | 只看方向，不下强 SEO 结论 |
| GSC clicks < 10 | 不要用 CTR 涨跌判断页面好坏 |
| GA4 sessions < 30 | engagement 只当提示 |
| 业务事件 < 10 | 只判断埋点有没有到，不判断漏斗好坏 |
| 收入稳定数据 < 7 天 | 不做收入归因 |

这条非常重要：

> **小站最容易被百分比骗。**

1 个点击掉成 0，看起来是 -100%，实际上可能什么也说明不了。

---

# 3. Niko：GA4 不要学成“大厂流程”，要拿来找异常值

Niko 的出发点很适合独立开发者：

> 早期目标不是搞复杂流程，而是活下来、验证有人愿意买单。

他反对的是：

- 流量还很少就搞复杂 A/B Test；
- 数据量不足却模仿成熟公司的分析体系；
- 学很多产品方法论，却没有去和真实付费用户交流。

## 3.1 GA4 对小站真正要回答的两个问题

Niko 把复杂 GA4 简化成：

```text
来了谁？
他们值不值钱？
```

所有报表、漏斗、维度，本质都是这两个问题的不同切面。

---

## 3.2 为什么他觉得 Plausible 不够

他的实际痛点不是“有没有 PV”，而是想继续往下切：

- 哪个来源的用户质量最好；
- 哪个来源停留更长；
- 付费流量是不是精准；
- 不同国家表现；
- 不同设备表现；
- 用户路径；
- 漏斗；
- Landing Page；
- 多语言异常。

所以他的核心不是“GA4 比 Plausible 更高级”，而是：

> **当问题从“多少流量”升级成“这批流量到底怎么样”，需要能组合维度。**

Plausible 可以继续当简洁 Dashboard，但不能代替深层产品行为分析。

---

## 3.3 Niko 的核心方法：找异常值

不要把分析理解成：

```text
每天把所有表格看一遍
```

而是：

```text
先找到异常
↓
继续切维度
↓
验证假设
↓
找到 Bug / 流量机会 / 用户画像
```

比如：

- 某个渠道平均访问明显更长；
- 某语言页面停留异常；
- 某浏览器用户质量异常；
- Desktop 和 Mobile 差距异常。

异常不一定是“大矿”，也可能是“大坑”。

所以可以记一句：

> **异常值里不是坑，就是矿。**

---

# 4. 王焱：真正可复用的是“事件字典 + 参数规则 + 验收”

王焱这三篇最适合直接变成工程规范。

---

## 4.1 埋点之前先回答三个问题

### 问题 1：用户完成任务要经过哪几个步骤？

他的工具站抽象为：

```text
到达
→ 给素材
→ 处理
→ 拿到结果
→ 带走结果
```

对应 5 个事件：

```text
tool_start
file_selected
process_done
process_failed
export_success
```

重点不是照抄这五个名字，而是：

> **先把用户真正完成任务的路径画出来，再定义事件。**

---

### 问题 2：每一步会因为什么卡住？

不要只埋成功路径。

失败必须进入数据。

王焱把失败原因限制为固定枚举，例如：

```text
文件读不了
格式不支持
太大
页数超限
加密
没识别到内容
处理失败
导出失败
网络问题
用户取消
其他
```

为什么不能直接把报错文本传进去？

两个原因：

1. 可能包含文件名、隐私信息；
2. 每一个不同报错文本都会成为新的维度值，报表会彻底碎掉。

---

### 问题 3：以后想按什么维度切数据？

他的核心维度包括：

```text
tool
locale
surface
input_kind
duration_bucket
quality
format
reason
```

最值得抄的是三个基础参数：

```text
tool
locale
surface
```

其中：

- `tool`：功能名，不是 URL；
- `locale`：语言；
- `surface`：入口，例如首页工作区 / 工具落地页。

### 为什么 `tool` 不能直接用 URL？

同一个功能可能有多个 SEO Landing Page。

如果按 URL 统计：

```text
/image-compressor
/compress-to-200kb
/compress-to-500kb
```

数据会被切碎。

真正应该统计的是：

```text
tool = image_compress
```

---

# 5. 王焱：所有参数只能“枚举”或“分桶”

GA4 最忌讳高基数。

不应该传：

```text
原始耗时 2837ms
原始文件名
用户输入内容
邮箱
任意错误文本
原始 URL
```

应该变成：

```text
duration_bucket = 1_3s
file_count_bucket = 2_5
quality = ok / low
reason = provider_error / timeout / ...
```

王焱的耗时分桶思路尤其值得保留：

```text
<1s
1–3s
3–10s
10–30s
>30s
```

这不是数学等距，而是按用户真实感受切：

- 1 秒以内：瞬间；
- 3 秒左右：可接受；
- 10 秒：用户开始明显等待；
- 30 秒：很容易流失。

---

# 6. 王焱：必须有统一的 `track()` / `send()` 函数

不要让业务代码里到处直接写：

```js
gtag('event', ...)
```

应该统一经过一个发送层。

逻辑上是：

```text
event 是否在事件字典？
    ↓
不是 → 不发

参数是否在允许列表？
    ↓
不是 → 丢参数

参数值是否安全？
    ↓
不是 → 丢这个参数

事件本身仍然发
```

关键原则：

> **参数不合法，优先丢参数，不要把整个事件丢掉。**

否则漏斗中间会造出假的断崖。

---

# 7. 王焱：失败事件比成功事件更重要

如果只埋：

```text
开始
→ 选择素材
→ 导出成功
```

那么“选择素材后没导出”的用户可能有四种情况：

```text
处理失败
处理太慢放弃
处理成功但结果差
没找到下载按钮
```

但你的报表里看起来完全一样。

所以必须至少区分：

```text
process_done
process_failed
```

并进一步记录：

```text
process_done:
  quality = ok / low

process_failed:
  reason = 固定枚举
  duration_bucket = ...
```

这能区分两种完全不同的问题：

```text
根本跑不通
VS
跑得通，但结果不好
```

---

# 8. 王焱：三张最值得做的 GA4 表

## 8.1 表一：主漏斗

目标：

> 人到底在哪一步走的？

典型结构：

```text
开始
→ 选素材
→ 处理完成
→ 导出
```

要同时看：

```text
用户数
完成率
放弃率
所用时间
```

判断方式：

- 掉人多 + 耗时长 → 更像性能问题；
- 掉人多 + 耗时短 → 更像设计 / 交互 / 意图问题。

### 一个很重要的坑

**时间窗不能跨越埋点变更日。**

如果旧版只有：

```text
start
file_selected
```

新版才新增：

```text
process_done
```

你拿过去 28 天直接做漏斗，会看到一个巨大的假断崖。

---

## 8.2 表二：失败解剖

配置：

```text
筛选：
event_name = process_failed

行：
tool + reason

列：
duration_bucket

值：
event_count
```

这张表把失败拆成两类：

### 产品的错

```text
render_failed
export_failed
decode_failed
provider_error
```

→ 改代码 / 后端 / Provider。

### 用户输入不符合约束

```text
unsupported_type
too_large
page_limit
```

→ 应该把提示前置。

不要把“用户带错东西”误判成“产品功能坏了”。

---

## 8.3 表三：语言 × 入口

配置：

```text
筛选：
tool_start

行：
locale

列：
surface

值：
event_count
```

它回答：

```text
谁在用？
从哪里进？
```

两种入口意图完全不同：

### Landing Page

用户搜了具体任务进来。

如果不转化：

```text
可能是页面没有承接住搜索意图
```

### 首页工作区

用户在站内逛，然后随手试。

如果不转化：

```text
可能是产品本身难用
```

这两个流量不能混着算。

---

# 9. 王焱：GA4 后台几个必须改的地方

## 9.1 Event Data Retention 改成 14 个月

Explore 用到的事件数据默认保留时间有限。

如果以后要看长期趋势：

```text
管理
→ 数据收集和修改
→ 数据保留
→ 14 个月
```

---

## 9.2 正式分析必须过滤生产 Host

预览环境、本地环境、其它项目都可能污染数据。

建议：

```text
hostName = 正式域名
```

尤其对你这种 Vercel / 多站项目非常重要。

---

## 9.3 Stripe / Paddle 等收银台要处理 Referral

用户：

```text
Google
→ 你的网站
→ checkout.stripe.com
→ 付款
→ 回站
```

如果不处理 referral，付款后 GA4 可能把来源记成：

```text
stripe.com / referral
```

最后最重要的付费用户，真实获客来源反而被覆盖。

---

## 9.4 自定义维度必须尽早注册

事件参数发到 GA4 后，不代表能马上拿来当报表维度。

像：

```text
tool
locale
surface
model
plan
error_type
quality
duration_bucket
```

都应该注册成 Event-scoped custom dimensions。

而且：

> **GA4 不回填。**

所以埋点上线当天就应该注册。

---

# 10. 王焱：`(not set)` 不是垃圾，它是覆盖率报警器

如果一个维度大量出现：

```text
(not set)
```

不要直接忽略。

可能是：

```text
旧版本事件没带参数
某些页面绕过了统一 track()
某些埋点调用没按事件字典走
```

刚上线初期因为历史数据产生 `(not set)` 很正常。

但随着时间窗口往后滚：

```text
(not set)
```

应该越来越少。

如果一周以后仍然很高：

> 很可能还有页面没接统一埋点。

---

# 11. 王焱：埋点本身也需要测试

不要只验证：

```text
页面打开正常
```

要验证：

```text
这个页面真的会触发事件吗？
```

王焱甚至通过埋点验收发现了：

```text
页面能打开
SEO 正常
但客户端 JS 早就崩了
真实用户完全无法使用
```

这种问题搜索引擎和普通 uptime 监控都不一定能发现。

所以需要：

```text
功能页必须有对应埋点
↓
做自动测试
↓
故意删一个埋点
↓
确认测试真的会失败
↓
再恢复
```

一个永远绿的测试没有意义。

---

# 12. Cookie Consent：不能为了数据违背用户选择

如果用户还没有同意 Cookie：

```text
事件暂存
```

用户同意之后：

```text
按顺序补发
```

但：

```text
明确拒绝
```

以后必须：

```text
清空暂存
停止继续保存
```

不能发生：

```text
拒绝
→ 使用产品
→ 后来改成接受
→ 把拒绝期间的历史活动全部补发
```

这不是数据准确问题，而是用户意愿问题。

---

# 13. 哥飞：为什么要自己建事件表

根据你转述的哥飞分享，他的核心逻辑是：

第三方埋点当然能做漏斗。

但自己建事件表有三个巨大优势。

## 13.1 AI 改代码、加上报非常快

对 AI Coding 来说：

```text
新增数据库表
新增 track()
在关键节点插入事件
```

其实并不难。

所以自建数据层的成本已经比过去低很多。

---

## 13.2 可以直接关联真实业务数据

第三方平台更擅长：

```text
聚合行为
漏斗
渠道
页面
```

自己的数据库可以天然 JOIN：

```text
visitor
user
generation
credit
order
subscription
payment
```

于是你可以回答：

```text
这个匿名用户第一次从哪个页面来？
生成过几次？
用了哪个模型？
生成成功率多少？
什么时候注册？
什么时候看 pricing？
有没有 checkout？
最后买了哪个 plan？
付款前用掉了多少积分？
```

这是哥飞认为“自己统计、自己关联用户、自己关联订单”很有价值的地方。

---

## 13.3 AI 可以直接读业务事实，再改代码

最重要的一层是：

```text
AI 基于经验写代码
VS
AI 基于真实漏斗数据优化代码
```

后者更有意义。

例如：

```text
Landing View       1000
tool_start          600
generation_start    430
generation_success  360
login_complete      100
pricing_view         50
checkout_started     18
purchase              7
```

AI 不需要泛泛说：

> 优化用户体验。

它可以先定位：

```text
generation_success → login_complete
掉得最多
```

再去看：

```text
Auth Modal
登录流程
状态有没有保留
登录之后是否要重新上传
```

然后提出针对性改法。

---

# 14. 哥飞：MCP 是“手”，事件数据库是“眼睛”

哥飞之前分享的另一个方法：

```text
给网站后台做 MCP
↓
Claude 连接 MCP
↓
读取后台任务
↓
写页面 / 写文章
↓
通过 MCP 写回后台
↓
发布
```

这解决的是：

> **AI 怎么操作你的业务系统。**

而自建事件表解决的是：

> **AI 凭什么做判断。**

两者组合：

```text
数据
↓
AI 判断
↓
MCP 执行
↓
新数据
↓
再次判断
```

最终才接近真正的：

> **决策中枢。**

---

# 15. 四个人综合后的最佳架构

下面这部分是综合方案，不是任何一个作者原文。

## 15.1 GSC 不替代

GSC 继续负责：

```text
page
query
impressions
clicks
CTR
position
country
device
```

它回答：

> Google 给了我什么搜索机会？

---

## 15.2 GA4 不替代

GA4 负责：

```text
source / medium
landing page
country
device
locale
event
funnel
engagement
```

它回答：

> 这些人从哪里来？进来之后发生了什么？

---

## 15.3 自建 Events 做业务事实层

数据库负责：

```text
anonymous visitor
user
session
generation
credit
order
subscription
payment
```

它回答：

> 这个具体用户真正做过什么，最终是否形成业务价值？

---

## 15.4 Stripe / 业务数据库是收入真值

GA4 的 `purchase` 是分析信号。

真正付款成功应该以：

```text
Stripe / Payment Webhook
```

以及自己订单表为准。

---

# 16. 最适合 AI 视频站的一套事件字典

不要照搬文件工具的事件。

AI Video SaaS 可以先冻结下面这些：

| Event | 触发时机 |
|---|---|
| `tool_start` | 用户真正开始操作生成器 |
| `upload_completed` | Image-to-Video 素材上传成功 |
| `generation_started` | 真正创建生成任务 |
| `generation_succeeded` | 后端任务成功 |
| `generation_failed` | 后端任务失败 |
| `result_view` | 用户真正看到结果 |
| `download_result` | 下载生成结果 |
| `login_complete` | 登录 / 注册完成 |
| `pricing_view` | 进入 Pricing / 看到付费入口 |
| `checkout_started` | 创建 / 进入 Checkout |
| `purchase` | 付款成功 |

第一版不要继续加几十个 CTA Click。

先保证主链路完整。

---

# 17. AI 视频站公共参数

所有业务事件尽量统一带：

```text
tool
model
locale
surface
auth_state
plan
```

示例：

```text
tool = text_to_video
model = minimax_h3
locale = en
surface = tool_page
auth_state = anonymous
plan = free
```

特殊事件再增加：

### generation_failed

```text
error_type
duration_bucket
```

### generation_succeeded

```text
duration_bucket
result_type
```

### purchase / checkout

```text
plan
```

---

# 18. GA4 里不要传什么

GA4 不应该传：

```text
prompt 原文
用户输入原文
邮箱
user_id
order_id
generation_id
文件名
图片 URL
视频 URL
完整错误栈
原始金额
任意自由文本
```

GA4 只传：

```text
固定枚举
分桶值
低基数维度
```

例如：

```text
error_type =
  validation_error
  upload_error
  provider_error
  timeout
  quota_limit
  moderation_blocked
  payment_error
  unknown
```

---

# 19. 自建 Events 表可以更完整

自建数据库不需要受到 GA4 低基数限制。

建议最小结构：

```sql
events

id
event_name
event_time

anonymous_id
user_id
session_id

page_path
referrer

tool
model
locale
surface

generation_id
order_id

properties_json
```

核心原则：

> **GA4 存分析维度；数据库存业务关系。**

---

# 20. 最关键的工程设计：同一事件“双写”

不要做：

```text
GA4 一套事件
数据库另一套事件
```

应该只维护一个业务事件定义：

```text
track(event, properties)
```

内部再分发：

```text
track()
├── sendToGA4(safe_low_cardinality_properties)
└── sendToDatabase(full_internal_context)
```

这样以后：

- 改一个事件字典即可；
- GA4 和 DB 名称不会漂移；
- AI Agent 读数据时不用先做映射；
- 多站复制也容易。

---

# 21. AI 视频站应该做的三张 GA4 表

## 表一：产品主漏斗

```text
tool_start
→ generation_started
→ generation_succeeded
→ result_view
→ download_result
```

细分：

```text
tool
model
locale
surface
```

重点同时看：

```text
转化率
放弃率
所用时间
```

---

## 表二：失败解剖

```text
筛选：
generation_failed

行：
tool + error_type

列：
duration_bucket

值：
event_count
```

用来判断：

```text
代码 / Provider 问题
VS
用户输入问题
VS
配额 / 审核问题
```

---

## 表三：商业漏斗

```text
result_view
→ login_complete
→ pricing_view
→ checkout_started
→ purchase
```

细分：

```text
source / medium
landing page
tool
model
locale
```

以后投广告时，这张表尤其关键。

---

# 22. 埋点上线的验收标准

**“代码写完”不等于“埋点完成”。**

必须真实跑一次：

```text
打开站点
↓
开始生成
↓
任务成功
↓
看到结果
↓
登录
↓
Pricing
↓
Checkout
↓
付款测试
```

同时检查四层：

## 浏览器

```text
统计脚本是否加载
网络请求是否真的发出
```

## GA4

```text
DebugView 能否实时看到事件
参数是否正确
host 是否正确
```

## 自建 DB

```text
events 是否插入
anonymous_id 是否存在
登录后能否关联 user_id
generation_id 是否关联正确
```

## 支付

```text
purchase 是否来自真实 webhook / 订单状态
```

另外必须故意制造一次：

```text
generation_failed
```

确认失败路径也进数据。

---

# 23. 今天做完以后，不要马上下结论

埋点刚上线，最先要确认的是：

```text
有没有收到
数据对不对
覆盖全不全
```

不是马上判断产品。

第一阶段：

```text
业务事件 < 10
→ 只判断事件是否正常到达
```

等样本再看漏斗。

---

# 24. 以后给 AI Agent / MCP 暴露哪些能力

当 Events 稳定后，可以让 MCP 提供：

```text
get_funnel()
get_page_performance()
get_generation_failures()
get_revenue_summary()
get_user_journey()

get_gsc_queries()
get_gsc_pages()
```

再保留执行能力：

```text
list_tasks()
create_page()
update_page()
publish_page()
```

于是可以形成：

```text
Agent:
最近 7 天哪个页面掉得最厉害？

MCP:
返回漏斗 + GSC + 订单数据

Agent:
判断最大问题
→ 找对应页面 / 代码
→ 生成修改方案
→ 创建任务
→ 修改
→ 发布

7 天后:
再次读取数据
→ 比较变化
```

这才是真正的数据驱动 Agent。

---

# 25. Plausible、GA4、自建 Events 到底怎么分工

综合四个人以后，可以这样定：

| 工具 | 最合适的职责 |
|---|---|
| Plausible | 简洁流量 Dashboard，可选 |
| GSC | SEO 搜索真值，必须 |
| GA4 | 流量质量、维度组合、漏斗、Explore |
| 自建 Events | 用户 / 生成 / 订单 / 支付全链路事实 |
| Stripe / DB | 付款与订单真值 |
| MCP / Agent | 读取、判断、执行、复盘 |

所以不是：

```text
Plausible VS GA4
```

也不是：

```text
GA4 VS 自建埋点
```

而是：

```text
GSC + GA4 + 自建 Events + 业务 DB
                     ↓
                 AI Agent
```

---

# 26. 最后浓缩成 10 条原则

1. **先画用户主路径，再写事件。**
2. **只埋成功路径等于没有真正做漏斗。**
3. **Event Name 和参数必须有字典，不能 AI 想到什么就加什么。**
4. **GA4 参数只用固定枚举和分桶，避免高基数。**
5. **所有事件统一走一个 `track()`，不要散落 `gtag()`。**
6. **GA4 看聚合行为，自建 DB 看具体业务关系。**
7. **GSC 看“Google 给了什么机会”，不要拿 GA4 代替 GSC。**
8. **小样本先验数据正确，不要急着优化产品。**
9. **AI Agent 最有价值的不是写代码，而是“基于真实漏斗写代码”。**
10. **最终目标不是 Dashboard，而是：数据 → 判断 → 执行 → 新数据。**

---

# 27. 对当前 AI 视频站的最小实施版本

如果只允许做一版，不做过度设计：

```text
必须：
GSC
GA4
events 表
统一 track()
10–11 个核心事件
3 张 GA4 Explore 表
Stripe / Order 真值关联

暂时不做：
Mixpanel
PostHog
复杂 BI
A/B Test 平台
几十个按钮点击事件
复杂用户画像系统
```

先把最关键的闭环做通：

```text
流量来了吗
↓
用户开始用了吗
↓
生成成功了吗
↓
用户看到结果了吗
↓
注册了吗
↓
看价格了吗
↓
Checkout 了吗
↓
付钱了吗
```

只要这条链路的数据是可信的，就已经足够开始真正的数据驱动增长。

---

# 资料来源

- 虾哥 / 浅滩小虾米：《一篇文章讲透：我是怎么用 GSC + GA4 + AI Agent，把两个暴跌小站救回来的》
- Niko：《独立开发者的 GA4 实战：别用大厂的屠龙刀削苹果》
- 王焱：
  - 《GA4 上给产品埋点要怎么操作》
  - 《我想去 GA4 上看看用户在我的工具站里到体验到底如何？》
  - 《GA4 三张表照做手册：报表长什么样，能看出什么》
- 哥飞：根据你在本次对话中转述的两次分享：
  - 自建事件表，关联访客 / 用户 / 生成 / 订单 / 支付，再交给 AI 分析
  - 给网站后台做 MCP，让 Claude / Agent 能读取任务并把页面、文章等结果写回后台

> 注：以上“综合架构、AI 视频事件字典、自建 Events 表结构、GA4 + DB 双写方案”是基于这些材料做的归纳和落地设计，不代表任何一位作者的原文方案。
