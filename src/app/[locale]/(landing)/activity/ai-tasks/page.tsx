import { getTranslations } from 'next-intl/server';

import { AITaskStatus } from '@/extensions/ai';
import { Empty } from '@/shared/blocks/common';
import { TableCard } from '@/shared/blocks/table';
import { AITask, getAITasks, getAITasksCount } from '@/shared/models/ai_task';
import { getUserInfo } from '@/shared/models/user';
import { Button, Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

import { PromptEllipsis } from './_components/prompt-ellipsis';
import { TaskResultCell } from './_components/task-result-cell';

const taskTypeTabs = ['all', 'image', 'video'] as const;
type TaskTypeTab = (typeof taskTypeTabs)[number];

function isTaskTypeTab(type?: string): type is TaskTypeTab {
  return Boolean(type && taskTypeTabs.includes(type as TaskTypeTab));
}

export default async function AiTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number; type?: string }>;
}) {
  const { page: pageNum, pageSize, type } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;
  const selectedType = isTaskTypeTab(type) ? type : 'all';
  const mediaType = selectedType === 'all' ? undefined : selectedType;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations('activity.ai-tasks');
  const getMessage = (key: string, fallback: string) =>
    t.has(key) ? t(key) : fallback;
  const errorMessages = {
    'list.errors.failed': getMessage(
      'list.errors.failed',
      'Generation failed. Please try again.'
    ),
    'list.errors.canceled': getMessage(
      'list.errors.canceled',
      'This task was canceled.'
    ),
    'list.errors.moderation_blocked': getMessage(
      'list.errors.moderation_blocked',
      'This result cannot be shown because it did not pass safety review.'
    ),
    'list.errors.moderation_failed': getMessage(
      'list.errors.moderation_failed',
      'This result cannot be verified right now and cannot be shown.'
    ),
    'list.errors.safety_blocked': getMessage(
      'list.errors.safety_blocked',
      'This request or result could not pass safety review.'
    ),
    'list.errors.timeout': getMessage(
      'list.errors.timeout',
      'The generation timed out. Please try again.'
    ),
    'list.errors.no_result': getMessage(
      'list.errors.no_result',
      'The provider returned no usable result. Please try again.'
    ),
  };

  const aiTasks = await getAITasks({
    userId: user.id,
    mediaType,
    page,
    limit,
  });

  const total = await getAITasksCount({
    userId: user.id,
    mediaType,
  });

  const table: Table = {
    title: t('list.title'),
    columns: [
      {
        name: 'prompt',
        title: t('fields.prompt'),
        className: 'min-w-56 max-w-[320px]',
        callback: (item: AITask) => (
          <PromptEllipsis
            prompt={item.prompt}
            copyLabel={t('list.buttons.copy_prompt')}
            copiedLabel={t('list.messages.prompt_copied')}
          />
        ),
      },
      {
        name: 'result',
        title: t('fields.result'),
        callback: (item: AITask) => (
          <TaskResultCell
            taskInfo={item.taskInfo}
            taskResult={item.taskResult}
            mediaType={item.mediaType}
            status={item.status}
            downloadLabel={t('list.buttons.download')}
            errorMessages={errorMessages}
          />
        ),
      },
      { name: 'mediaType', title: t('fields.media_type'), type: 'label' },
      { name: 'model', title: t('fields.model'), type: 'label' },
      // { name: 'options', title: t('fields.options'), type: 'copy' },
      { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'costCredits', title: t('fields.cost_credits'), type: 'label' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      {
        name: 'action',
        title: t('fields.action'),
        type: 'dropdown',
        callback: (item: AITask) => {
          const items: Button[] = [];

          if (
            item.status === AITaskStatus.PENDING ||
            item.status === AITaskStatus.PROCESSING
          ) {
            items.push({
              title: t('list.buttons.refresh'),
              url: `/activity/ai-tasks/${item.id}/refresh`,
              icon: 'RiRefreshLine',
            });
          }

          return items;
        },
      },
    ],
    data: aiTasks,
    emptyMessage: t('list.empty_message'),
    pagination: {
      total,
      page,
      limit,
    },
  };

  const tabs: Tab[] = taskTypeTabs.map((taskType) => ({
    name: taskType,
    title: t(`list.tabs.${taskType}`),
    url:
      taskType === 'all'
        ? '/activity/ai-tasks'
        : `/activity/ai-tasks?type=${taskType}`,
    is_active: selectedType === taskType,
  }));

  return (
    <div className="space-y-8">
      <TableCard title={t('list.title')} tabs={tabs} table={table} />
    </div>
  );
}
