'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreditCard,
  Download,
  ImageIcon,
  Wand,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
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
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

interface ImageGeneratorProps {
  allowMultipleImages?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
  srOnlyTitle?: string;
  className?: string;
  promptKey?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  provider?: string;
  model?: string;
  prompt?: string;
}

interface BackendTask {
  id: string;
  status: string;
  provider: string;
  model: string;
  prompt: string | null;
  taskInfo: string | null;
  taskResult: string | null;
}

type ImageGeneratorTab = 'text-to-image' | 'image-to-image';

const POLL_INTERVAL = 5000;
const GENERATION_TIMEOUT = 180000;
const MAX_PROMPT_LENGTH = 2000;

const MODEL_OPTIONS = [
  {
    value: 'nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'kie',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    value: 'google/nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'replicate',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    value: 'bytedance/seedream-4',
    label: 'Seedream 4',
    provider: 'replicate',
    scenes: ['text-to-image', 'image-to-image'],
  },
  {
    value: 'fal-ai/nano-banana-pro',
    label: 'Nano Banana Pro',
    provider: 'fal',
    scenes: ['text-to-image'],
  },
  {
    value: 'fal-ai/nano-banana-pro/edit',
    label: 'Nano Banana Pro',
    provider: 'fal',
    scenes: ['image-to-image'],
  },
  {
    value: 'fal-ai/bytedance/seedream/v4/edit',
    label: 'Seedream 4',
    provider: 'fal',
    scenes: ['image-to-image'],
  },
  {
    value: 'fal-ai/z-image/turbo',
    label: 'Z-Image Turbo',
    provider: 'fal',
    scenes: ['text-to-image'],
  },
  {
    value: 'fal-ai/flux-2-flex',
    label: 'Flux 2 Flex',
    provider: 'fal',
    scenes: ['text-to-image'],
  },
  {
    value: 'gemini-3-pro-image-preview',
    label: 'Gemini 3 Pro Image Preview',
    provider: 'gemini',
    scenes: ['text-to-image', 'image-to-image'],
  },
];

const PROVIDER_OPTIONS = [
  {
    value: 'kie',
    label: 'Kie',
  },
  {
    value: 'replicate',
    label: 'Replicate',
  },
  {
    value: 'fal',
    label: 'Fal',
  },
  {
    value: 'gemini',
    label: 'Gemini',
  },
];

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

