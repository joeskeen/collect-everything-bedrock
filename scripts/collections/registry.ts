export interface CollectedCount {
  collected: number;
  extra: number;
  total: number;
}

export interface Registry<TIdentifyInput = unknown> {
  readonly key: string;

  getIcon(): string | number;

  all(difficulty?: string): string[];

  count(items: string[], difficulty?: string): CollectedCount;

  getExtra(collectedKeys: string[]): string[];

  enumerateVariants(id: string, difficulty?: string): string[];

  countVariants(id: string, difficulty?: string): number;

  identify(input?: TIdentifyInput): string[];

  format(id: string): string;

  findByKeyword(word: string): string[];

  resolveTexture(id: string): string | number;
}
