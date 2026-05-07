# Video 生成器改造方案

> 本文只保留一个最终方案。
> 参考 `修改image生成器.md` 的成功改造思路，但不会机械照搬 image 的模型归并规则。
> 旧的“直接展示 provider 下的模型项”的做法在 video 生成器里同样不再作为最终方向。

---

## 一句话结论

用户只选择**视频模型家族**，不选择 provider。

provider 只作为系统内部的执行候选链路存在：前端根据当前场景、已配置 key、模型家族和预设顺序生成候选列表，后端按顺序尝试，哪个先成功创建任务就用哪个，并把实际命中的 `provider + model` 落库。

但 video 与 image 有一个关键差异：

**video 的 family 边界必须更保守，不能只因为 label 相似就强行归并。**

也就是说：

- `Sora 2 Pro` 可以作为一个 family
- `Sora 2` 和 `Sora 2 Pro` 不建议默认归为同一个 family
- `Veo 3` 和 `Veo 3.1` 不建议默认归为同一个 family
- 只有真正能被用户理解为“同一个视频模型 / 同一代模型能力”的候选项，才放进同一个 family

最终目标是：

- 用户不需要理解 provider
- UI 不再暴露 provider 下拉
- 同一个视频模型不会因为 provider 不同被重复展示
- 可以自然支持创建任务阶段的 provider fallback
- 不会因为过度归并导致用户选了一个模型，却得到另一个模型语义的结果

---

## 为什么不再采用旧方案

旧方案的问题不只是“多一个 Provider 下拉”。

更本质的问题是：它把用户选择对象定义成了“某个 provider 上的某个部署项”，而不是“用户理解中的视频模型”。

这会带来几个问题：

- **交互负担**：用户要先选 provider，再选 model，但大多数用户并不关心 provider
- **状态复杂**：`provider + model` 双状态需要在初始化、tab 切换、provider 切换、model 切换时不断同步
- **兜底缺失**：如果某个 provider 创建任务失败，旧结构天然只能失败，不能自动尝试同族候选
- **心智不一致**：provider 本来是后台执行策略，却被暴露成了用户必须理解的 UI 状态
- **后续 UI 受限**：如果以后做成 Pollo / NanoBanana 类似的统一输入框，provider 下拉会显得很突兀

所以这次不再讨论“继续保留 Provider Select，只优化默认值”。

Provider Select 本质上仍然是在把后台执行细节交给用户选择，不符合这次改造目标。

---

## 最终方案

### 核心思想

把当前 `MODEL_OPTIONS` 中的每一条，从“用户可见模型项”降级为“系统内部候选项”。

真正给用户看的选项是去重后的**视频模型家族**。

用户选中一个视频模型家族后，系统内部再根据：

- 当前场景（`text-to-video` / `image-to-video` / `video-to-video`）
- 当前可用 provider（是否配了 key）
- family
- 数组顺序表达的优先级

计算出一条候选链路。

例如未来如果同一个 family 同时有多个 provider 可用，可以得到：

```ts
[
  { provider: 'kie', model: 'sora-2-pro-text-to-video' },
  { provider: 'replicate', model: 'openai/sora-2-pro' },
]
```

后端按顺序尝试，谁先成功创建任务就用谁。

需要注意：上面只是说明结构，不代表当前一定已经有 `replicate/openai/sora-2-pro` 这个可用模型项。

---

## 改造原则

1. **用户选择视频模型，不选择 provider**

2. **模型家族才是 UI 层单一真相**

3. **provider 是执行策略，不是 UI 状态**

4. **fallback 只做在“创建任务”阶段**

5. **同一 family 下的数组顺序就是 fallback 优先级，不新增 `priority` 字段**

6. **video 的 family 边界要保守，不做跨模型降级 fallback**

7. **不引入 Registry / Resolver / Builder 等额外抽象层**

这里指 `ModelRegistry` / `CandidateResolver` / `TaskBuilder` 这一类把模型项查询、候选链路计算、provider 调度抽成独立类或服务的做法。当前模型项规模很小，直接在 `video.tsx` 里用 `useMemo` 派生即可，与 image 保持一致。

8. **入口 UI 后续可以统一，但 image / video 的生成逻辑不要强行合并成一个大组件**

9. **v1 只做必要改动，不顺手重构 image、provider adapter 或共享抽象**

第一阶段只把 video 从 `provider + model` 双状态迁移到 `family + candidates`，并把 `/api/ai/generate` 的 candidates fallback 从 image 扩展到 video。除此之外不借机做共享目录整理、adapter 重写、统一 composer、数据库字段调整等工作。

---

## 现状问题

当前 `src/shared/blocks/generator/video.tsx` 中的 `MODEL_OPTIONS`，实际表达的是“provider 上的具体部署项”：

