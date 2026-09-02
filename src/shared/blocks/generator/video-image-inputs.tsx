'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { VIDEO_IMAGE_MODES, type VideoImageMode } from '@/config/ai/models';
import { ImageUploader, type ImageUploaderValue } from '@/shared/blocks/common';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/components/ui/toggle-group';
import { cn } from '@/shared/lib/utils';

type VideoImageInputKind = 'frames' | 'reference_images';

export interface VideoImageInputValue {
  mode: VideoImageMode;
  imageUrls: string[];
}

export interface VideoImageInputsState {
  activeKind: VideoImageInputKind;
  value: VideoImageInputValue | null;
  isUploading: boolean;
  hasError: boolean;
}

interface VideoImageInputsProps {
  maxSizeMB?: number;
  imageModes?: readonly VideoImageMode[];
  referenceMinImages?: number;
  referenceMaxImages?: number;
  onChange?: (state: VideoImageInputsState) => void;
}

function getUploadedUrls(items: ImageUploaderValue[]): string[] {
  return items
    .filter((item) => item.status === 'uploaded' && item.url)
    .map((item) => item.url as string);
}

function hasUploadStatus(
  items: ImageUploaderValue[],
  status: ImageUploaderValue['status']
): boolean {
  return items.some((item) => item.status === status);
}

