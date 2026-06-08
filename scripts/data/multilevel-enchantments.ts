export interface EnchantmentData {
  displayName?: string;
  internalId: number;
  maxLevel: number;
  tags: string[];
}

export function countCollectedMultilevelEnchantments(enchantments: string[]) {
  const builtInCount = enchantments.filter((e) => e in ALL_MULTILEVEL_ENCHANTMENTS).length;
  return {
    collected: builtInCount,
    extra: enchantments.length - builtInCount,
    total: Object.keys(ALL_MULTILEVEL_ENCHANTMENTS).length,
  };
}

export const ALL_MULTILEVEL_ENCHANTMENTS: Record<string, EnchantmentData> = {
  "minecraft:bane_of_arthropods": {
    internalId: 1,
    maxLevel: 5,
    tags: ["sword", "spear", "axe"],
  },
  "minecraft:blast_protection": {
    internalId: 3,
    maxLevel: 4,
    tags: ["helmet", "chestplate", "leggings", "boots", "turtle"],
  },
  "minecraft:breach": { internalId: 4, maxLevel: 4, tags: ["mace"] },
  "minecraft:density": { internalId: 6, maxLevel: 5, tags: ["mace"] },
  "minecraft:depth_strider": { internalId: 7, maxLevel: 3, tags: ["boots"] },
  "minecraft:efficiency": {
    internalId: 8,
    maxLevel: 5,
    tags: ["pickaxe", "shovel", "axe", "hoe", "shears"],
  },
  "minecraft:feather_falling": { internalId: 9, maxLevel: 4, tags: ["boots"] },
  "minecraft:fire_aspect": {
    internalId: 10,
    maxLevel: 2,
    tags: ["sword", "spear", "mace"],
  },
  "minecraft:fire_protection": {
    internalId: 11,
    maxLevel: 4,
    tags: ["helmet", "chestplate", "leggings", "boots", "turtle"],
  },
  "minecraft:fortune": {
    internalId: 13,
    maxLevel: 3,
    tags: ["pickaxe", "shovel", "axe", "hoe"],
  },
  "minecraft:frost_walker": { internalId: 14, maxLevel: 2, tags: ["boots"] },
  "minecraft:impaling": { internalId: 15, maxLevel: 5, tags: ["trident"] },
  "minecraft:knockback": { internalId: 17, maxLevel: 2, tags: ["sword", "spear"] },
  "minecraft:looting": { internalId: 18, maxLevel: 3, tags: ["sword", "spear"] },
  "minecraft:loyalty": { internalId: 19, maxLevel: 3, tags: ["trident"] },
  "minecraft:luck_of_the_sea": { internalId: 20, maxLevel: 3, tags: ["fishing", "rod"] },
  "minecraft:lunge": { internalId: 21, maxLevel: 3, tags: ["spear"] },
  "minecraft:lure": { internalId: 22, maxLevel: 3, tags: ["fishing", "rod"] },
  "minecraft:piercing": { internalId: 25, maxLevel: 4, tags: ["crossbow"] },
  "minecraft:power": { internalId: 26, maxLevel: 5, tags: ["bow"] },
  "minecraft:projectile_protection": {
    internalId: 27,
    maxLevel: 4,
    tags: ["helmet", "chestplate", "leggings", "boots", "turtle"],
  },
  "minecraft:protection": {
    internalId: 28,
    maxLevel: 4,
    tags: ["helmet", "chestplate", "leggings", "boots", "turtle"],
  },
  "minecraft:punch": { internalId: 29, maxLevel: 2, tags: ["bow"] },
  "minecraft:quick_charge": { internalId: 30, maxLevel: 3, tags: ["crossbow"] },
  "minecraft:respiration": { internalId: 31, maxLevel: 3, tags: ["helmet", "turtle"] },
  "minecraft:riptide": { internalId: 32, maxLevel: 3, tags: ["trident"] },
  "minecraft:sharpness": {
    internalId: 33,
    maxLevel: 5,
    tags: ["sword", "spear", "axe"],
  },
  "minecraft:smite": { internalId: 35, maxLevel: 5, tags: ["sword", "spear", "axe"] },
  "minecraft:soul_speed": { internalId: 36, maxLevel: 3, tags: ["boots"] },
  "minecraft:sweeping_edge": { internalId: 37, maxLevel: 3, tags: ["sword"] },
  "minecraft:swift_sneak": { internalId: 38, maxLevel: 3, tags: ["leggings"] },
  "minecraft:thorns": {
    internalId: 39,
    maxLevel: 3,
    tags: ["chestplate", "helmet", "leggings", "boots", "turtle"],
  },
  "minecraft:unbreaking": {
    internalId: 40,
    maxLevel: 3,
    tags: [
      "helmet",
      "chestplate",
      "leggings",
      "boots",
      "turtle",
      "sword",
      "axe",
      "pickaxe",
      "shovel",
      "hoe",
      "bow",
      "fishing",
      "rod",
      "trident",
      "crossbow",
      "shield",
      "shears",
      "flint",
      "steel",
      "carrot",
      "stick",
      "warped",
      "fungus",
      "elytra",
      "mace",
      "brush",
    ],
  },
  "minecraft:wind_burst": { internalId: 42, maxLevel: 3, tags: ["mace"] },
};
