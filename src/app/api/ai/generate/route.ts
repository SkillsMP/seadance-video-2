import { envConfigs } from '@/config';
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
    let { provider, mediaType, model, prompt, options, scene, candidates } =
      requestBody;

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

    let costCredits = 4;

    if (mediaType === AIMediaType.IMAGE) {
      if (scene === 'image-to-image') {
        costCredits = 6;
      } else if (scene === 'text-to-image') {
        costCredits = 4;
      } else {
        throw new Error('invalid scene');
      }
    } else if (mediaType === AIMediaType.VIDEO) {
      if (scene === 'text-to-video') {
        costCredits = 6;
      } else if (scene === 'image-to-video') {
        costCredits = 8;
      } else if (scene === 'video-to-video') {
        costCredits = 10;
      } else {
        throw new Error('invalid scene');
      }
    } else if (mediaType === AIMediaType.MUSIC) {
      costCredits = 10;
      scene = 'text-to-music';
    } else {
      throw new Error('invalid mediaType');
    }

    const remainingCredits = await getRemainingCredits(user.id);
    if (remainingCredits < costCredits) {
      throw new Error('insufficient credits');
    }

    const createProviderTask = async (
      providerName: string,
      modelName: string
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
        options,
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
    let result;

    const supportCandidatesFallback =
      mediaType === AIMediaType.IMAGE || mediaType === AIMediaType.VIDEO;

    if (supportCandidatesFallback && candidates?.length) {
      const candidateErrors: string[] = [];

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
    } else if (provider && model) {
      result = await createProviderTask(provider, model);
      finalProvider = provider;
      finalModel = model;
    } else {
      throw new Error('invalid params');
    }

    const newAITask: NewAITask = {
      id: getUuid(),
      userId: user.id,
      mediaType,
      provider: finalProvider,
      model: finalModel,
      prompt: requestPrompt,
      scene,
      options: options ? JSON.stringify(options) : null,
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
