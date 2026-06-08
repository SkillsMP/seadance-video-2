'use client';

import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';

export function PromptEllipsis({
  prompt,
  copyLabel = 'Copy prompt',
  copiedLabel = 'Prompt copied',
  className,
}: {
  prompt?: string | null;
  copyLabel?: string;
  copiedLabel?: string;
  className?: string;
}) {
  const value = prompt?.trim();

  if (!value) {
    return <span className={className}>-</span>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(copiedLabel);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  return (
    <div className={cn('flex max-w-[280px] items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="min-w-0 flex-1 truncate text-left" title={value}>
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-h-80 max-w-sm overflow-y-auto break-words whitespace-pre-wrap"
        >
          {value}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={handleCopy}
            aria-label={copyLabel}
          >
            <CopyIcon className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{copyLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}
