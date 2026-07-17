import { InjectionToken } from "tsyringe";
import { Runnable } from "../shared/runnable";
import { DARK_GREEN, RED, AQUA, LIGHT_PURPLE, MATERIAL_COPPER, MATERIAL_DIAMOND, BLACK } from "../shared/format-codes";
export type CollectFn = (id: string) => void;
export type Collector = { collect: CollectFn };
export const COLLECTOR: InjectionToken<Collector> = Symbol(
  "Access to the function for reporting having collected something"
);

export const COLLECTORS_TOKEN: InjectionToken<Runnable> = Symbol("All player-scoped collectors");

export const BIOME = "biome";
export const DEATH = "death";
export const ENTITY = "entity";
export const EFFECT = "effect";
export const ENCHANTMENT = "enchantment";
export const UNOBTAINABLE = "unobtainable";
export const ITEM = "item";

export const THEME: Record<string, string> = {
  [ITEM]: MATERIAL_DIAMOND,
  [BIOME]: DARK_GREEN,
  [ENTITY]: RED,
  [EFFECT]: AQUA,
  [ENCHANTMENT]: LIGHT_PURPLE,
  [UNOBTAINABLE]: MATERIAL_COPPER,
  [DEATH]: BLACK,
  // [STRUCTURE]: DARK_PURPLE, // TODO: there is currently no way to detect structures
};

export interface PlayerCollectionData {
  [BIOME]: Record<string, number>;
  [DEATH]: Record<string, number>;
  [ENTITY]: Record<string, number>;
  [EFFECT]: Record<string, number>;
  [ENCHANTMENT]: Record<string, number>;
  [ITEM]: Record<string, number>;
  [UNOBTAINABLE]: Record<string, number>;
}

export type RegistryKey = keyof PlayerCollectionData | "everything";

export const COLLECTED_PREFIX = "collected;";

export interface CollectedMetadata {
  collectedOnTick: number;
  collectedNTimes: number;
  lastCollectedOnTick: number;
}

export function emptyCollection(): PlayerCollectionData {
  return {
    [BIOME]: {},
    [DEATH]: {},
    [ENTITY]: {},
    [EFFECT]: {},
    [ENCHANTMENT]: {},
    [ITEM]: {},
    [UNOBTAINABLE]: {},
  };
}
