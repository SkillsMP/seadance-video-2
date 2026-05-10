'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Download,
  Loader2,
  Sparkles,
  User,
  Video,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { getGenerationCreditCost } from '@/config/ai/credit-costs';
import { Link } from '@/core/i18n/navigation';
import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import { ImageUploader, ImageUploaderValue } from '@/shared/blocks/common';
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

interface VideoGeneratorProps {
  maxSizeMB?: number;
  srOnlyTitle?: string;
}

interface GeneratedVideo {
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

type VideoGeneratorTab = 'text-to-video' | 'image-to-video' | 'video-to-video';

interface VideoModelOption {
  family: string;
  value: string;
  label: string;
  provider: string;
  scenes: VideoGeneratorTab[];
}

const POLL_INTERVAL = 15000;
const GENERATION_TIMEOUT = 600000; // 10 minutes for video
const MAX_PROMPT_LENGTH = 2000;

const MODEL_OPTIONS: VideoModelOption[] = [
  // Kie models
  {
    family: 'seedance-2-fast-720p',
    value: 'bytedance/seedance-2-fast',
    label: 'Seedance 2.0 Fast 720p',
    provider: 'kie',
    scenes: ['text-to-video'],
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
  // Replicate models
  // 临时停用：Replicate 视频模型成本过高，先注释掉避免被选用
  // {
  //   family: 'veo-3-1',
  //   value: 'google/veo-3.1',
  //   label: 'Veo 3.1',
  //   provider: 'replicate',
  //   scenes: ['text-to-video', 'image-to-video'],
  // },
  // {
  //   family: 'sora-2',
  //   value: 'openai/sora-2',
  //   label: 'Sora 2',
  //   provider: 'replicate',
  //   scenes: ['text-to-video', 'image-to-video'],
  // },
  // Fal models
  // {
  //   family: 'veo-3',
  //   value: 'fal-ai/veo3',
  //   label: 'Veo 3',
  //   provider: 'fal',
  //   scenes: ['text-to-video'],
  // },
  // {
  //   family: 'wan-pro',
  //   value: 'fal-ai/wan-pro/image-to-video',
  //   label: 'Wan Pro',
  //   provider: 'fal',
  //   scenes: ['image-to-video'],
  // },
  // {
  //   family: 'kling-video-o1',
  //   value: 'fal-ai/kling-video/o1/video-to-video/edit',
  //   label: 'Kling Video O1',
  //   provider: 'fal',
  //   scenes: ['video-to-video'],
  // },
];

function dedupeModelFamilies(options: VideoModelOption[]) {
  const seenFamilies = new Set<string>();

  return options.filter((option) => {
    if (seenFamilies.has(option.family)) {
      return false;
    }

    seenFamilies.add(option.family);
    return true;
  });
}

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

function extractVideoUrls(result: any): string[] {
  if (!result) {
    return [];
  }

  // check videos array first
  const videos = result.videos;
  if (videos && Array.isArray(videos)) {
    return videos
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
          return (
            item.url ?? item.uri ?? item.video ?? item.src ?? item.videoUrl
          );
        }
        return null;
      })
      .filter(Boolean);
  }

  // check output
  const output = result.output ?? result.video ?? result.data;

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
            item.url ?? item.uri ?? item.video ?? item.src ?? item.videoUrl;
          return typeof candidate === 'string' ? [candidate] : [];
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof output === 'object') {
    const candidate =
      output.url ?? output.uri ?? output.video ?? output.src ?? output.videoUrl;
    if (typeof candidate === 'string') {
      return [candidate];
    }
  }

  return [];
}