```ts
const MODEL_OPTIONS = [
  // Replicate models
  {
    value: 'google/veo-3.1',
    label: 'Veo 3.1',
    provider: 'replicate',
    scenes: ['text-to-video', 'image-to-video'],
  },
  {
    value: 'openai/sora-2',
    label: 'Sora 2',
    provider: 'replicate',
    scenes: ['text-to-video', 'image-to-video'],
  },
  // Fal models
  {
    value: 'fal-ai/veo3',
    label: 'Veo 3',
    provider: 'fal',
    scenes: ['text-to-video'],
  },
  {
    value: 'fal-ai/wan-pro/image-to-video',
    label: 'Wan Pro',
    provider: 'fal',
    scenes: ['image-to-video'],
  },
  {
    value: 'fal-ai/kling-video/o1/video-to-video/edit',
    label: 'Kling Video O1',
    provider: 'fal',
    scenes: ['video-to-video'],
  },
  // Kie models
  {
    value: 'sora-2-pro-image-to-video',
    label: 'Sora 2 Pro',
    provider: 'kie',
    scenes: ['image-to-video'],
  },
  {
    value: 'sora-2-pro-text-to-video',
    label: 'Sora 2 Pro',
    provider: 'kie',
    scenes: ['text-to-video'],
  },
];
```

这份结构对系统执行是够用的，但对 UI 不够。

因为它缺少一个真正的业务概念：

- `Sora 2 Pro` 这个“视频模型家族”
- `Veo 3.1` 这个“视频模型家族”
- `Wan Pro` 这个“视频模型家族”

当前代码还维护了：

- `provider` state
- `model` state
- `PROVIDER_OPTIONS`
- `handleProviderChange`
- `handleTabChange` 中的 model 同步逻辑

这些逻辑本质上都是为了维护 provider-specific model 的选择关系。

如果最终目标是“用户只选视频模型，系统自动兜底”，这些状态就不应该继续作为 UI 主状态存在。

---

## 唯一值得新增的字段

本次建议新增一个字段：`family`

```ts
interface VideoModelOption {
  family: string;
  value: string;
  label: string;
  provider: string;
  scenes: VideoGeneratorTab[];
}
```

`family` 只作为业务层 key 使用，不会出现在 URL，也不会传给 provider；它可以随 `/api/ai/generate` 请求传给后端，用于日志、排查和候选链路诊断。建议统一使用 lowercase + kebab-case，例如 `sora-2-pro` / `veo-3-1`。`Veo 3.1` 的展示文本仍然放在 `label`，但 family 不建议写成 `veo-3.1`，点号在搜索、过滤和未来日志聚合里都更容易踩坑。

当前模型项建议先改成：

```ts
const MODEL_OPTIONS: VideoModelOption[] = [
  {
    family: 'veo-3-1',
    value: 'google/veo-3.1',
    label: 'Veo 3.1',
    provider: 'replicate',
    scenes: ['text-to-video', 'image-to-video'],
  },
  {
    family: 'sora-2',
    value: 'openai/sora-2',
    label: 'Sora 2',
    provider: 'replicate',
    scenes: ['text-to-video', 'image-to-video'],
  },
  {
    family: 'veo-3',
    value: 'fal-ai/veo3',
    label: 'Veo 3',
    provider: 'fal',
    scenes: ['text-to-video'],
  },
  {
    family: 'wan-pro',
    value: 'fal-ai/wan-pro/image-to-video',
    label: 'Wan Pro',
    provider: 'fal',
    scenes: ['image-to-video'],
  },
  {
    family: 'kling-video-o1',
    value: 'fal-ai/kling-video/o1/video-to-video/edit',
    label: 'Kling Video O1',
    provider: 'fal',
    scenes: ['video-to-video'],
  },
  {
    family: 'sora-2-pro',
    value: 'sora-2-pro-image-to-video',
    label: 'Sora 2 Pro',
    provider: 'kie',
    scenes: ['image-to-video'],
  },
  {
    family: 'sora-2-pro',
    value: 'sora-2-pro-text-to-video',
    label: 'Sora 2 Pro',
    provider: 'kie',
    scenes: ['text-to-video'],
  },
];
```

这里最重要的是：

- `sora-2-pro-image-to-video`
- `sora-2-pro-text-to-video`

虽然是两个 provider-specific model value，但它们对用户来说是同一个 `Sora 2 Pro` family 在不同场景下的部署项。

而：

- `openai/sora-2`
- `sora-2-pro-*`

不建议默认放进同一个 family。

---

## Video family 边界怎么定

### 当前结论

video 的 family 不要只按 label 或相似名称归并。

判断标准应当是：

> 如果用户选择了这个 family，fallback 到同 family 下任意 candidate，用户仍然会认为“我选择的还是同一个模型能力”。

### 可以归为同一 family 的情况

例如：

```ts
{
  family: 'sora-2-pro',
  value: 'sora-2-pro-text-to-video',
  label: 'Sora 2 Pro',
  provider: 'kie',
  scenes: ['text-to-video'],
},
{
  family: 'sora-2-pro',
  value: 'sora-2-pro-image-to-video',
  label: 'Sora 2 Pro',
  provider: 'kie',
  scenes: ['image-to-video'],
}
```

它们属于同一个 family，但任一时刻（`activeTab` 固定），`candidates` 链路只包含与当前 scene 匹配的 candidate。`sora-2-pro-text-to-video` 与 `sora-2-pro-image-to-video` 不会出现在同一次生成请求里；scene 切换时链路重新派生。

### 不建议归为同一 family 的情况

