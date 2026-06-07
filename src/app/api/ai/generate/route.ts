import { envConfigs } from '@/config';
import { assertSafeAssetInputUrls } from '@/config/ai/asset-url-security';
import { getGenerationCreditCost } from '@/config/ai/credit-costs';
import {
  assertGenerationPricingConsistency,
  resolveGenerationPricingSnapshot,
  type GenerationPricingSnapshot,
} from '@/config/ai/generation-pricing';
import { findModel, type ModelEntry } from '@/config/ai/models';
import { AIMediaType } from '@/extensions/ai';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';
import { createAITask, NewAITask } from '@/shared/models/ai_task';
import { getRemainingCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';
import { getAIService } from '@/shared/services/ai';
import {
  applyGenerationOutputModeration,
  moderateGenerationInput,
} from '@/shared/services/moderation';

interface GenerateCandidate {
  provider: string;
  model: string;
}

interface GenerateRequest {
  mediaType?: string;
  prompt?: string;
  options?: unknown;
  scene?: string;
  family?: string;
  candidates?: GenerateCandidate[];
  provider?: string;
  model?: string;
}

interface GenerateCandidatePlan {
  entry: ModelEntry;
  finalOptions: unknown;
}

type CandidateErrorType =
  | 'provider_network_timeout'
  | 'provider_network_reset'
  | 'provider_dns_error'
  | 'provider_connection_refused'
  | 'provider_payload_error'
  | 'provider_auth_error'
  | 'provider_forbidden'
  | 'provider_rate_limited'
  | 'provider_balance_error'
  | 'provider_unknown_error';

interface CandidateErrorInfo {
  provider: string;
  model: string;
  family: string;
  scene: string;
  mediaType: string;
  type: CandidateErrorType;
  message: string;
  causeCode?: string;
}

function getErrorCauseCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause && typeof cause === 'object' && 'code' in cause) {
    const code = (cause as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }

  const code = (error as Error & { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function classifyCandidateError(error: unknown): CandidateErrorType {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  const causeCode = getErrorCauseCode(error);

  if (
    causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
    causeCode === 'UND_ERR_HEADERS_TIMEOUT' ||
    causeCode === 'UND_ERR_BODY_TIMEOUT' ||
    causeCode === 'ETIMEDOUT'
  ) {
    return 'provider_network_timeout';
  }

  if (causeCode === 'ECONNRESET') {
    return 'provider_network_reset';
  }

  if (causeCode === 'ENOTFOUND' || causeCode === 'EAI_AGAIN') {
    return 'provider_dns_error';
  }

  if (causeCode === 'ECONNREFUSED') {
    return 'provider_connection_refused';
  }

  if (/\b400\b/.test(message)) {
    return 'provider_payload_error';
  }

  if (/\b401\b/.test(message)) {
    return 'provider_auth_error';
  }

  if (/\b403\b/.test(message)) {
    return 'provider_forbidden';
  }

  if (/\b429\b/.test(message)) {
    return 'provider_rate_limited';
  }

  if (lowerMessage.includes('insufficient') || lowerMessage.includes('balance')) {
    return 'provider_balance_error';
  }

  return 'provider_unknown_error';
}

function getUserMessageFromCandidateErrors(
  errors: CandidateErrorInfo[]
): string {
  const firstType = errors[0]?.type;
  if (!firstType || errors.some((error) => error.type !== firstType)) {
    return 'All AI model candidates failed. Please retry later.';
  }

  switch (firstType) {
    case 'provider_network_timeout':
    case 'provider_network_reset':
    case 'provider_dns_error':
    case 'provider_connection_refused':
      return 'AI provider connection failed. Please retry later or check server network settings.';
    case 'provider_auth_error':
      return 'AI provider API key is invalid or unavailable.';
    case 'provider_payload_error':
      return 'AI provider rejected the request. Please check model options or uploaded image format.';
    case 'provider_rate_limited':
      return 'AI provider is rate limited. Please retry later.';
    case 'provider_balance_error':
      return 'AI provider balance may be insufficient. Please check provider account.';
    default:
      return 'All AI model candidates failed. Please retry later.';
  }
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
    let pricingSnapshot: GenerationPricingSnapshot | undefined;

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

      const firstEntry = candidateEntries[0];
      if (!firstEntry) {
        throw new Error('invalid candidate');
      }

      pricingSnapshot = resolveGenerationPricingSnapshot({
        mediaType,
        scene,
        entry: firstEntry,
        options,
      });
      assertSafeAssetInputUrls(pricingSnapshot.finalOptions);
      costCredits = pricingSnapshot.costCredits;
    } else {
      // Legacy non image/video path; music keeps fixed pricing for now.
      if (!provider || !model) {
        throw new Error('invalid params');
      }

      costCredits = getGenerationCreditCost({ mediaType, scene });
    }

    const remainingCredits = await getRemainingCredits(user.id);
    if (remainingCredits < costCredits) {
      throw new Error('insufficient credits');
    }

    const createProviderTask = async (
      providerName: string,
      modelName: string,
      taskOptions?: unknown
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
    let finalOptionsForTask: unknown = options;
    let result;

    if (supportCandidatesFallback) {
      if (!scene || !pricingSnapshot) {
        throw new Error('invalid scene');
      }

      const candidatePlans: GenerateCandidatePlan[] = candidateEntries.map(
        (entry) => {
          const candidatePricingSnapshot = resolveGenerationPricingSnapshot({
            mediaType,
            scene,
            entry,
            options,
          });
          const finalOptions = candidatePricingSnapshot.finalOptions;
          assertSafeAssetInputUrls(finalOptions);
          assertGenerationPricingConsistency(
            pricingSnapshot,
            candidatePricingSnapshot
          );

          return {
            entry,
            finalOptions,
          };
        }
      );
      const firstCandidatePlan = candidatePlans[0];
      if (!firstCandidatePlan) {
        throw new Error('invalid candidate');
      }

      await moderateGenerationInput({
        userId: user.id,
        mediaType,
        scene,
        prompt: requestPrompt,
        options: firstCandidatePlan.finalOptions,
      });

      const candidateErrors: CandidateErrorInfo[] = [];

      for (const { entry, finalOptions } of candidatePlans) {
        try {
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
        } catch (error: unknown) {
          candidateErrors.push({
            provider: entry.provider,
            model: entry.value,
            family: entry.family,
            scene,
            mediaType,
            type: classifyCandidateError(error),
            message: error instanceof Error ? error.message : String(error),
            causeCode: getErrorCauseCode(error),
          });
        }
      }

      if (!result || !finalProvider || !finalModel) {
        console.error('All model candidates failed', {
          mediaType,
          scene,
          family,
          candidateErrors,
        });
        throw new Error(getUserMessageFromCandidateErrors(candidateErrors));
      }
    } else if (provider && model) {
      assertSafeAssetInputUrls(options);

      await moderateGenerationInput({
        userId: user.id,
        mediaType,
        scene,
        prompt: requestPrompt,
        options,
      });

      result = await createProviderTask(provider, model, options);
      finalProvider = provider;
      finalModel = model;
    } else {
      throw new Error('invalid params');
    }

    if (!result || !finalProvider || !finalModel) {
      throw new Error('ai generate failed');
    }

    const aiTaskId = getUuid();
    const moderatedResult = await applyGenerationOutputModeration({
      taskId: aiTaskId,
      userId: user.id,
      mediaType,
      scene,
      taskStatus: result.taskStatus,
      taskInfo: result.taskInfo,
      taskResult: result.taskResult,
    });
    result = {
      ...result,
      taskStatus: moderatedResult.status,
      taskInfo: moderatedResult.taskInfo,
      taskResult: moderatedResult.taskResult,
    };

    const newAITask: NewAITask = {
      id: aiTaskId,
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
