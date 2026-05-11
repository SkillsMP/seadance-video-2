import { envConfigs } from '@/config';
import { getGenerationCreditCost } from '@/config/ai/credit-costs';
import { findModel, type ModelEntry } from '@/config/ai/models';
import { AIMediaType } from '@/extensions/ai';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';
import { createAITask, NewAITask } from '@/shared/models/ai_task';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { getAIService } from '@/shared/services/ai';

interface GenerateCandidate {
  provider: string;
  model: string;
}

interface GenerateRequest {
  mediaType?: string;
  prompt?: string;
  options?: any;
  scene?: string;
  family?: string;
  candidates?: GenerateCandidate[];
  provider?: string;
  model?: string;
}

export async function POST(request: Request) {
  try {
    const requestBody = (await request.json()) as GenerateRequest;
    let {
      provider,
      mediaType,
      model,
      prompt,
      options,
      scene,
      family,
      candidates,
    } = requestBody;

    if (!mediaType) {
      throw new Error('invalid params');
    }

    if (!prompt && !options) {
      throw new Error('prompt or options is required');
    }
    const requestPrompt = prompt ?? '';

    const aiService = await getAIService();

    if (!aiService.getMediaTypes().includes(mediaType)) {
      throw new Error('invalid mediaType');
    }

    const user = await getUserInfo();
    if (!user) {
      throw new Error('no auth, please sign in');
    }

    if (mediaType === AIMediaType.MUSIC) {
      scene = 'text-to-music';
    }

    const supportCandidatesFallback =
      mediaType === AIMediaType.IMAGE || mediaType === AIMediaType.VIDEO;

    let candidateEntries: ModelEntry[] = [];
    let costCredits: number;

    if (supportCandidatesFallback) {
      if (!family || !scene || !candidates?.length) {
        throw new Error(
          'family, scene and candidates are required for image/video'
        );
      }

      candidateEntries = candidates.map((candidate) => {
        if (!candidate?.provider || !candidate?.model) {
          throw new Error('invalid candidate');
        }

        const entry = findModel(
          mediaType,
          candidate.provider,
          family,
          scene,
          candidate.model
        );

        if (!entry) {
          throw new Error(
            `invalid candidate: ${candidate.provider}/${candidate.model}`
          );
        }

        return entry;
      });

      const entryCostCredits = candidateEntries[0]?.credits[scene];
      if (typeof entryCostCredits !== 'number') {
        throw new Error(`invalid credits: ${family}/${scene}`);
      }
      costCredits = entryCostCredits;
    } else {
      if (!provider || !model) {
        throw new Error('invalid params');
      }

      costCredits = getGenerationCreditCost({
        mediaType,
        scene,
        family,
        model,
      });
    }

    const remainingCredits = await getRemainingCredits(user.id);
    if (remainingCredits < costCredits) {
      throw new Error('insufficient credits');
    }

    const createProviderTask = async (
      providerName: string,
      modelName: string,
      taskOptions = options
    ) => {
      const aiProvider = aiService.getProvider(providerName);
      if (!aiProvider) {
        throw new Error('provider not found');
      }

      const callbackUrl = `${envConfigs.app_url}/api/ai/notify/${providerName}`;
      const params: any = {
        mediaType,
        model: modelName,
        prompt: requestPrompt,
        callbackUrl,
        options: taskOptions,
      };

      const result = await aiProvider.generate({ params });
      if (!result?.taskId) {
        throw new Error(
          `ai generate failed, mediaType: ${mediaType}, provider: ${providerName}, model: ${modelName}`
        );
      }

      return result;
    };

    let finalProvider = provider;
    let finalModel = model;
    let finalOptionsForTask = options;
    let result;

    if (supportCandidatesFallback) {
      if (!scene) {
        throw new Error('invalid scene');
      }

      const candidateErrors: string[] = [];

      for (const entry of candidateEntries) {
        try {
          const enforced = entry.enforced?.[scene] ?? {};
          const finalOptions = { ...(options ?? {}), ...enforced };

          result = await createProviderTask(
            entry.provider,
            entry.value,
            finalOptions
          );
          finalOptionsForTask = finalOptions;
          finalProvider = entry.provider;
          finalModel = entry.value;

          if (candidateErrors.length > 0) {
            console.warn('Model fallback used after candidate failures:', {
              mediaType,
              scene,
              family,
              errors: candidateErrors,
            });
          }

          break;
        } catch (error: any) {
          candidateErrors.push(
            `${entry.provider}/${entry.value}/${scene}: ${error.message}`
          );
        }
      }

      if (!result || !finalProvider || !finalModel) {
        console.error('All model candidates failed:', {
          mediaType,
          scene,
          family,
          errors: candidateErrors,
        });
        throw new Error('All model candidates failed');
      }
    } else if (provider && model) {
      result = await createProviderTask(provider, model);
      finalProvider = provider;
      finalModel = model;
    } else {
      throw new Error('invalid params');
    }

    if (!result || !finalProvider || !finalModel) {
      throw new Error('ai generate failed');
    }

    const newAITask: NewAITask = {
      id: getUuid(),
      userId: user.id,
      mediaType,
      provider: finalProvider,
      model: finalModel,
      prompt: requestPrompt,
      scene,
      options: finalOptionsForTask ? JSON.stringify(finalOptionsForTask) : null,
      status: result.taskStatus,
      costCredits,
      taskId: result.taskId,
      taskInfo: result.taskInfo ? JSON.stringify(result.taskInfo) : null,
      taskResult: result.taskResult ? JSON.stringify(result.taskResult) : null,
    };
    await createAITask(newAITask);

    return respData(newAITask);
  } catch (e: any) {
    console.log('generate failed', e);
    return respErr(e.message);
  }
}