以下情况暂时不建议归并：

- `Sora 2` 和 `Sora 2 Pro`
- `Veo 3` 和 `Veo 3.1`
- `Wan Pro` 和其他通用 image-to-video 模型
- `Kling Video O1` 和其他 video-to-video 模型

原因是 video 模型之间的质量、成本、时长、参数支持、输入约束差异更明显。

强行归并会导致用户选择心智和实际生成结果不一致。

### 不做跨模型降级 fallback

本次不做：

```ts
Sora 2 Pro 失败 -> 自动降级到 Sora 2
Veo 3.1 失败 -> 自动降级到 Veo 3
Kling O1 失败 -> 自动换成 Wan Pro
```

这类逻辑可以叫“降级策略”，但不属于本次 provider fallback。

如果未来真要做，可以另加 `fallbackGroup` 或后台策略配置。

当前阶段不要混进来。

---

## 优先级怎么定

### 当前结论

先不加 `priority` 字段。

**同一 `family` 下的数组顺序，就是 fallback 优先级。**

例如未来如果存在多个 `sora-2-pro` candidate：

```ts
[
  { family: 'sora-2-pro', provider: 'kie', value: 'sora-2-pro-text-to-video', ... },
  { family: 'sora-2-pro', provider: 'replicate', value: 'openai/sora-2-pro', ... },
]
```

表示：

1. 先试 `kie`
2. 再试 `replicate`

### 为什么这样做

- 当前 video 模型项数量不多
- 优先级只在少数同族候选之间有意义
- 数组顺序足够直观
- 和 image 生成器保持一致
- 后续要调整，直接调换数组顺序即可

只有当未来出现以下情况时，才值得升级为显式 `priority` 字段：

- video 模型条目明显膨胀
- 不同环境需要不同优先级
- 优先级需要后台配置
- 要做“降级 fallback”而不只是 provider fallback

在当前阶段，加 `priority` 是过度设计。

---

## 前端方案

### 1. 状态收口

不再维护独立的 `provider` state。

不再维护“provider + model 双状态同步”。

只保留一个用户选择状态：

```ts
const [selectedFamily, setSelectedFamily] = useState('');
```

然后从 `selectedFamily + activeTab + availableProviders` 派生出：

- `availableModelOptions`
- `availableFamilyOptions`
- `selectedCandidates`
- 实际提交给后端的候选链路

这样做之后，UI 层不再有 provider/model 同步问题。

原有这些内容在新方案里都不再承担业务职责：

- `PROVIDER_OPTIONS`
- `handleProviderChange`
- 独立 `provider` state
- 独立 `model` state
- `handleTabChange` 里根据 provider 手动同步 model 的逻辑

如果希望保守改动，可以先注释，不急着删除。

`dedupeModelFamilies` 已经在 image 生成器里存在。为了让 v1 改动更小、更好回滚，video 改造时建议先在 `video.tsx` 内本地新增同等纯函数，不急着抽到共享 `_helpers.ts`。等 image/video 两边都稳定后，如果确实出现维护成本，再单独做一次很小的 helper 抽取。

### 2. 获取当前可用 provider

video 生成器也应该像 image 生成器一样，在组件挂载时请求：

```ts
fetch('/api/ai/providers')
```

并维护：

```ts
const [availableProviders, setAvailableProviders] = useState<string[]>([]);
const [isLoadingProviders, setIsLoadingProviders] = useState(true);
```

`/api/ai/providers` 返回的是“全局已配置 key 的 provider 集合”，与 `mediaType` 无关。video 前端通过 `MODEL_OPTIONS.scenes + MODEL_OPTIONS.provider` 与它求交集，自然只剩下 video 真正可用的候选，不需要让接口区分 `mediaType`。

这条与“明确不做的事 / 不让 `/api/ai/providers` 返回 model 级可用性”一致。

### 3. 下拉展示去重后的视频模型家族

前端根据当前场景和可用 provider，先筛出可选候选项，再按 `family` 去重，得到真正展示给用户的列表。

推荐派生关系是：

```ts
const availableModelOptions = useMemo(
  () =>
    MODEL_OPTIONS.filter(
      (option) =>
        option.scenes.includes(activeTab) &&
        availableProviders.includes(option.provider)
    ),
  [activeTab, availableProviders]
);

const availableFamilyOptions = useMemo(
  () => dedupeModelFamilies(availableModelOptions),
  [availableModelOptions]
);

const selectedCandidates = useMemo(
  () =>
    availableModelOptions.filter(
      (option) => option.family === selectedFamily
    ),
  [availableModelOptions, selectedFamily]
);

const hasAvailableFamilies = availableFamilyOptions.length > 0;
const canGenerateForModelSelection =
  !isLoadingProviders &&
  hasAvailableFamilies &&
  selectedCandidates.length > 0;
```

这里的 `canGenerateForModelSelection` 只是**模型配置层面的可生成条件**。

它不是最终按钮可点击条件。

真正的按钮是否可点击，还需要叠加现有业务校验，例如：