export function VideoGenerator({
  maxSizeMB = 50,
  srOnlyTitle,
}: VideoGeneratorProps) {
  const t = useTranslations('ai.video.generator');

  const [activeTab, setActiveTab] =
    useState<VideoGeneratorTab>('text-to-video');

  const [selectedFamily, setSelectedFamily] = useState('');
  const [prompt, setPrompt] = useState('');
  const [referenceImageItems, setReferenceImageItems] = useState<
    ImageUploaderValue[]
  >([]);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [referenceVideoUrl, setReferenceVideoUrl] = useState<string>('');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [taskStatus, setTaskStatus] = useState<AITaskStatus | null>(null);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  const { user, isCheckSign, setIsShowSignModal, fetchUserCredits } =
    useAppContext();

  useEffect(() => {
    setIsMounted(true);

    fetch('/api/ai/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0 && data.data?.providers !== undefined) {
          setAvailableProviders(data.data.providers || []);
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

  const promptLength = prompt.trim().length;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const isPromptTooLong = promptLength > MAX_PROMPT_LENGTH;
  const costCredits = useMemo(
    () =>
      getGenerationCreditCost({
        mediaType: AIMediaType.VIDEO,
        scene: activeTab,
        family: selectedFamily,
      }),
    [activeTab, selectedFamily]
  );
  const isTextToVideoMode = activeTab === 'text-to-video';
  const isImageToVideoMode = activeTab === 'image-to-video';
  const isVideoToVideoMode = activeTab === 'video-to-video';
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

  const handleTabChange = (value: string) => {
    const tab = value as VideoGeneratorTab;
    setActiveTab(tab);
  };

  const taskStatusLabel = useMemo(() => {
    if (!taskStatus) {
      return '';
    }

    switch (taskStatus) {
      case AITaskStatus.PENDING:
        return 'Waiting for the model to start';
      case AITaskStatus.PROCESSING:
        return 'Generating your video...';
      case AITaskStatus.SUCCESS:
        return 'Video generation completed';
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
  }, []);

  const pollTaskStatus = useCallback(
    async (id: string) => {
      try {
        if (
          generationStartTime &&
          Date.now() - generationStartTime > GENERATION_TIMEOUT
        ) {
          resetTaskState();
          toast.error('Video generation timed out. Please try again.');
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
        const videoUrls = extractVideoUrls(parsedResult);

        if (currentStatus === AITaskStatus.PENDING) {
          setProgress((prev) => Math.max(prev, 20));
          return false;
        }

        if (currentStatus === AITaskStatus.PROCESSING) {
          if (videoUrls.length > 0) {
            setGeneratedVideos(
              videoUrls.map((url, index) => ({
                id: `${task.id}-${index}`,
                url,
                provider: task.provider,
                model: task.model,
                prompt: task.prompt ?? undefined,
              }))
            );
            setProgress((prev) => Math.max(prev, 85));
          } else {
            setProgress((prev) => Math.min(prev + 5, 80));
          }
          return false;
        }

        if (currentStatus === AITaskStatus.SUCCESS) {
          if (videoUrls.length === 0) {
            toast.error('The provider returned no videos. Please retry.');
          } else {
            setGeneratedVideos(
              videoUrls.map((url, index) => ({
                id: `${task.id}-${index}`,
                url,
                provider: task.provider,
                model: task.model,
                prompt: task.prompt ?? undefined,
              }))
            );
            toast.success('Video generated successfully');
          }

          setProgress(100);
          resetTaskState();
          return true;
        }

        if (currentStatus === AITaskStatus.FAILED) {
          const errorMessage =
            parsedResult?.errorMessage || 'Generate video failed';
          toast.error(errorMessage);
          resetTaskState();

          fetchUserCredits();

          return true;
        }

        setProgress((prev) => Math.min(prev + 3, 95));
        return false;
      } catch (error: any) {
        console.error('Error polling video task:', error);
        toast.error(`Query task failed: ${error.message}`);
        resetTaskState();

        fetchUserCredits();

        return true;
      }
    },
    [generationStartTime, resetTaskState, fetchUserCredits]
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
    const trimmedReferenceVideoUrl = referenceVideoUrl.trim();
    if (!trimmedPrompt && isTextToVideoMode) {
      toast.error('Please enter a prompt before generating.');
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

    setIsGenerating(true);
    setProgress(15);
    setTaskStatus(AITaskStatus.PENDING);
    setGeneratedVideos([]);
    setGenerationStartTime(Date.now());

    try {
      const options: any = {};

      if (isImageToVideoMode) {
        options.image_input = referenceImageUrls;
      }

      if (isVideoToVideoMode) {
        options.video_input = [trimmedReferenceVideoUrl];
      }

      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: AIMediaType.VIDEO,
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
        throw new Error(message || 'Failed to create a video task');
      }

      const newTaskId = data?.id;
      if (!newTaskId) {
        throw new Error('Task id missing in response');
      }

      if (data.status === AITaskStatus.SUCCESS && data.taskInfo) {
        const parsedResult = parseTaskResult(data.taskInfo);
        const videoUrls = extractVideoUrls(parsedResult);

        if (videoUrls.length > 0) {
          setGeneratedVideos(
            videoUrls.map((url, index) => ({
              id: `${newTaskId}-${index}`,
              url,
              provider: data.provider,
              model: data.model,
              prompt: trimmedPrompt,
            }))
          );
          toast.success('Video generated successfully');
          setProgress(100);
          resetTaskState();
          await fetchUserCredits();
          return;
        }
      }

      setTaskId(newTaskId);
      setProgress(25);

      await fetchUserCredits();
    } catch (error: any) {
      console.error('Failed to generate video:', error);
      toast.error(`Failed to generate video: ${error.message}`);
      resetTaskState();
    }
  };

  const handleDownloadVideo = async (video: GeneratedVideo) => {
    if (!video.url) {
      return;
    }

    try {
      setDownloadingVideoId(video.id);
      // fetch video via proxy
      const resp = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(video.url)}`
      );
      if (!resp.ok) {
        throw new Error('Failed to fetch video');
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success('Video downloaded');
    } catch (error) {
      console.error('Failed to download video:', error);
      toast.error('Failed to download video');
    } finally {
      setDownloadingVideoId(null);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                {srOnlyTitle && <h2 className="sr-only">{srOnlyTitle}</h2>}
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  {t('title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="bg-primary/10 grid w-full grid-cols-3">
                    <TabsTrigger value="text-to-video">
                      {t('tabs.text-to-video')}
                    </TabsTrigger>
                    <TabsTrigger value="image-to-video">
                      {t('tabs.image-to-video')}
                    </TabsTrigger>
                    <TabsTrigger value="video-to-video">
                      {t('tabs.video-to-video')}
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

                {isImageToVideoMode && (
                  <div className="space-y-4">
                    <ImageUploader
                      title={t('form.reference_image')}
                      allowMultiple={true}
                      maxImages={3}
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

                {isVideoToVideoMode && (
                  <div className="space-y-2">
                    <Label htmlFor="video-url">
                      {t('form.reference_video')}
                    </Label>
                    <Textarea
                      id="video-url"
                      value={referenceVideoUrl}
                      onChange={(e) => setReferenceVideoUrl(e.target.value)}
                      placeholder={t('form.reference_video_placeholder')}
                      className="min-h-20"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="video-prompt">{t('form.prompt')}</Label>
                  <Textarea
                    id="video-prompt"
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
                      !canGenerateForModelSelection ||
                      (isTextToVideoMode && !prompt.trim()) ||
                      isPromptTooLong ||
                      isReferenceUploading ||
                      hasReferenceUploadError ||
                      (isImageToVideoMode && referenceImageUrls.length === 0) ||
                      (isVideoToVideoMode && !referenceVideoUrl.trim())
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

                {!isMounted ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span>{t('credits_remaining', { credits: 0 })}</span>
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
                  <Video className="h-5 w-5" />
                  {t('generated_videos')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                {generatedVideos.length > 0 ? (
                  <div className="space-y-6">
                    {generatedVideos.map((video) => (
                      <div key={video.id} className="space-y-3">
                        <div className="relative overflow-hidden rounded-lg border">
                          <video
                            src={video.url}
                            controls
                            className="h-auto w-full"
                            preload="metadata"
                          />

                          <div className="absolute right-2 bottom-2 flex justify-end text-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto"
                              onClick={() => handleDownloadVideo(video)}
                              disabled={downloadingVideoId === video.id}
                            >
                              {downloadingVideoId === video.id ? (
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
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Video className="text-muted-foreground h-10 w-10" />
                    </div>
                    <p className="text-muted-foreground">
                      {isGenerating
                        ? t('ready_to_generate')
                        : t('no_videos_generated')}
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
