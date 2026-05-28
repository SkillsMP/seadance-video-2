export type ModerationProviderName = 'sightengine';

export type ModerationDecision = 'allow' | 'block';

export interface ModerationResult {
  decision: ModerationDecision;
  provider: ModerationProviderName;
  categories: string[];
  raw?: unknown;
}

export interface ModerationProvider {
  name: ModerationProviderName;
  checkText?: (text: string) => Promise<ModerationResult>;
  checkImageUrl?: (url: string) => Promise<ModerationResult>;
  checkVideoUrl?: (url: string) => Promise<ModerationResult>;
}