export function VideoImageInputs({
  maxSizeMB,
  imageModes = VIDEO_IMAGE_MODES,
  referenceMinImages = 2,
  referenceMaxImages = 3,
  onChange,
}: VideoImageInputsProps) {
  const t = useTranslations('ai.video.generator');
  const sizeHint = t('form.image_size_hint', { size: maxSizeMB ?? 10 });
  const [selectedKind, setSelectedKind] =
    useState<VideoImageInputKind>('frames');
  const [startFrameItems, setStartFrameItems] = useState<ImageUploaderValue[]>(
    []
  );
  const [endFrameItems, setEndFrameItems] = useState<ImageUploaderValue[]>([]);
  const [referenceImageItems, setReferenceImageItems] = useState<
    ImageUploaderValue[]
  >([]);
  const startFrameContainerRef = useRef<HTMLDivElement>(null);
  const supportsFirstFrame = imageModes.includes('first_frame');
  const supportsEndFrame = imageModes.includes('first_last_frames');
  const supportsFrames = supportsFirstFrame || supportsEndFrame;
  const supportsReferenceImages = imageModes.includes('reference_images');
  const activeKind: VideoImageInputKind =
    selectedKind === 'reference_images' && supportsReferenceImages
      ? 'reference_images'
      : supportsFrames
        ? 'frames'
        : 'reference_images';

  const hasStartFrame = getUploadedUrls(startFrameItems).length === 1;
  const hasEndFrameDraft = endFrameItems.length > 0;
  const isEndFrameLocked = !hasStartFrame;

  const minimumReferenceImages = Math.max(
    1,
    Math.min(referenceMinImages, referenceMaxImages)
  );
  const maximumReferenceImages = Math.max(
    minimumReferenceImages,
    referenceMaxImages
  );

  const state = useMemo<VideoImageInputsState>(() => {
    if (activeKind === 'reference_images') {
      const imageUrls = getUploadedUrls(referenceImageItems);

      return {
        activeKind,
        value:
          imageUrls.length >= minimumReferenceImages &&
          imageUrls.length <= maximumReferenceImages
            ? {
                mode: 'reference_images',
                imageUrls,
              }
            : null,
        isUploading: hasUploadStatus(referenceImageItems, 'uploading'),
        hasError: hasUploadStatus(referenceImageItems, 'error'),
      };
    }

    const startImageUrls = getUploadedUrls(startFrameItems);
    const endImageUrls = getUploadedUrls(endFrameItems);
    const activeFrameItems = supportsEndFrame
      ? [...startFrameItems, ...endFrameItems]
      : startFrameItems;
    let value: VideoImageInputValue | null = null;

    if (startImageUrls.length === 1) {
      if (supportsEndFrame && endImageUrls.length === 1) {
        value = {
          mode: 'first_last_frames',
          imageUrls: [startImageUrls[0], endImageUrls[0]],
        };
      } else if (supportsFirstFrame) {
        value = {
          mode: 'first_frame',
          imageUrls: startImageUrls,
        };
      }
    }

    return {
      activeKind,
      value,
      isUploading: hasUploadStatus(activeFrameItems, 'uploading'),
      hasError: hasUploadStatus(activeFrameItems, 'error'),
    };
  }, [
    activeKind,
    endFrameItems,
    maximumReferenceImages,
    minimumReferenceImages,
    referenceImageItems,
    startFrameItems,
    supportsEndFrame,
    supportsFirstFrame,
  ]);

  useEffect(() => {
    if (selectedKind !== activeKind) {
      setSelectedKind(activeKind);
    }
  }, [activeKind, selectedKind]);

  useEffect(() => {
    onChange?.(state);
  }, [onChange, state]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-foreground text-sm font-medium">
          {t('form.image_input')}
        </p>

        {supportsFrames && supportsReferenceImages && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={activeKind}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-stretch gap-2"
            onValueChange={(value) => {
              if (value) {
                setSelectedKind(value as VideoImageInputKind);
              }
            }}
            aria-label={t('form.image_input')}
          >
            <ToggleGroupItem
              value="frames"
              className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 h-auto min-h-8 rounded-md px-3 py-2 leading-tight whitespace-normal data-[state=on]:shadow-sm data-[variant=outline]:border-l"
            >
              {t('form.frames')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="reference_images"
              className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 h-auto min-h-8 rounded-md px-3 py-2 leading-tight whitespace-normal data-[state=on]:shadow-sm data-[variant=outline]:border-l"
            >
              {t('form.reference_images_mode', {
                min: minimumReferenceImages,
                max: maximumReferenceImages,
              })}
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      <div
        className={cn(
          'space-y-3',
          (!supportsFrames || activeKind !== 'frames') && 'hidden'
        )}
      >
        <div
          className={cn('grid gap-4', supportsEndFrame && 'sm:grid-cols-2')}
        >
          <div
            ref={startFrameContainerRef}
            tabIndex={-1}
            role="group"
            aria-label={t('form.start_image')}
            className="focus:ring-primary/60 space-y-2 rounded-xl transition-shadow outline-none focus:ring-2 focus:ring-offset-2"
          >
            <p className="text-foreground text-sm font-medium">
              {t('form.start_image')}{' '}
              <span className="text-muted-foreground font-normal">
                · {t('form.required')}
              </span>
            </p>
            <ImageUploader
              disabled={!supportsFrames}
              maxSizeMB={maxSizeMB}
              uploadLabel={t('form.upload_image')}
              sizeHint={sizeHint}
              onChange={setStartFrameItems}
            />
            {isEndFrameLocked && hasEndFrameDraft && (
              <p className="text-muted-foreground text-xs">
                {t('form.start_image_required')}
              </p>
            )}
          </div>

          <div className={cn('space-y-2', !supportsEndFrame && 'hidden')}>
            <p className="text-foreground text-sm font-medium">
              {t('form.end_image')}{' '}
              <span className="text-muted-foreground font-normal">
                · {t('form.optional')}
              </span>
            </p>
            <div className="relative w-fit max-w-full">
              <div
                className={cn(
                  'transition-opacity',
                  isEndFrameLocked && 'opacity-60'
                )}
                aria-hidden={isEndFrameLocked}
              >
                <ImageUploader
                  disabled={!supportsEndFrame || isEndFrameLocked}
                  maxSizeMB={maxSizeMB}
                  uploadLabel={t('form.add_end_frame')}
                  sizeHint={sizeHint}
                  onChange={setEndFrameItems}
                />
              </div>

              {supportsEndFrame && isEndFrameLocked && (
                <button
                  type="button"
                  className={cn(
                    'border-border/80 bg-muted/85 text-muted-foreground absolute inset-0 z-20 flex cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-3 text-center transition-colors',
                    hasEndFrameDraft && 'bg-background/45 backdrop-blur-[1px]'
                  )}
                  onClick={() => startFrameContainerRef.current?.focus()}
                >
                  <span className="border-border bg-background/70 flex h-9 w-9 items-center justify-center rounded-full border border-dashed">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium">
                    {t(
                      hasEndFrameDraft
                        ? 'form.end_frame_waiting_for_start'
                        : 'form.upload_start_image_first'
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-xs">
          {t('form.frames_hint')}
        </p>
      </div>

      <div
        className={cn(
          'space-y-3',
          (!supportsReferenceImages || activeKind !== 'reference_images') &&
            'hidden'
        )}
      >
        <p className="text-foreground text-sm font-medium">
          {t('form.reference_images')}
        </p>
        <ImageUploader
          allowMultiple={true}
          disabled={!supportsReferenceImages}
          maxImages={maximumReferenceImages}
          maxSizeMB={maxSizeMB}
          uploadLabel={t('form.upload_image')}
          sizeHint={sizeHint}
          onChange={setReferenceImageItems}
        />

        <p className="text-muted-foreground text-xs">
          {t('form.reference_images_hint', {
            min: minimumReferenceImages,
            max: maximumReferenceImages,
          })}
        </p>
      </div>

      {state.hasError && (
        <p className="text-destructive text-xs">
          {t('form.some_images_failed_to_upload')}
        </p>
      )}
    </div>
  );
}