- 用户是否已登录
- 是否正在生成中
- 提示词是否超长
- 积分是否足够
- `text-to-video` 下 prompt 是否为空
- `image-to-video` 下参考图是否已上传
- `video-to-video` 下参考视频 URL 是否已填写
- 参考图是否仍在上传中
- 参考图是否上传失败

### 4. family 自动回退

当当前 `selectedFamily` 在新场景下不可用时，自动回退到第一个合法 family。

这件事应该收口在一个带保护条件的 `useEffect` 中，不要散落到 `handleTabChange`、初始化回调、provider 加载回调等多个入口。

推荐写法：

```ts
useEffect(() => {
  if (availableFamilyOptions.length === 0) {
    if (selectedFamily) {
      setSelectedFamily('');
    }
    return;
  }

  const hasCurrentFamily = availableFamilyOptions.some(
    (option) => option.family === selectedFamily
  );

  if (!hasCurrentFamily) {
    setSelectedFamily(availableFamilyOptions[0].family);
  }
}, [availableFamilyOptions, selectedFamily]);
```

这样可以避免再次回到“多出口手动同步”的旧模式。

实现时要保证 `availableFamilyOptions` 这类派生值稳定，建议始终通过 `useMemo` 从 `availableModelOptions` 派生，不要在 `useEffect` 依赖里临时创建新数组。否则容易触发无意义重复渲染，甚至让回退逻辑变得难排查。

`dedupeModelFamilies` 必须保留 `MODEL_OPTIONS` 中 family 首次出现的顺序，不要排序或重排。数组顺序同时承载默认展示顺序和 fallback 优先级，去重只能删除重复项，不能改变顺序。

### 5. Loading 态 UI

`isLoadingProviders=true` 时：

- Model `<Select>` 显示 `Loading...`
- Model `<Select>` disabled
- 生成按钮置灰
- 不显示错误文案

这可以避免 provider 列表加载完成前，用户短暂看到 `No models` 的错觉。

### 6. 无可用模型时的 UI 行为

如果当前场景下没有任何合法可用模型：

- Model 下拉应 disabled
- 生成按钮应置灰
- 页面应给出明确提示

建议提示文案：

- `Please contact the administrator to configure AI video models.`
- `No video models are available for the current generation mode.`

不要只写成“只要 `availableProviders` 为空就禁用”。

更准确的是：

- `availableProviders.length === 0`：当前系统没有任何已配置 provider
- `availableProviders.length > 0` 但 `availableFamilyOptions.length === 0`：当前场景没有合法 video family
- `selectedCandidates.length === 0`：当前选择不可用，应自动回退；如果仍为空，作为最后保险禁用生成

### 7. Tab 切换只切场景，不再同步 provider/model

`handleTabChange` 只负责：

- `setActiveTab(...)`
- `setCostCredits(...)`

例如：

```ts
const handleTabChange = (value: string) => {
  const tab = value as VideoGeneratorTab;
  setActiveTab(tab);

  if (tab === 'text-to-video') {
    setCostCredits(textToVideoCredits);
  } else if (tab === 'image-to-video') {
    setCostCredits(imageToVideoCredits);
  } else if (tab === 'video-to-video') {
    setCostCredits(videoToVideoCredits);
  }
};
```

当前 family 在新 tab 下是否可用，由前面的自动回退 `useEffect` 统一处理。

切换 tab 时不清理 `prompt / referenceImageUrls / referenceVideoUrl`，保留用户已输入内容。`handleTabChange` 仍只处理 `activeTab + costCredits`，与 image 现有策略一致。

### 8. `handleGenerate` 校验顺序与 image 对齐

video 改造后的 `handleGenerate` 建议把校验顺序调整为：

1. 模型层：`isLoadingProviders` / `hasAvailableFamilies` / `selectedCandidates.length`
2. 用户态：登录状态 / 积分
3. 输入态：prompt / 参考图 / 参考视频 / 上传状态 / prompt 超长

也就是先判断当前场景是否真的有可用 family，再触发登录、积分、输入类校验。否则会出现用户已经上传参考图、通过了登录态校验，但当前场景根本没有可用模型的反直觉交互。

示例：

```ts
const handleGenerate = async () => {
  if (isLoadingProviders) {
    return;
  }

  if (!hasAvailableFamilies || selectedCandidates.length === 0) {
    toast.error('No video models are available for the current generation mode.');
    return;
  }

  if (!user) {
    setIsShowSignModal(true);
    return;
  }

  if (remainingCredits < costCredits) {
    toast.error('Insufficient credits. Please top up to keep creating.');
    return;
  }

  const trimmedPrompt = prompt.trim();
  const trimmedReferenceVideoUrl = referenceVideoUrl.trim();

  if (!trimmedPrompt && isTextToVideoMode) {
    toast.error('Please enter a prompt before generating.');
    return;
  }

  if (isPromptTooLong) {
    toast.error('Prompt is too long.');
    return;
  }

  if (isReferenceUploading) {
    toast.error('Please wait for the reference image upload to finish.');
    return;
  }

  if (hasReferenceUploadError) {
    toast.error('Please remove failed reference images before generating.');
    return;
  }

  if (isImageToVideoMode && referenceImageUrls.length === 0) {
    toast.error('Please upload a reference image before generating.');
    return;
  }

  if (isVideoToVideoMode && !trimmedReferenceVideoUrl) {
    toast.error('Please provide a reference video URL before generating.');
    return;
  }

  // create task...
};
```

