import { DifficultyLevel } from "../player/player-settings";

export interface CollectedCount {
  collected: number;
  extra: number;
  total: number;
  ignored: number;
}

export interface Thing {
  id: string;
  displayName: string;
  texture: string | number;
  registry: Registry;
}

export interface Registry<TIdentifyInput = unknown> {
  readonly key: string;

  getIcon(): string | number;

  all(difficulty: DifficultyLevel): Thing[];

  count(items: string[], difficulty: DifficultyLevel): CollectedCount;

  getExtra(collectedKeys: string[]): string[];

  enumerateVariants(id: string, difficulty: DifficultyLevel): string[];

  countVariants(id: string, difficulty: DifficultyLevel): number;

  identify(input?: TIdentifyInput): string[];

  format(id: string): string;

  findByKeyword(word: string): string[];

  resolveTexture(id: string): string | number;
}
