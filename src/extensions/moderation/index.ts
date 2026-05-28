import {
  createSightengineModerationProvider,
  type SightengineConfig,
} from './sightengine';
import {
  createWavespeedModerationProvider,
  type WavespeedConfig,
} from './wavespeed';
import type { ModerationProvider } from './types';

export interface CreateModerationProviderConfig {
  provider: 'sightengine' | 'wavespeed';
  sightengine?: SightengineConfig;
  wavespeed?: WavespeedConfig;
}

export type {
  ModerationProvider,
  ModerationProviderName,
  ModerationResult,
} from './types';
export type { SightengineConfig } from './sightengine';
export type { WavespeedConfig } from './wavespeed';

export function createModerationProvider(
  config: CreateModerationProviderConfig
): ModerationProvider {
  if (config.provider === 'wavespeed') {
    if (!config.wavespeed) {
      throw new Error('Wavespeed moderation config missing');
    }

    return createWavespeedModerationProvider(config.wavespeed);
  }

  if (!config.sightengine) {
    throw new Error('Sightengine moderation config missing');
  }

  return createSightengineModerationProvider(config.sightengine);
}