### 9. 提交时发送候选链路

前端不再只发单个：

```ts
{ provider, model }
```

而是发：

```ts
{
  mediaType: AIMediaType.VIDEO,
  scene: activeTab,
  family: selectedFamily,
  candidates: selectedCandidates.map((candidate) => ({
    provider: candidate.provider,
    model: candidate.value,
  })),
  prompt: trimmedPrompt,
  options,
}
```

`candidates` 已经按优先级排好。

需要特别强调：`selectedCandidates` 的派生逻辑**不能只按 `family` 过滤**。

必须同时满足：

- `family`
- 当前 `scene`
- `availableProviders.includes(option.provider)`

也就是：

```ts
const selectedCandidates = MODEL_OPTIONS.filter(
  (option) =>
    option.family === selectedFamily &&
    option.scenes.includes(activeTab) &&
    availableProviders.includes(option.provider)
);
```

或者先算：

```ts
const availableModelOptions = MODEL_OPTIONS.filter(
  (option) =>
    option.scenes.includes(activeTab) &&
    availableProviders.includes(option.provider)
);
```

再做：

```ts
const selectedCandidates = availableModelOptions.filter(
  (option) => option.family === selectedFamily
);
```

这两种写法等价，前提是 `availableModelOptions` 已经先按 `scene + availableProviders` 过滤。

这条是硬约束，不是优化项。

原因是 video 里同一个 family 可能在不同 scene 下对应不同 model value，例如：

- `text-to-video` -> `sora-2-pro-text-to-video`
- `image-to-video` -> `sora-2-pro-image-to-video`

如果只按 `family` 过滤，不按 `scene` 过滤，就可能把错误场景的 model 混进候选链路。

即使 `selectedCandidates.length === 1`，前端仍然按 `candidates: [...]` 形式发送，不要降级为单 `provider + model`。原因是后端走 fallback 路径还是旧路径只看 `candidates?.length`，混合两种发送形式会让兼容分支变得不可预测。

### 10. 生成按钮 disabled 条件

当前 video 按钮已经有多项业务禁用条件。改造时不要替换掉这些条件，而是在最前面叠加模型选择层的判断。

推荐整合写法：

```tsx
disabled={
  !canGenerateForModelSelection ||
  isGenerating ||
  (isTextToVideoMode && !prompt.trim()) ||
  isPromptTooLong ||
  isReferenceUploading ||
  hasReferenceUploadError ||
  (isImageToVideoMode && referenceImageUrls.length === 0) ||
  (isVideoToVideoMode && !referenceVideoUrl.trim()) ||
  remainingCredits < costCredits
}
```

`!canGenerateForModelSelection` 已经把 `isLoadingProviders / hasAvailableFamilies / selectedCandidates.length` 三种模型配置状态收口，避免在按钮上重复展开。

### 11. i18n 文案处理

移除 Provider Select 之后，`form.provider` 与 `form.select_provider` 在 video 生成器内不再被引用。

是否一并删除取决于其他模块是否还在使用。本次不强制处理，避免误伤。废弃 i18n 词条属于后续清理项，不作为 v1 必做项。

---

## 后端方案

### 1. `/api/ai/generate` 接收 video candidates

当前 `/api/ai/generate` 已经有 `GenerateRequest` 和 `candidates` 结构。

但现有 candidates fallback 只对 image 生效。

video 改造后，应把候选链路支持扩展到：

- `AIMediaType.IMAGE`
- `AIMediaType.VIDEO`

music 暂时继续走旧的 `provider + model` 路径。

建议写法：

```ts
const supportCandidatesFallback =
  mediaType === AIMediaType.IMAGE || mediaType === AIMediaType.VIDEO;

if (supportCandidatesFallback && candidates?.length) {
  // 新路径：image/video 生成器走 candidates fallback
} else if (provider && model) {
  // 旧路径：music 或尚未迁移的调用继续使用
} else {
  throw new Error('invalid params');
}
```

这样可以保证：

- image 现有改造不受影响
- video 可以独立升级
- music 不被强制迁移
- 接口仍保持渐进兼容

改造此处的硬约束：image 在新条件下走的代码路径必须与现状逐行等价，包括 candidate 错误收集、命中后日志输出、`finalProvider/finalModel` 落库。这次只扩展 `mediaType` 判定，不重写已有 image 路径。

### 2. 只在“创建任务阶段”做 fallback

伪代码：

```ts
const candidateErrors: string[] = [];
let result;

for (const candidate of candidates) {
  if (!candidate?.provider || !candidate?.model) {
    candidateErrors.push(`invalid candidate/${scene ?? 'unknown-scene'}`);
    continue;
  }

  try {
    result = await createProviderTask(
      candidate.provider,
      candidate.model
    );

    finalProvider = candidate.provider;
    finalModel = candidate.model;

    if (candidateErrors.length > 0) {
      console.warn('Model fallback used after candidate failures:', {
        mediaType,
        scene,
        family: requestBody.family,
        errors: candidateErrors,
      });
    }

    break;
  } catch (error: any) {
    candidateErrors.push(
      `${candidate.provider}/${candidate.model}/${scene}: ${error.message}`
    );
  }
}

if (!result || !finalProvider || !finalModel) {
  console.error('All model candidates failed:', {
    mediaType,
    scene,
    family: requestBody.family,
    errors: candidateErrors,
  });
  throw new Error('All model candidates failed');
}
```

