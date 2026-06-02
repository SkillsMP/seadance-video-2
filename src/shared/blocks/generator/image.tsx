/**
 * 图像生成器组件
 * 支持文本生成图像（text-to-image）和图像编辑（image-to-image）两种模式
 * 集成多个 AI 服务提供商（fal、replicate、gemini 等）
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreditCard,
  Download,
  ImageIcon,
  Loader2,
  Sparkles,
  User,
  Wand,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { calculateModelCredits } from '@/config/ai/credit-costs';
import { MODELS } from '@/config/ai/models';
import { resolveFinalOptions } from '@/config/ai/options';
import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import {
  ImageUploader,
  ImageUploaderValue,
  LazyImage,
} from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Progress } from '@/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

import {
  areControlValuesEqual,
  buildGenerationOptions,
  formatControlOption,
  getControlDefaultValue,
  getControlLabel,
  getGenerationControlEntries,
  normalizeGenerationControlValues,
} from './generation-controls';

// ============ 接口定义 ============

/** 组件 Props */
interface ImageGeneratorProps {
  allowMultipleImages?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
  srOnlyTitle?: string;
  className?: string;
  promptKey?: string;
}

/** 生成的图像数据 */
interface GeneratedImage {
  id: string;
  url: string;
  provider?: string;
  model?: string;
  prompt?: string;
}

/** 后端任务数据 */
interface BackendTask {
  id: string;
  status: string;
  provider: string;
  model: string;
  prompt: string | null;
  taskInfo: string | null;
  taskResult: string | null;
}

/** 标签页类型：文本生成图像 或 图像编辑 */
type ImageGeneratorTab = 'text-to-image' | 'image-to-image';

// ============ 常量配置 ============

const POLL_INTERVAL = 5000; // 轮询间隔（毫秒）
const GENERATION_TIMEOUT = 180000; // 生成超时时间（3分钟）
const MAX_PROMPT_LENGTH = 2000; // 提示词最大长度
const DEFAULT_PROMPT =
  'Canon camera, 85mm fixed lens, creating a gradual change of f/1.8, f/2.8, f/10, f/14 aperture effects, a gentle and beautiful lady as the model, background is the city blue hour after sunset';
const DEFAULT_PREVIEW_IMAGE =
  'https://img-template-nano-banana.16781678.xyz/uploads/2025-12-07/1.jpeg';
const GENERATED_CONTENT_SAFETY_MESSAGE =
  'This generated result violates our content safety policy and cannot be displayed. Please revise your prompt and try again.';
const AUTO_SAVE_SHOWCASE =
  process.env.NEXT_PUBLIC_AUTO_SAVE_SHOWCASE === 'true';

/** AI 模型配置列表 */
// 数组中元素的存放顺序即为调用优先级
// value 要参考厂商 API 文档，这个必须准。
const MODEL_OPTIONS = MODELS.filter(
  (model) => model.mediaType === AIMediaType.IMAGE && model.enabled
);

// ============ 工具函数 ============

function dedupeModelFamilies(options: typeof MODEL_OPTIONS) {
  const seenFamilies = new Set<string>();

  return options.filter((option) => {
    if (seenFamilies.has(option.family)) {
      return false;
    }

    seenFamilies.add(option.family);
    return true;
  });
}

/**
 * 解析任务结果 JSON 字符串
 */
function parseTaskResult(taskResult: string | null): any {
  if (!taskResult) {
    return null;
  }

  try {
    return JSON.parse(taskResult);
  } catch (error) {
    console.warn('Failed to parse taskResult:', error);
    return null;
  }
}

/**
 * 从 AI 响应中提取图像 URL
 * 支持多种响应格式（output、images、data 等）
 */