export function ImageGenerator({
  allowMultipleImages = true,
  maxImages = 9,
  maxSizeMB = 5,
  srOnlyTitle,
  className,
  promptKey,
}: ImageGeneratorProps) {
  const t = useTranslations('ai.image.generator');

  const [activeTab, setActiveTab] =
    useState<ImageGeneratorTab>('text-to-image');

  const [costCredits, setCostCredits] = useState<number>(4);
  const [provider, setProvider] = useState(PROVIDER_OPTIONS[0]?.value ?? '');
  const [model, setModel] = useState(MODEL_OPTIONS[0]?.value ?? '');
  // Set default values only when no promptKey is provided
  const [prompt, setPrompt] = useState(
    promptKey 
      ? '' 
      : 'Canon camera, 85mm fixed lens, creating a gradual change of f/1.8, f/2.8, f/10, f/14 aperture effects, a gentle and beautiful lady as the model, background is the city blue hour after sunset'
  );
  const [previewImage, setPreviewImage] = useState<string>(
    promptKey 
      ? '' 
      : 'https://img-template-nano-banana.16781678.xyz/uploads/2025-12-07/1.jpeg'
  );
  const [referenceImageItems, setReferenceImageItems] = useState<
    ImageUploaderValue[]
  >([]);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
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
  const [isMounted, setIsMounted] = useState(false);
  const savedTaskIdsRef = useRef<Set<string>>(new Set());
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const hasLoadedCreditsRef = useRef(false);

  const { user, isCheckSign, setIsShowSignModal, fetchUserCredits } =
    useAppContext();

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
          
          // Set initial provider and model based on available providers
          if (providers.length > 0) {
            const firstProvider = providers[0];
            setProvider(firstProvider);
            
            // Find first available model for this provider
            const availableModel = MODEL_OPTIONS.find(
              (option) => 
                option.scenes.includes(activeTab) && 
                option.provider === firstProvider
            );
            
            if (availableModel) {
              setModel(availableModel.value);
            }
          } else {
            // No providers configured, clear provider and model
            console.log('No AI providers configured, clearing provider and model');
            setProvider('');
            setModel('');
          }
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
            // When promptKey is provided, switch to image-to-image tab
            setActiveTab('image-to-image');
            setCostCredits(6);
            
            // Update model based on available providers for image-to-image
            if (availableProviders.length > 0) {
              const availableModel = MODEL_OPTIONS.find(
                (option) => 
                  option.scenes.includes('image-to-image') && 
                  availableProviders.includes(option.provider)
              );
              
              if (availableModel) {
                setProvider(availableModel.provider);
                setModel(availableModel.value);
              }
            }
          }
        })
        .catch((error) => {
          console.error('Failed to fetch prompt:', error);
        });
    }
  }, [promptKey, availableProviders]);

  const promptLength = prompt.trim().length;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const isPromptTooLong = promptLength > MAX_PROMPT_LENGTH;
  const isTextToImageMode = activeTab === 'text-to-image';

  const handleTabChange = (value: string) => {
    const tab = value as ImageGeneratorTab;
    setActiveTab(tab);

    const availableModels = MODEL_OPTIONS.filter(
      (option) => 
        option.scenes.includes(tab) && 
        option.provider === provider &&
        availableProviders.includes(option.provider)
    );

    if (availableModels.length > 0) {
      setModel(availableModels[0].value);
    } else {
      setModel('');
    }

    if (tab === 'text-to-image') {
      setCostCredits(4);
    } else {
      setCostCredits(6);
    }
  };

  const handleProviderChange = (value: string) => {
    setProvider(value);

    const availableModels = MODEL_OPTIONS.filter(
      (option) => 
        option.scenes.includes(activeTab) && 
        option.provider === value &&
        availableProviders.includes(option.provider)
    );

    if (availableModels.length > 0) {
      setModel(availableModels[0].value);
    } else {
      setModel('');
    }
  };

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
      case AITaskStatus.FAILED:
        return 'Generation failed';
      default:
        return '';
    }
  }, [taskStatus]);

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

  const isReferenceUploading = useMemo(
    () => referenceImageItems.some((item) => item.status === 'uploading'),
    [referenceImageItems]
  );

  const hasReferenceUploadError = useMemo(
    () => referenceImageItems.some((item) => item.status === 'error'),
    [referenceImageItems]
  );

  const resetTaskState = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setTaskId(null);
    setGenerationStartTime(null);
    setTaskStatus(null);
    // Don't clear savedTaskIds here - keep it to prevent duplicates across generations
  }, []);

  const saveShowcase = useCallback(async (imageUrl: string, taskIdForTracking: string) => {
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
        const response = await fetch(`/api/proxy/file?url=${encodeURIComponent(imageUrl)}`);
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
           .then(res => {
             if (!res.ok) throw new Error('Upload failed');
             return res.json();
           })
           .then(result => {
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
      console.error('Failed to save showcase:', error);
      // Remove from saved set if failed
      savedTaskIdsRef.current.delete(taskIdForTracking);
    }
  }, [prompt, promptKey]);

  const pollTaskStatus = useCallback(
    async (id: string) => {
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
            if (images.length > 0 && !savedTaskIdsRef.current.has(task.id)) {
              await saveShowcase(images[0].url, task.id);
              toast.success('Image generated successfully');
            }
          }

          setProgress(100);
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
        console.error('Error polling image task:', error);
        toast.error(`Query task failed: ${error.message}`);
        resetTaskState();

        fetchUserCredits();

        return true;
      }
    },
    [generationStartTime, resetTaskState, fetchUserCredits, saveShowcase]
  );

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

  const handleGenerate = async () => {
    console.log('=== Generate Debug Info ===');
    console.log('availableProviders:', availableProviders);
    console.log('current provider:', provider);
    console.log('current model:', model);
    console.log('remainingCredits:', remainingCredits);
    console.log('costCredits:', costCredits);
    
    // Check AI providers FIRST - highest priority
    if (availableProviders.length === 0) {
      console.log('No AI providers configured - showing error');
      toast.error('Please contact the administrator to configure AI models.');
      return;
    }

    // Check if current provider is in available providers
    if (!availableProviders.includes(provider)) {
      console.log('Current provider not in available providers - showing error');
      toast.error('Please contact the administrator to configure AI models.');
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

    if (!provider || !model) {
      toast.error('Provider or model is not configured correctly.');
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
      const options: any = {};

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
          scene: isTextToImageMode ? 'text-to-image' : 'image-to-image',
          provider,
          model,
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

      if (data.status === AITaskStatus.SUCCESS && data.taskInfo) {
        const parsedResult = parseTaskResult(data.taskInfo);
        const imageUrls = extractImageUrls(parsedResult);

        if (imageUrls.length > 0) {
          const images = imageUrls.map((url, index) => ({
            id: `${newTaskId}-${index}`,
            url,
            provider,
            model,
            prompt: trimmedPrompt,
          }));
          setGeneratedImages(images);
          setProgress(100);
          resetTaskState();
          await fetchUserCredits();
          
          // Save showcase - this handles immediate success case
          if (images.length > 0 && !savedTaskIdsRef.current.has(newTaskId)) {
            await saveShowcase(images[0].url, newTaskId);
            toast.success('Image generated successfully');
          }
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

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                {srOnlyTitle && <h2 className="sr-only">{srOnlyTitle}</h2>}
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Wand className="h-5 w-5" />
                  {t('title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
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

                {/* <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('form.provider')}</Label>
                    <Select
                      value={provider}
                      onValueChange={handleProviderChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('form.select_provider')} />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('form.model')}</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('form.select_model')} />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_OPTIONS.filter(
                          (option) =>
                            option.scenes.includes(activeTab) &&
                            option.provider === provider
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div> */}

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
                      isLoadingProviders ||
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
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('sign_in_to_generate')}
                  </Button>
                )}

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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <ImageIcon className="h-5 w-5" />
                  {t('generated_images')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
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

                          <div className="absolute right-2 bottom-2 flex justify-end text-sm">
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
                                  <Download className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
