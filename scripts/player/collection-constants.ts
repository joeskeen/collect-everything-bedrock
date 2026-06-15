import { InjectionToken } from "tsyringe";
import { Runnable } from "../shared/runnable";
import { GREEN, RED, AQUA, LIGHT_PURPLE, MATERIAL_COPPER, MATERIAL_DIAMOND } from "../shared/format-codes";
import { RawMessage } from "@minecraft/server";

export type CollectFn = (category: keyof PlayerCollectionData, what: string, formatted: RawMessage) => void;
export type Collector = { collect: CollectFn };
export const COLLECTOR: InjectionToken<Collector> = Symbol(
  "Access to the function for reporting having collected something"
);

export const COLLECTORS_TOKEN: InjectionToken<Runnable> = Symbol("All player-scoped collectors");

export const BIOME = "biome";
export const ENTITY = "entity";
export const EFFECT = "effect";
export const ENCHANTMENT = "enchantment";
export const UNOBTAINABLE = "unobtainable";
export const ITEM = "item";

export const THEME: Record<string, string> = {
  [BIOME]: GREEN,
  [ENTITY]: RED,
  [EFFECT]: AQUA,
  [ENCHANTMENT]: LIGHT_PURPLE,
  [ITEM]: MATERIAL_DIAMOND,
  [UNOBTAINABLE]: MATERIAL_COPPER,
  // [STRUCTURE]: DARK_PURPLE, // TODO: there is currently no way to detect structures
};

export interface PlayerCollectionData {
  [BIOME]: Record<string, number>;
  [ENTITY]: Record<string, number>;
  [EFFECT]: Record<string, number>;
  [ENCHANTMENT]: Record<string, number>;
  [ITEM]: Record<string, number>;
  [UNOBTAINABLE]: Record<string, number>;
}
export function emptyCollection(): PlayerCollectionData {
  return {
    [BIOME]: {},
    [ENTITY]: {},
    [EFFECT]: {},
    [ENCHANTMENT]: {},
    [ITEM]: {},
    [UNOBTAINABLE]: {},
  };
}
