import {
  createSightengineModerationProvider,
  type SightengineConfig,
} from './sightengine';
import type { ModerationProvider } from './types';

export type {
  ModerationProvider,
  ModerationProviderName,
  ModerationResult,
} from './types';
export type { SightengineConfig } from './sightengine';

export function createModerationProvider(
  config: SightengineConfig
): ModerationProvider {
  return createSightengineModerationProvider(config);
}