function extractImageUrls(result: any): string[] {
  if (!result) {
    return [];
  }

  const output = result.output ?? result.images ?? result.data;

  if (!output) {
    return [];
  }

  if (typeof output === 'string') {
    return [output];
  }

  if (Array.isArray(output)) {
    return output
      .flatMap((item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (typeof item === 'object') {
          const candidate =
            item.url ?? item.uri ?? item.image ?? item.src ?? item.imageUrl;
          return typeof candidate === 'string' ? [candidate] : [];
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof output === 'object') {
    const candidate =
      output.url ?? output.uri ?? output.image ?? output.src ?? output.imageUrl;
    if (typeof candidate === 'string') {
      return [candidate];
    }
  }

  return [];
}

// ============ 主组件 ============

export function ImageGenerator({
  allowMultipleImages = true,
  maxImages = 9,
  maxSizeMB = 5,
  srOnlyTitle,
  className,
  promptKey,
}: ImageGeneratorProps) {
  const t = useTranslations('ai.image.generator');

  // ============ 状态管理 ============

  // UI 状态
  const [activeTab, setActiveTab] =
    useState<ImageGeneratorTab>('text-to-image');

  // 生成配置
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedControlValues, setSelectedControlValues] = useState<
    Record<string, string>
  >({});
  // Set default values only when no promptKey is provided
  const [prompt, setPrompt] = useState(promptKey ? '' : DEFAULT_PROMPT);
  const [previewImage, setPreviewImage] = useState<string>(
    promptKey ? '' : DEFAULT_PREVIEW_IMAGE
  );

  // 参考图像
  const [referenceImageItems, setReferenceImageItems] = useState<
    ImageUploaderValue[]
  >([]);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);

  // 生成结果
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [taskStatus, setTaskStatus] = useState<AITaskStatus | null>(null);
  const [downloadingImageId, setDownloadingImageId] = useState<string | null>(
    null
  );

  // 加载状态
  const [isMounted, setIsMounted] = useState(false);
  const savedTaskIdsRef = useRef<Set<string>>(new Set()); // 防止重复保存
  const queryingTaskRef = useRef<string | null>(null);
  const queryFailCountRef = useRef(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const hasLoadedCreditsRef = useRef(false);

  const { user, isCheckSign, setIsShowSignModal, fetchUserCredits } =
    useAppContext();

  // ============ 初始化 Effects ============

  /**
   * 组件挂载时获取可用的 AI 提供商
   */
  useEffect(() => {
    setIsMounted(true);

    // Fetch available AI providers
    fetch('/api/ai/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0 && data.data?.providers !== undefined) {
          const providers = data.data.providers || [];
          console.log('Available AI providers:', providers);
          setAvailableProviders(providers);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch AI providers:', error);
        setAvailableProviders([]);
      })
      .finally(() => {
        setIsLoadingProviders(false);
      });
  }, []);

  // Track user ID to reset credits loading flag when user changes
  const userIdRef = useRef<string | null>(null);

  /**
   * 用户积分加载（仅加载一次）
   */
  useEffect(() => {
    // Reset flag when user changes
    if (user?.id !== userIdRef.current) {
      userIdRef.current = user?.id || null;
      hasLoadedCreditsRef.current = false;
    }

    // Only fetch credits once per user session
    if (user && !user.credits && !hasLoadedCreditsRef.current) {
      hasLoadedCreditsRef.current = true;
      setIsLoadingCredits(true);
      fetchUserCredits().finally(() => {
        setIsLoadingCredits(false);
      });
    }
  }, [user?.id, user?.credits, fetchUserCredits]);

  /**
   * 根据 promptKey 加载预设提示词和图像
   */
  useEffect(() => {
    if (promptKey) {
      fetch(`/api/prompts/by-title?title=${encodeURIComponent(promptKey)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.promptDescription) {
              setPrompt(data.data.promptDescription);
            }
            if (data.data.image) {
              setPreviewImage(data.data.image);
            }
            setActiveTab('image-to-image');
          }
        })
        .catch((error) => {
          console.error('Failed to fetch prompt:', error);
        });
    } else {
      setPrompt(DEFAULT_PROMPT);
      setPreviewImage(DEFAULT_PREVIEW_IMAGE);
      setActiveTab('text-to-image');
    }
  }, [promptKey]);

  // ============ 计算属性 ============

  const promptLength = prompt.trim().length;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const isPromptTooLong = promptLength > MAX_PROMPT_LENGTH;
  const isTextToImageMode = activeTab === 'text-to-image';
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
  const selectedEntry = selectedCandidates[0];
  const selectedControlEntries = useMemo(
    () =>
      getGenerationControlEntries({
        entry: selectedEntry,
        scene: activeTab,
      }),
    [activeTab, selectedEntry]
  );
  const selectedGenerationOptions = useMemo(
    () =>
      buildGenerationOptions({
        controlEntries: selectedControlEntries,
        selectedControlValues,
      }),
    [selectedControlEntries, selectedControlValues]
  );
  const costCredits = useMemo(() => {
    if (!selectedEntry) {
      return 0;
    }

    const finalOptions = resolveFinalOptions({
      mediaType: AIMediaType.IMAGE,
      scene: activeTab,
      entry: selectedEntry,
      options: selectedGenerationOptions,
    });

    return calculateModelCredits(selectedEntry, activeTab, finalOptions);
  }, [activeTab, selectedEntry, selectedGenerationOptions]);
  const hasAvailableFamilies = availableFamilyOptions.length > 0;
  const canGenerateForModelSelection =
    !isLoadingProviders &&
    hasAvailableFamilies &&
    selectedCandidates.length > 0;
  const modelAvailabilityMessage = useMemo(() => {
    if (isLoadingProviders) {
      return '';
    }

    if (availableProviders.length === 0) {
      return 'Please contact the administrator to configure AI models.';
    }

    if (!hasAvailableFamilies) {
      return 'No models are available for the current generation mode.';
    }

    return '';
  }, [isLoadingProviders, availableProviders.length, hasAvailableFamilies]);

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

  useEffect(() => {
    setSelectedControlValues((currentValues) => {
      const nextValues = normalizeGenerationControlValues({
        currentValues,
        controlEntries: selectedControlEntries,
      });

      return areControlValuesEqual(currentValues, nextValues)
        ? currentValues
        : nextValues;
    });
  }, [selectedControlEntries]);

  // ============ 事件处理函数 ============

  /**
   * 标签页切换处理
   */
  const handleTabChange = (value: string) => {
    const tab = value as ImageGeneratorTab;
    setActiveTab(tab);
  };

  const handleControlChange = (name: string, value: string) => {
    setSelectedControlValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  /**
   * 任务状态标签
   */
  const taskStatusLabel = useMemo(() => {
    if (!taskStatus) {
      return '';
    }

    switch (taskStatus) {
      case AITaskStatus.PENDING:
        return 'Waiting for the model to start';
      case AITaskStatus.PROCESSING:
        return 'Generating your image...';
      case AITaskStatus.SUCCESS:
        return 'Image generation completed';
      case AITaskStatus.MODERATION_BLOCKED:
        return 'Generated image blocked';
      case AITaskStatus.FAILED:
        return 'Generation failed';
      default:
        return '';
    }
  }, [taskStatus]);

  /**
   * 参考图像变化处理
   */
  const handleReferenceImagesChange = useCallback(
    (items: ImageUploaderValue[]) => {
      setReferenceImageItems(items);
      const uploadedUrls = items
        .filter((item) => item.status === 'uploaded' && item.url)
        .map((item) => item.url as string);
      setReferenceImageUrls(uploadedUrls);
    },
    []
  );

  /** 参考图像是否正在上传 */
  const isReferenceUploading = useMemo(
    () => referenceImageItems.some((item) => item.status === 'uploading'),
    [referenceImageItems]
  );

  /** 参考图像上传是否有错误 */
  const hasReferenceUploadError = useMemo(
    () => referenceImageItems.some((item) => item.status === 'error'),
    [referenceImageItems]
  );

  /**
   * 重置任务状态
   */
  const resetTaskState = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setTaskId(null);
    setGenerationStartTime(null);
    setTaskStatus(null);
    queryFailCountRef.current = 0;
    // Don't clear savedTaskIds here - keep it to prevent duplicates across generations
  }, []);

  /**
   * 保存生成的图像到展示库
   * 1. 压缩图像
   * 2. 上传到服务器
   * 3. 保存到数据库
   */
  const saveShowcase = useCallback(
    async (imageUrl: string, taskIdForTracking: string) => {
      // Prevent duplicate saves for the same task
      if (savedTaskIdsRef.current.has(taskIdForTracking)) {
        console.log('Already saved, skipping:', taskIdForTracking);
        return;
      }

      // Mark as saved immediately to prevent race conditions
      savedTaskIdsRef.current.add(taskIdForTracking);
      console.log('Saving showcase for task:', taskIdForTracking);

      try {
        const compressImageFile = async (imageUrl: string): Promise<string> => {
          console.log('Fetching image from proxy...');
          const response = await fetch(
            `/api/proxy/file?url=${encodeURIComponent(imageUrl)}`
          );
          if (!response.ok) throw new Error('Failed to fetch image');

          const blob = await response.blob();
          const file = new File([blob], 'showcase.jpg', { type: blob.type });

          // Use shared compressImage function
          const { compressImage } = await import('@/shared/blocks/common');
          const compressedFile = await compressImage(file);

          return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', compressedFile);

            console.log('Uploading compressed image...');
            fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })
              .then((res) => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
              })
              .then((result) => {
                if (!result.success || !result.url) {
                  throw new Error(result.error || 'Upload failed');
                }
                console.log('Upload successful:', result.url);
                resolve(result.url);
              })
              .catch(reject);
          });
        };

        const compressedImageUrl = await compressImageFile(imageUrl);

        console.log('Adding showcase to database...');
        await fetch('/api/showcases/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: prompt.trim().substring(0, 100),
            prompt: prompt.trim(),
            image: compressedImageUrl,
            tags: promptKey || null,
          }),
        });
        console.log('Showcase saved successfully');
      } catch (error) {
        console.warn('Failed to save showcase, ignored:', error);
        // Remove from saved set if failed
        savedTaskIdsRef.current.delete(taskIdForTracking);
      }
    },
    [prompt, promptKey]
  );

  /**
   * 轮询任务状态
   * 定期查询后端任务状态，更新进度和结果
   */
  const pollTaskStatus = useCallback(
    async (id: string) => {
      if (queryingTaskRef.current === id) {
        return false;
      }

      queryingTaskRef.current = id;

      try {
        // Check if already saved to prevent duplicate processing
        if (savedTaskIdsRef.current.has(id)) {
          console.log('Task already processed, stopping poll:', id);
          return true;
        }

        if (
          generationStartTime &&
          Date.now() - generationStartTime > GENERATION_TIMEOUT
        ) {
          resetTaskState();
          toast.error('Image generation timed out. Please try again.');
          return true;
        }

        const resp = await fetch('/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId: id }),
        });

        if (!resp.ok) {
          throw new Error(`request failed with status: ${resp.status}`);
        }

        const { code, message, data } = await resp.json();
        if (code !== 0) {
          throw new Error(message || 'Query task failed');
        }

        queryFailCountRef.current = 0;

        const task = data as BackendTask;
        const currentStatus = task.status as AITaskStatus;
        setTaskStatus(currentStatus);

        const parsedResult = parseTaskResult(task.taskInfo);
        const imageUrls = extractImageUrls(parsedResult);

        if (currentStatus === AITaskStatus.PENDING) {
          setProgress((prev) => Math.max(prev, 20));
          return false;
        }

        if (currentStatus === AITaskStatus.PROCESSING) {
          if (imageUrls.length > 0) {
            setGeneratedImages(
              imageUrls.map((url, index) => ({
                id: `${task.id}-${index}`,
                url,
                provider: task.provider,
                model: task.model,
                prompt: task.prompt ?? undefined,
              }))
            );
            setProgress((prev) => Math.max(prev, 85));
          } else {
            setProgress((prev) => Math.min(prev + 10, 80));
          }
          return false;
        }

        if (currentStatus === AITaskStatus.SUCCESS) {
          if (imageUrls.length === 0) {
            toast.error('The provider returned no images. Please retry.');
          } else {
            const images = imageUrls.map((url, index) => ({
              id: `${task.id}-${index}`,
              url,
              provider: task.provider,
              model: task.model,
              prompt: task.prompt ?? undefined,
            }));
            setGeneratedImages(images);

            // Save showcase only once - check before saving
            if (
              AUTO_SAVE_SHOWCASE &&
              images.length > 0 &&
              !savedTaskIdsRef.current.has(task.id)
            ) {
              await saveShowcase(images[0].url, task.id);
            }
            toast.success('Image generated successfully');
          }

          setProgress(100);
          resetTaskState();
          return true;
        }

        if (currentStatus === AITaskStatus.MODERATION_BLOCKED) {
          setGeneratedImages([]);
          toast.error(GENERATED_CONTENT_SAFETY_MESSAGE);
          resetTaskState();
          return true;
        }

        if (currentStatus === AITaskStatus.FAILED) {
          const errorMessage =
            parsedResult?.errorMessage || 'Generate image failed';
          toast.error(errorMessage);
          resetTaskState();

          fetchUserCredits();

          return true;
        }

        setProgress((prev) => Math.min(prev + 5, 95));
        return false;
      } catch (error: any) {
        queryFailCountRef.current += 1;

        console.warn(
          `Polling image task failed (${queryFailCountRef.current}/3), will retry:`,
          error
        );

        if (queryFailCountRef.current < 3) {
          return false;
        }

        console.error('Error polling image task:', error);
        toast.error(`Query task failed: ${error.message}`);
        resetTaskState();

        fetchUserCredits();

        return true;
      } finally {
        if (queryingTaskRef.current === id) {
          queryingTaskRef.current = null;
        }
      }
    },
    [generationStartTime, resetTaskState, fetchUserCredits, saveShowcase]
  );

  /**
   * 轮询任务状态 Effect
   * 每 5 秒查询一次任务状态
   */
  useEffect(() => {
    if (!taskId || !isGenerating) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (!taskId) {
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) {
        cancelled = true;
      }
    };

    tick();

    const interval = setInterval(async () => {
      if (cancelled || !taskId) {
        clearInterval(interval);
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [taskId, isGenerating, pollTaskStatus]);

  /**
   * 生成图像处理函数
   * 1. 验证前置条件（提供商、积分、提示词等）
   * 2. 调用后端 API 创建生成任务
   * 3. 启动轮询获取结果
   */
  const handleGenerate = async () => {
    console.log('=== Generate Debug Info ===');
    console.log('availableProviders:', availableProviders);
    console.log('selectedFamily:', selectedFamily);
    console.log(
      'selectedCandidates:',
      selectedCandidates.map((candidate) => ({
        provider: candidate.provider,
        model: candidate.value,
      }))
    );
    console.log('remainingCredits:', remainingCredits);
    console.log('costCredits:', costCredits);

    if (availableProviders.length === 0) {
      toast.error('Please contact the administrator to configure AI models.');
      return;
    }

    if (!hasAvailableFamilies) {
      toast.error('No models are available for the current generation mode.');
      return;
    }

    if (selectedCandidates.length === 0) {
      toast.error('Please select a model before generating.');
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
    if (!trimmedPrompt) {
      toast.error('Please enter a prompt before generating.');
      return;
    }

    if (!isTextToImageMode && referenceImageUrls.length === 0) {
      toast.error('Please upload reference images before generating.');
      return;
    }

    setIsGenerating(true);
    setProgress(15);
    setTaskStatus(AITaskStatus.PENDING);
    setGeneratedImages([]);
    setGenerationStartTime(Date.now());

    try {
      const options: any = { ...selectedGenerationOptions };

      if (!isTextToImageMode) {
        options.image_input = referenceImageUrls;
      }

      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: AIMediaType.IMAGE,
          scene: activeTab,
          family: selectedFamily,
          candidates: selectedCandidates.map((candidate) => ({
            provider: candidate.provider,
            model: candidate.value,
          })),
          prompt: trimmedPrompt,
          options,
        }),
      });

      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message || 'Failed to create an image task');
      }

      const newTaskId = data?.id;
      if (!newTaskId) {
        throw new Error('Task id missing in response');
      }

      if (data.status === AITaskStatus.MODERATION_BLOCKED) {
        setGeneratedImages([]);
        toast.error(GENERATED_CONTENT_SAFETY_MESSAGE);
        resetTaskState();
        await fetchUserCredits();
        return;
      }

      if (data.status === AITaskStatus.SUCCESS && data.taskInfo) {
        const parsedResult = parseTaskResult(data.taskInfo);
        const imageUrls = extractImageUrls(parsedResult);

        if (imageUrls.length > 0) {
          const images = imageUrls.map((url, index) => ({
            id: `${newTaskId}-${index}`,
            url,
            provider: data.provider,
            model: data.model,
            prompt: trimmedPrompt,
          }));
          setGeneratedImages(images);
          setProgress(100);
          resetTaskState();
          await fetchUserCredits();

          // Save showcase - this handles immediate success case
          if (
            AUTO_SAVE_SHOWCASE &&
            images.length > 0 &&
            !savedTaskIdsRef.current.has(newTaskId)
          ) {
            await saveShowcase(images[0].url, newTaskId);
          }
          toast.success('Image generated successfully');
          return;
        }
      }

      setTaskId(newTaskId);
      setProgress(25);

      await fetchUserCredits();
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      toast.error(`Failed to generate image: ${error.message}`);
      resetTaskState();
    }
  };

  /**
   * 下载生成的图像
   */
  const handleDownloadImage = async (image: GeneratedImage) => {
    if (!image.url) {
      return;
    }

    try {
      setDownloadingImageId(image.id);
      // fetch image via proxy
      const resp = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(image.url)}`
      );
      if (!resp.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Failed to download image:', error);
      toast.error('Failed to download image');
    } finally {
      setDownloadingImageId(null);
    }
  };

  // ============ UI 渲染 ============

  return (
    <section id="generator" className={cn('py-16 md:py-24', className)}>
      <div className="container">
        <div className="mx-auto max-w-6xl">
          {/* 两列布局：左侧生成表单，右侧生成结果 */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* 左侧：生成表单卡片 */}
            <Card>
              <CardHeader>
                {srOnlyTitle && <h2 className="sr-only">{srOnlyTitle}</h2>}
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Wand className="h-5 w-5" />
                  {t('title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                {/* 标签页：文本生成 vs 图像编辑 */}
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="bg-primary/10 grid w-full grid-cols-2">
                    <TabsTrigger value="text-to-image">
                      {t('tabs.text-to-image')}
                    </TabsTrigger>
                    <TabsTrigger value="image-to-image">
                      {t('tabs.image-to-image')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label>{t('form.model')}</Label>
                  <Select
                    value={selectedFamily}
                    onValueChange={setSelectedFamily}
                    disabled={isLoadingProviders || !hasAvailableFamilies}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingProviders
                            ? t('loading')
                            : t('form.select_model')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFamilyOptions.map((option) => (
                        <SelectItem key={option.family} value={option.family}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {modelAvailabilityMessage && (
                    <p className="text-muted-foreground text-xs">
                      {modelAvailabilityMessage}
                    </p>
                  )}
                </div>

                {/* 参考图像上传（仅在图像编辑模式显示） */}
                {!isTextToImageMode && (
                  <div className="space-y-4">
                    <ImageUploader
                      title={t('form.reference_image')}
                      allowMultiple={allowMultipleImages}
                      maxImages={allowMultipleImages ? maxImages : 1}
                      maxSizeMB={maxSizeMB}
                      onChange={handleReferenceImagesChange}
                      emptyHint={t('form.reference_image_placeholder')}
                    />

                    {hasReferenceUploadError && (
                      <p className="text-destructive text-xs">
                        {t('form.some_images_failed_to_upload')}
                      </p>
                    )}
                  </div>
                )}

                {selectedControlEntries.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedControlEntries.map(([name, control]) => {
                      const selectedValue =
                        selectedControlValues[name] ??
                        getControlDefaultValue(control);

                      return (
                        <div key={name} className="space-y-2">
                          <Label htmlFor={`image-control-${name}`}>
                            {getControlLabel(name, control)}
                          </Label>
                          <Select
                            value={selectedValue}
                            onValueChange={(value) =>
                              handleControlChange(name, value)
                            }
                            disabled={
                              isLoadingProviders || !hasAvailableFamilies
                            }
                          >
                            <SelectTrigger
                              id={`image-control-${name}`}
                              className="w-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {control.options.map((option) => {
                                const value = String(option);

                                return (
                                  <SelectItem key={value} value={value}>
                                    {formatControlOption(
                                      name,
                                      option,
                                      control
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 提示词输入框 */}
                <div className="space-y-2">
                  <Label htmlFor="image-prompt">{t('form.prompt')}</Label>
                  <Textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('form.prompt_placeholder')}
                    className="min-h-32"
                  />
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                      {promptLength} / {MAX_PROMPT_LENGTH}
                    </span>
                    {isPromptTooLong && (
                      <span className="text-destructive">
                        {t('form.prompt_too_long')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 生成按钮 - 根据不同状态显示不同内容 */}
                {!isMounted ? (
                  <Button className="w-full" disabled size="lg">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading')}
                  </Button>
                ) : isCheckSign ? (
                  <Button className="w-full" disabled size="lg">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('checking_account')}
                  </Button>
                ) : user ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      isLoadingCredits ||
                      !canGenerateForModelSelection ||
                      !prompt.trim() ||
                      isPromptTooLong ||
                      isReferenceUploading ||
                      hasReferenceUploadError ||
                      (!isLoadingCredits && remainingCredits < costCredits)
                    }
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('generating')}
                      </>
                    ) : isLoadingProviders ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('loading')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('generate')}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setIsShowSignModal(true)}
                    disabled={isLoadingProviders || !hasAvailableFamilies}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('sign_in_to_generate')}
                  </Button>
                )}

                {/* 积分显示和充值 */}
                {!isMounted || isLoadingCredits || isLoadingProviders ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('credits_remaining', { credits: 0 })}
                    </span>
                  </div>
                ) : user && remainingCredits > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span>
                      {t('credits_remaining', { credits: remainingCredits })}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary">
                        {t('credits_cost', { credits: costCredits })}
                      </span>
                      <span>
                        {t('credits_remaining', { credits: remainingCredits })}
                      </span>
                    </div>
                    <Link href="/pricing">
                      <Button variant="outline" className="w-full" size="lg">
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('buy_credits')}
                      </Button>
                    </Link>
                  </div>
                )}

                {/* 生成进度条（仅在生成中时显示） */}
                {isGenerating && (
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('progress')}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    {taskStatusLabel && (
                      <p className="text-muted-foreground text-center text-xs">
                        {taskStatusLabel}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 右侧：生成结果卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <ImageIcon className="h-5 w-5" />
                  {t('generated_images')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                {/* 显示生成的图像 */}
                {generatedImages.length > 0 ? (
                  <div
                    className={
                      generatedImages.length === 1
                        ? 'grid grid-cols-1 gap-6'
                        : 'grid gap-6 sm:grid-cols-2'
                    }
                  >
                    {generatedImages.map((image) => (
                      <div key={image.id} className="space-y-3">
                        <div
                          className={
                            generatedImages.length === 1
                              ? 'relative overflow-hidden rounded-lg border'
                              : 'relative aspect-square overflow-hidden rounded-lg border'
                          }
                        >
                          <LazyImage
                            src={image.url}
                            alt={image.prompt || 'Generated image'}
                            className={
                              generatedImages.length === 1
                                ? 'h-auto w-full'
                                : 'h-full w-full object-cover'
                            }
                          />

                          {/* 下载按钮 */}
                          <div className="absolute top-2 right-2 flex justify-end text-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto"
                              onClick={() => handleDownloadImage(image)}
                              disabled={downloadingImageId === image.id}
                            >
                              {downloadingImageId === image.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </>
                              ) : (
                                <>
                                  <Download className="h-5 w-5" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // 没有生成图像时显示预览或提示
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    {previewImage && (
                      <LazyImage
                        src={previewImage}
                        alt="Preview image"
                        className="mb-6"
                      />
                    )}
                    <p className="text-muted-foreground">
                      {isGenerating
                        ? t('ready_to_generate')
                        : t('no_images_generated')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
