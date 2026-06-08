export interface EffectData {
  displayName?: string;
  internalId: number;
  type: "positive" | "negative" | "neutral";
}

export function countCollectedEffects(effects: string[]) {
  const builtInCount = effects.filter((e) => e in ALL_EFFECTS).length;
  return { collected: builtInCount, extra: effects.length - builtInCount, total: Object.keys(ALL_EFFECTS).length };
}

export const ALL_EFFECTS: Record<string, EffectData> = {
  "minecraft:absorption": { internalId: 22, type: "positive" },
  "minecraft:bad_omen": { internalId: 28, type: "neutral" },
  "minecraft:blindness": { internalId: 15, type: "negative" },
  "minecraft:breath_of_the_nautilus": { internalId: 37, type: "positive" },
  "minecraft:conduit_power": { internalId: 27, type: "positive" },
  "minecraft:darkness": { internalId: 30, type: "negative" },
  "minecraft:fatal_poison": { internalId: 25, type: "negative" },
  "minecraft:fire_resistance": { internalId: 12, type: "positive" },
  "minecraft:haste": { internalId: 3, type: "positive" },
  "minecraft:health_boost": { internalId: 21, type: "positive" },
  "minecraft:village_hero": { displayName: "Hero of the Village", internalId: 29, type: "positive" },
  "minecraft:hunger": { internalId: 17, type: "negative" },
  "minecraft:infested": { internalId: 36, type: "negative" },
  "minecraft:instant_damage": { internalId: 7, type: "negative" },
  "minecraft:instant_health": { internalId: 6, type: "positive" },
  "minecraft:invisibility": { internalId: 14, type: "positive" },
  "minecraft:jump_boost": { internalId: 8, type: "positive" },
  "minecraft:mining_fatigue": { internalId: 4, type: "negative" },
  "minecraft:levitation": { internalId: 24, type: "negative" },
  "minecraft:nausea": { internalId: 9, type: "negative" },
  "minecraft:night_vision": { internalId: 16, type: "positive" },
  "minecraft:oozing": { internalId: 35, type: "negative" },
  "minecraft:poison": { internalId: 19, type: "negative" },
  "minecraft:raid_omen": { internalId: 32, type: "neutral" },
  "minecraft:regeneration": { internalId: 10, type: "positive" },
  "minecraft:resistance": { internalId: 11, type: "positive" },
  "minecraft:saturation": { internalId: 23, type: "positive" },
  "minecraft:slowness": { internalId: 2, type: "negative" },
  "minecraft:slow_falling": { internalId: 26, type: "positive" },
  "minecraft:speed": { internalId: 1, type: "positive" },
  "minecraft:strength": { internalId: 5, type: "positive" },
  "minecraft:trial_omen": { internalId: 31, type: "neutral" },
  "minecraft:water_breathing": { internalId: 13, type: "positive" },
  "minecraft:weakness": { internalId: 18, type: "negative" },
  "minecraft:weaving": { internalId: 34, type: "negative" },
  "minecraft:wind_charged": { internalId: 33, type: "negative" },
  "minecraft:wither": { internalId: 20, type: "negative" },
};
