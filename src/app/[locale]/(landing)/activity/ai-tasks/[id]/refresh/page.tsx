import { redirect } from '@/core/i18n/navigation';
import { AITaskStatus } from '@/extensions/ai';
import { Empty } from '@/shared/blocks/common';
import {
  findAITaskById,
  type UpdateAITask,
  updateAITaskById,
} from '@/shared/models/ai_task';
import { getUserInfo } from '@/shared/models/user';
import { getAIService } from '@/shared/services/ai';
import { applyGenerationOutputModeration } from '@/shared/services/moderation';

const TERMINAL_TASK_STATUSES = new Set<string>([
  AITaskStatus.SUCCESS,
  AITaskStatus.FAILED,
  AITaskStatus.CANCELED,
  AITaskStatus.MODERATION_BLOCKED,
  AITaskStatus.MODERATION_FAILED,
]);

export default async function RefreshAITaskPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="No auth, please sign in" />;
  }

  const task = await findAITaskById(id);
  if (!task || !task.taskId || !task.provider || !task.status) {
    return <Empty message="Task not found" />;
  }

  if (task.userId !== user.id) {
    return <Empty message="No permission" />;
  }

  if (TERMINAL_TASK_STATUSES.has(task.status)) {
    redirect({ href: `/activity/ai-tasks`, locale });
  }

  // query task
  if (
    [AITaskStatus.PENDING, AITaskStatus.PROCESSING].includes(
      task.status as AITaskStatus
    )
  ) {
    const aiService = await getAIService();
    const aiProvider = aiService.getProvider(task.provider);
    if (!aiProvider) {
      return <Empty message="Invalid AI provider" />;
    }

    const result = await aiProvider?.query?.({
      taskId: task.taskId,
      mediaType: task.mediaType,
      model: task.model,
    });

    if (result?.taskStatus) {
      const moderatedResult = await applyGenerationOutputModeration({
        taskId: task.id,
        userId: task.userId,
        mediaType: task.mediaType,
        scene: task.scene,
        taskStatus: result.taskStatus,
        taskInfo: result.taskInfo,
        taskResult: result.taskResult,
      });

      const updateAITask: UpdateAITask = {
        status: moderatedResult.status,
        taskInfo: moderatedResult.taskInfo
          ? JSON.stringify(moderatedResult.taskInfo)
          : null,
        taskResult: moderatedResult.taskResult
          ? JSON.stringify(moderatedResult.taskResult)
          : null,
        creditId: task.creditId,
      };

      if (
        updateAITask.status !== task.status ||
        updateAITask.taskInfo !== task.taskInfo ||
        updateAITask.taskResult !== task.taskResult
      ) {
        await updateAITaskById(task.id, updateAITask);
      }
    }
  }

  redirect({ href: `/activity/ai-tasks`, locale });
}