建议对用户仍然只返回统一错误，不暴露 provider 细节。

但服务端日志要保留完整失败链路，便于排查：

- 哪几个 candidate 被尝试过
- 每一步失败在哪个 provider / model / scene
- 每一步错误是什么
- 最终是否发生 fallback 命中

### 3. 成功后按实际命中的 provider + model 落库

即使用户选择的是：

```ts
family: 'sora-2-pro'
```

任务记录里也必须保存实际命中的：

```ts
provider: 'kie'
model: 'sora-2-pro-text-to-video'
```

这样后续轮询 `/api/ai/query` 才能根据任务记录里的 provider/model 调到正确 provider。

### 4. 为什么不做轮询失败后的 fallback

video 比 image 更贵、更慢，所以更不应该在本次做“任务创建成功后失败，再自动换 provider 重新创建”。

如果 provider 在创建任务前就失败，例如：

- API 超时
- key 无效
- 账户额度不足
- 请求参数不兼容
- provider 临时不可用
- 返回结果没有 taskId

可以直接切下一个 candidate。

但如果已经成功创建了远端任务，后面轮询时才失败，那是另一类问题：

- 是否重复扣积分
- 是否保留失败任务记录
- 旧任务是否可能稍后成功
- 是否会出现多个视频结果
- 用户等待时间是否过长
- 失败原因是否应该让用户手动重试而不是自动重试

这明显属于下一阶段，不应该混在这次 v1 里。

---

## Video 特有注意事项

### 1. candidate 必须保证输入能力等价

image 的 fallback 主要关注 `family + scene + provider`。

video 还要关注候选模型是否接受同一套输入能力。

例如同一 family 下的 candidates 应尽量满足：

- 都支持当前 scene
- 都支持当前 reference 输入类型
- 都能接受当前 prompt 规则
- 都能接受当前 duration / aspect ratio 等 options，或 provider 层能安全忽略/映射
- 输出结果能被现有 `extractVideoUrls` 正确提取

这条应该作为新增同 family 多 provider candidate 时的硬约束，而不是事后优化项。
如果统一 options 不能被同 family 下所有候选项安全接受，或者 provider adapter 不能安全映射/忽略差异字段，就不要把它们归入同一 family。

不要把能力差异很大的模型放进同一个 family。

### 2. 不要为了 fallback 强行归并模型

video 生成不像 image 那样容易“同名同能力”。

`Veo 3`、`Veo 3.1`、`Sora 2`、`Sora 2 Pro` 之间差异可能直接影响用户预期。

所以本次只解决：

> 同一个视频模型家族下，不同 provider / 不同 scene-specific value 的 UI 收口和创建任务 fallback。

不解决：

> 一个视频模型失败后，自动换成另一个视频模型。

### 3. options 映射仍然放在 provider 层

前端继续发送统一 options，例如：

```ts
options.image_input = referenceImageUrls;
options.video_input = [trimmedReferenceVideoUrl];
options.duration = '10';
options.aspect_ratio = 'landscape';
```

不同 provider 的字段差异仍然由 provider adapter 处理。

例如：

- Replicate 可以把 `image_input` 转成 `reference_images` 或 `input_reference`
- Fal 可以把 `image_input` 转成 `image_url`
- Kie 可以把 `image_input` 转成 `image_urls`
- Kie 可以把 `duration` 转成 `n_frames`

本次不建议把这些 provider-specific 字段映射上移到 UI 层。

否则 UI 会重新感知 provider，违背改造目标。

### 4. Prompt 校验按 scene 保持现状

当前 video 逻辑是：

- `text-to-video` 必须有 prompt
- `image-to-video` 必须有参考图
- `video-to-video` 必须有参考视频 URL

这个逻辑可以保持。

后端 `/api/ai/generate` 也允许 `prompt` 或 `options` 至少有一个存在，因此 image-to-video / video-to-video 可以通过 options 创建任务。

需要注意：如果某些 provider adapter 当前仍然要求 `prompt` 必填，那么 image-to-video / video-to-video 在空 prompt 下可能会在创建任务阶段失败。本次 v1 不改 provider adapter；如果实际测试发现该问题，再单独决定是前端统一要求 video prompt，还是放宽对应 provider 的 prompt 校验。

---

## 这套方案为什么比旧方案更合理

### 更符合用户认知

用户认知里是“我要用 Sora 2 Pro / Veo 3.1 / Wan Pro 生成视频”，而不是“我要用 Kie 或 Replicate”。

### 更符合真实业务目标

增加多个 provider 的目的，不是为了让用户多选一次，而是提高任务创建成功率。

需要明确当前 v1 的收益边界：现有 video 同 scene 下真正“同 family + 多 provider”的候选暂时不多，因此本次最大收益不是立刻获得大量 fallback 命中，而是先把 UI 心智和状态模型收口到 `family + candidates`，为后续安全增加同族 provider candidate 留出路径。

