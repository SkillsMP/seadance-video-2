interface VideoFeatureFlagEnv {
  [key: string]: string | undefined;
  ENABLE_DYNAMIC_VIDEO_PRICING?: string;
  ENABLE_VIDEO_RESOLUTION_CONTROL?: string;
}

export interface VideoGenerationFeatureFlags {
  dynamicVideoPricingEnabled: boolean;
  videoResolutionControlEnabled: boolean;
}

export function resolveVideoGenerationFeatureFlags(
  env: VideoFeatureFlagEnv
): VideoGenerationFeatureFlags {
  const dynamicVideoPricingEnabled =
    env.ENABLE_DYNAMIC_VIDEO_PRICING === 'true';

  return {
    dynamicVideoPricingEnabled,
    videoResolutionControlEnabled:
      dynamicVideoPricingEnabled &&
      env.ENABLE_VIDEO_RESOLUTION_CONTROL === 'true',
  };
}

export function getVideoGenerationFeatureFlags(): VideoGenerationFeatureFlags {
  return resolveVideoGenerationFeatureFlags(process.env);
}
