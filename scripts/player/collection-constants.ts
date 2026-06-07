import { InjectionToken } from "tsyringe";
import { Runnable } from "../shared/runnable";
import { GREEN, RED, AQUA, LIGHT_PURPLE, BLUE } from "../shared/format-codes";

export type CollectFn = (category: keyof PlayerCollectionData, what: string, displayName?: string) => void;
export type Collector = { collect: CollectFn };
export const COLLECTOR: InjectionToken<Collector> = Symbol(
  "Access to the function for reporting having collected something"
);

export const COLLECTORS_TOKEN: InjectionToken<Runnable> = Symbol("All player-scoped collectors");

export const BIOME = "biome";
export const ENTITY = "entity";
export const EFFECT = "effect";
export const ENCHANTMENT = "enchantment";
export const UNOBTAINABLE_ITEMS = "unobtainable item";

export const THEME: Record<string, string> = {
  [BIOME]: GREEN,
  [ENTITY]: RED,
  [EFFECT]: AQUA,
  [ENCHANTMENT]: LIGHT_PURPLE,
  [UNOBTAINABLE_ITEMS]: BLUE,
  // [STRUCTURE]: DARK_PURPLE, // TODO: there is currently no way to detect structures
};

export interface PlayerCollectionData {
  [BIOME]: Map<string, number>;
  [ENTITY]: Map<string, number>;
  [EFFECT]: Map<string, number>;
  [ENCHANTMENT]: Map<string, number>;
  [UNOBTAINABLE_ITEMS]: Map<string, number>;
}
export function emptyCollection(): PlayerCollectionData {
  return {
    [BIOME]: new Map(),
    [ENTITY]: new Map(),
    [EFFECT]: new Map(),
    [ENCHANTMENT]: new Map(),
    [UNOBTAINABLE_ITEMS]: new Map(),
  };
}
