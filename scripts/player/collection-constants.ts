import { InjectionToken } from "tsyringe";
import { Runnable } from "../shared/runnable";
import { GREEN } from "../shared/format-codes";

export type CollectFn = (category: keyof PlayerCollectionData, what: string) => void;
export type Collector = { collect: CollectFn };
export const COLLECTOR: InjectionToken<Collector> = Symbol(
  "Access to the function for reporting having collected something"
);

export const COLLECTORS_TOKEN: InjectionToken<Runnable> = Symbol("All player-scoped collectors");

export const BIOME = "biome";

export const COLLECTION_TYPES = [BIOME] as const;

export const THEME: Record<string, string> = {
  [BIOME]: GREEN,
};

export interface PlayerCollectionData {
  [BIOME]: Map<string, number>;
}
export function emptyCollection(): PlayerCollectionData {
  return {
    [BIOME]: new Map(),
  };
}
