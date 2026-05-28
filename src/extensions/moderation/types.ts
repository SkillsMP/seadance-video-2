export type ModerationProviderName = 'sightengine' | 'wavespeed';

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
  checkImageUrl?: (url: string, text?: string) => Promise<ModerationResult>;
  checkVideoUrl?: (url: string, text?: string) => Promise<ModerationResult>;
}
