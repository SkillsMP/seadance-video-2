import { NextRequest, NextResponse } from 'next/server';

import { getVideoGenerationFeatureFlags } from '@/config/ai/video-feature-flags';
import { getAllConfigs } from '@/shared/models/config';

export async function GET(request: NextRequest) {
  try {
    const configs = await getAllConfigs();

    const availableProviders: string[] = [];

    // Check which AI providers are configured
    if (configs.kie_api_key) {
      availableProviders.push('kie');
    }

    if (configs.replicate_api_token) {
      availableProviders.push('replicate');
    }

    if (configs.fal_api_key) {
      availableProviders.push('fal');
    }

    if (configs.gemini_api_key) {
      availableProviders.push('gemini');
    }
    const videoFeatureFlags = getVideoGenerationFeatureFlags();

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        providers: availableProviders,
        dynamicVideoPricingEnabled:
          videoFeatureFlags.dynamicVideoPricingEnabled,
        videoResolutionControlEnabled:
          videoFeatureFlags.videoResolutionControlEnabled,
      },
    });
  } catch (error: any) {
    console.error('Failed to get AI providers:', error);
    return NextResponse.json(
      {
        code: 1,
        message: error.message || 'Failed to get AI providers',
        data: null,
      },
      { status: 500 }
    );
  }
}
