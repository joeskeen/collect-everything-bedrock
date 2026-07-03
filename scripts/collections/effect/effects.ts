export interface EffectData {
  texture: string;
  maxAmplifier: number;
  excludedAmplifiers?: number[];
}

export default {
  "minecraft:absorption": { texture: "textures/ui/absorption_effect", maxAmplifier: 3, excludedAmplifiers: [2] },
  "minecraft:bad_omen": { texture: "textures/ui/bad_omen_effect", maxAmplifier: 3 },
  "minecraft:blindness": { texture: "textures/ui/blindness_effect", maxAmplifier: 0 },
  "minecraft:breath_of_the_nautilus": { texture: "textures/ui/breath_of_the_nautilus_effect", maxAmplifier: 0 },
  "minecraft:conduit_power": { texture: "textures/ui/conduit_power_effect", maxAmplifier: 0 },
  "minecraft:darkness": { texture: "textures/ui/darkness_effect", maxAmplifier: 0 },
  "minecraft:fatal_poison": { texture: "textures/ui/poison_effect", maxAmplifier: 1 },
  "minecraft:fire_resistance": { texture: "textures/ui/fire_resistance_effect", maxAmplifier: 0 },
  "minecraft:haste": { texture: "textures/ui/haste_effect", maxAmplifier: 1 },
  "minecraft:hunger": { texture: "textures/ui/hunger_effect", maxAmplifier: 2, excludedAmplifiers: [1] },
  "minecraft:infested": { texture: "textures/ui/infested_effect", maxAmplifier: 0 },
  "minecraft:instant_damage": { texture: "textures/ui/heart_flash_half", maxAmplifier: 1 },
  "minecraft:instant_health": { texture: "textures/items/potion_bottle_heal", maxAmplifier: 1 },
  "minecraft:invisibility": { texture: "textures/ui/invisibility_effect", maxAmplifier: 0 },
  "minecraft:jump_boost": { texture: "textures/ui/jump_boost_effect", maxAmplifier: 1 },
  "minecraft:levitation": { texture: "textures/ui/levitation_effect", maxAmplifier: 0 },
  "minecraft:mining_fatigue": {
    texture: "textures/ui/mining_fatigue_effect",
    maxAmplifier: 2,
    excludedAmplifiers: [0, 1],
  },
  "minecraft:nausea": { texture: "textures/ui/nausea_effect", maxAmplifier: 0 },
  "minecraft:night_vision": { texture: "textures/ui/night_vision_effect", maxAmplifier: 0 },
  "minecraft:oozing": { texture: "textures/ui/oozing_effect", maxAmplifier: 0 },
  "minecraft:poison": { texture: "textures/ui/poison_effect", maxAmplifier: 1 },
  "minecraft:raid_omen": { texture: "textures/ui/raid_omen_effect", maxAmplifier: 0 },
  "minecraft:regeneration": { texture: "textures/ui/regeneration_effect", maxAmplifier: 1 },
  "minecraft:resistance": { texture: "textures/ui/resistance_effect", maxAmplifier: 3 },
  "minecraft:saturation": { texture: "textures/ui/hunger_full", maxAmplifier: 0 },
  "minecraft:slow_falling": { texture: "textures/ui/slow_falling_effect", maxAmplifier: 0 },
  "minecraft:slowness": { texture: "textures/ui/slowness_effect", maxAmplifier: 5, excludedAmplifiers: [1, 2, 4] },
  "minecraft:speed": { texture: "textures/ui/speed_effect", maxAmplifier: 1 },
  "minecraft:strength": { texture: "textures/ui/strength_effect", maxAmplifier: 1 },
  "minecraft:trial_omen": { texture: "textures/ui/trial_omen_effect", maxAmplifier: 0 },
  "minecraft:village_hero": { texture: "textures/ui/village_hero_effect", maxAmplifier: 0 },
  "minecraft:water_breathing": { texture: "textures/ui/water_breathing_effect", maxAmplifier: 0 },
  "minecraft:weakness": { texture: "textures/ui/weakness_effect", maxAmplifier: 0 },
  "minecraft:weaving": { texture: "textures/ui/weaving_effect", maxAmplifier: 0 },
  "minecraft:wind_charged": { texture: "textures/ui/wind_charged_effect", maxAmplifier: 0 },
  "minecraft:wither": { texture: "textures/ui/wither_effect", maxAmplifier: 1 },
} as Record<string, EffectData>;