### 更少状态

从 `provider + model` 双状态，收口为 `selectedFamily` 单状态。

### 更少同步逻辑

不再需要在 tab 切换、provider 切换、model 切换时手动同步。

### 更适合未来统一输入框

以后如果把 image/video 做成 Pollo 类似的统一创作入口，toolbar 里只需要展示：

- AI Image / AI Video
- 模型 family
- 场景
- 上传附件
- 分辨率 / 时长 / 比例

不需要把 provider 作为主控件暴露出来。

### 更容易维护

新增某个 provider 的同族 video 模型时，只需要往 `MODEL_OPTIONS` 同 family 分组里追加一项，不需要改 UI 交互模型。

---

## 明确不做的事

以下内容本次明确不做：

- 不恢复 Provider `<Select>`
- 不给模型 label 加 `(kie)`、`(replicate)`、`(fal)` 后缀
- 不新增 `priority` 字段
- 不做跨 family 降级 fallback
- 不做 `Sora 2 Pro -> Sora 2` 自动降级
- 不做 `Veo 3.1 -> Veo 3` 自动降级
- 不做任务创建成功后的二次自动重试
- 不做“轮询失败后自动切 provider 重新创建任务”
- 不把 provider-specific options 映射挪到 UI 层
- 不让 `/api/ai/providers` 返回 model 级可用性
- 不修改 image 生成器现有实现
- 不修改 provider adapter 的现有映射逻辑
- v1 不抽 `dedupeModelFamilies` 到共享 helper 文件
- 不把 image 和 video 的完整生成逻辑强行合并成一个巨型组件
- 不新增 Registry / Resolver / Builder 等抽象层

原因很简单：

这些要么会重新把 provider 暴露给用户，要么会把当前改造复杂度推高到不值得的程度，要么会破坏 video 模型选择的用户预期。

---

## 最小改动清单

建议改动收口在以下位置：

- `src/shared/blocks/generator/video.tsx`
- `src/app/api/ai/generate/route.ts`

v1 只建议改这两个文件。不要为了复用 `dedupeModelFamilies` 顺手改 image 或新增共享 helper 文件；本地复制一个很小的纯函数，更符合“最小入侵、好回滚、少重构”的目标。

### 前端

- 新增 `VideoModelOption` 类型
- `MODEL_OPTIONS` 增加 `family`
- `family` 使用 lowercase + kebab-case，例如 `veo-3-1`
- 注释或删除 `PROVIDER_OPTIONS`
- 注释或删除 `handleProviderChange`
- 注释或删除独立 `provider` state
- 注释或删除独立 `model` state
- 新增 `selectedFamily`
- 新增 `availableProviders`
- 新增 `isLoadingProviders`
- 组件挂载时请求 `/api/ai/providers`
- 在 `video.tsx` 内新增本地 `dedupeModelFamilies` 纯函数
- 新增 `availableModelOptions`
- 新增 `availableFamilyOptions`
- 新增 `selectedCandidates`
- `selectedCandidates` 必须同时按 `family + scene + availableProviders` 过滤
- 新增 family 自动回退 `useEffect`
- `handleTabChange` 简化，只切场景和积分，不清理用户输入
- Model `<Select>` 展示去重后的 family
- Loading 时 Model `<Select>` 显示 `Loading...`
- 无可用 family 时禁用 Model `<Select>` 和生成按钮
- `handleGenerate` 校验顺序调整为模型层 -> 用户态 -> 输入态
- `handleGenerate` 改为发送 `family + candidates`
- 即使只有一个 candidate，也按 `candidates: [...]` 发送
- 生成按钮 disabled 条件叠加 `!canGenerateForModelSelection`
- 生成成功时展示 `data.provider` / `data.model`，不要继续用旧的本地 `provider` / `model`
- Provider Select 移除后，不强制删除 `form.provider` / `form.select_provider` i18n key

### 后端

- `generate` 接口继续保留渐进兼容
- 将 candidates fallback 从 image 扩展到 image + video
- 扩展时确保 image 现有 fallback 路径不退化
- music 暂时继续支持旧 `provider + model` 路径
- 顺序尝试 candidates
- 收集每个 candidate 的失败原因并统一写日志
- 成功后按实际命中的 `provider + model` 创建任务记录
- 对用户返回统一错误，对服务端日志保留完整 provider/model/scene 细节

---

## 保守实施顺序与回滚策略

### 推荐实施顺序

1. 先改后端 `src/app/api/ai/generate/route.ts`

只把现有：

```ts
mediaType === AIMediaType.IMAGE && candidates?.length
```

扩展成：

```ts
(mediaType === AIMediaType.IMAGE || mediaType === AIMediaType.VIDEO) &&
  candidates?.length
```

其余 image fallback 逻辑不要重写。

2. 再改前端 `src/shared/blocks/generator/video.tsx`

前端只做状态收口、family 下拉、候选链路派生和请求体从 `provider + model` 改为 `family + candidates`。

3. 最后做一次手工回归

重点验证：

- `text-to-video` 只提交当前 scene 的 candidates
- `image-to-video` 只提交当前 scene 的 candidates
- `video-to-video` 只提交当前 scene 的 candidates
- 无 provider key 时不会误触发生成
- 单个 candidate 时也走 `candidates: [...]`
- 后端任务记录仍然落实际命中的 `provider + model`

### 回滚策略

这套方案不改数据库、不改 provider adapter、不改 `/api/ai/providers`，所以回滚路径很短：

- 前端回滚：恢复旧的 Provider Select、Model Select、`provider/model` state 和旧请求体
- 后端无需立即回滚：旧 `provider + model` 路径仍保留，可以继续兼容旧前端
- 如需完全回滚后端，只要把 video 从 `supportCandidatesFallback` 条件里移除，image 路径仍保持原状

因此 v1 的风险主要集中在 `video.tsx` 的 UI 状态迁移，不会扩散到 image、music、数据库或 provider 层。

---

## 实现注意事项

### 1. selectedCandidates 不能漏掉 scene 过滤

这是 video 改造里最容易出错的点。

例如：

```ts
family: 'sora-2-pro'
```

下面有：

- `sora-2-pro-text-to-video`
- `sora-2-pro-image-to-video`

如果只按 family 过滤，就可能在 `text-to-video` 场景里混入 `image-to-video` 的 model value。

所以必须始终保证候选链路来自：

```ts
family + activeTab + availableProviders
```

### 2. availableProviders 为空不等于所有禁用逻辑

禁用按钮的根本依据不是原始 provider 列表，而是派生结果：

```ts
availableFamilyOptions.length === 0
selectedCandidates.length === 0
```

`availableProviders.length === 0` 只是错误提示的一种原因。

### 3. 后端 fallback 不要限定只给 image

改造后应避免这种写法：

```ts
if (mediaType === AIMediaType.IMAGE && candidates?.length) {
  // fallback
}
```

应改成：

```ts
const supportCandidatesFallback =
  mediaType === AIMediaType.IMAGE || mediaType === AIMediaType.VIDEO;

if (supportCandidatesFallback && candidates?.length) {
  // fallback
}
```

### 4. 立即成功场景要使用后端返回的 provider/model

当前 video 生成器在立即成功时，如果继续用本地旧 state：

```ts
provider,
model,
```

在 candidates fallback 后会不准确。

应该使用：

```ts
data.provider
data.model
```

因为真正命中的 provider/model 只有后端知道。

video 的 provider（`kie` / `fal` / `replicate`）几乎都返回异步 `taskId`，立即成功场景很少见。本条主要是为数据一致性托底，避免少数同步返回场景下日志与实际命中的 provider 错位。

这条是硬约束：只要前端进入立即成功分支，就必须使用后端返回的 `data.provider` / `data.model`，不要再引用本地旧状态。

### 5. candidate 级超时是建议项，不是本次必做项

后端 fallback 是在同一个 HTTP 请求里顺序尝试 candidates。

如果第一个 candidate 长时间卡住，会影响后续 candidate。

当前阶段不建议为此引入复杂任务队列，但可以考虑一条简单约束：

- 为单个 candidate 的创建请求设置合理超时

这属于风险控制优化，不是本次架构改造成立的前置条件。

### 6. 全 candidate 失败时的前端 UX 是优化项

当后端返回 `All model candidates failed` 时，前端可以在 toast 中追加 `Try another model` 一类提示，并在 Model `<Select>` 上做轻微高亮，引导用户主动切 family。

这属于体验优化，不影响主架构成立。

### 7. referenceVideoUrl 格式校验是优化项

当前 `referenceVideoUrl` 是纯 Textarea。

提交前可以做基本格式校验，例如 `trim` 后判断是否以 `http://` 或 `https://` 开头。

这属于风险控制优化项，与本次架构改造无关，可不在 v1 合并。

### 8. 未来统一 composer UI 时保持“产品集中、工程分离”

以后 image/video 可以集中到一个类似 Pollo 的输入框入口。

但建议仍然保持：

```ts
useImageGeneration()
useVideoGeneration()
```

或者：

```tsx
<ImageGenerationPanel />
<VideoGenerationPanel />
```

不要把 image/video 的 scene、options、validation、polling 全部合并成一个巨型组件。

更推荐的方向是：

- 统一入口
- 共用 PromptComposer / ModelFamilySelect / Toolbar / ProgressCard
- image/video 各自维护生成逻辑

---

## 最终结论

video 生成器应该采用与 image 生成器一致的大方向：

**模型家族选择 + provider 自动兜底。**

但 video 的 family 归并要更保守。

这次改造的重点不是“把所有相似视频模型合并”，而是：

- 去掉 Provider 下拉
- 把 provider 从 UI 状态降级为执行策略
- 用 `family` 表达用户真正选择的视频模型
- 用 `candidates` 表达系统内部候选链路
- 只在创建任务阶段做 fallback
- 不做跨模型降级
- 保持 image / video 架构一致，为未来统一输入框做准备

这是当前阶段在：

- 用户心智
- 最小入侵
- 可维护性
- 生成稳定性
- 避免过度设计

之间最平衡的方案。
