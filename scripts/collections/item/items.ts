export interface ItemData {
  texture?: string;
  variants?: Record<string, Record<string, string>>;
}

const BED_COLORS: Record<string, string> = {
  white: "white",
  orange: "orange",
  magenta: "magenta",
  light_blue: "light_blue",
  yellow: "yellow",
  lime: "lime",
  pink: "pink",
  gray: "gray",
  light_gray: "light_gray",
  cyan: "cyan",
  purple: "purple",
  blue: "blue",
  brown: "brown",
  green: "green",
  red: "red",
  black: "black",
};

const POTION_LIQUIDS: Record<string, string> = {
  Consume: "consume",
  ThrownSplash: "thrown_splash",
  ThrownLingering: "thrown_lingering",
};

const POTION_EFFECTS: Record<string, string> = {
  "minecraft:awkward": "awkward",
  "minecraft:fire_resistance": "fire resistance",
  "minecraft:harming": "harming",
  "minecraft:healing": "healing",
  "minecraft:infested": "infested",
  "minecraft:invisibility": "invisibility",
  "minecraft:leaping": "leaping",
  "minecraft:long_fire_resistance": "long fire resistance",
  "minecraft:long_invisibility": "long invisibility",
  "minecraft:long_leaping": "long leaping",
  "minecraft:long_mundane": "long mundane",
  "minecraft:long_nightvision": "long night vision",
  "minecraft:long_poison": "long poison",
  "minecraft:long_regeneration": "long regeneration",
  "minecraft:long_slow_falling": "long slow falling",
  "minecraft:long_slowness": "long slowness",
  "minecraft:long_strength": "long strength",
  "minecraft:long_swiftness": "long swiftness",
  "minecraft:long_turtle_master": "long turtle master",
  "minecraft:long_water_breathing": "long water breathing",
  "minecraft:long_weakness": "long weakness",
  "minecraft:mundane": "mundane",
  "minecraft:nightvision": "night vision",
  "minecraft:oozing": "oozing",
  "minecraft:poison": "poison",
  "minecraft:regeneration": "regeneration",
  "minecraft:slow_falling": "slow falling",
  "minecraft:slowness": "slowness",
  "minecraft:strength": "strength",
  "minecraft:strong_harming": "strong harming",
  "minecraft:strong_healing": "strong healing",
  "minecraft:strong_leaping": "strong leaping",
  "minecraft:strong_poison": "strong poison",
  "minecraft:strong_regeneration": "strong regeneration",
  "minecraft:strong_slowness": "strong slowness",
  "minecraft:strong_strength": "strong strength",
  "minecraft:strong_swiftness": "strong swiftness",
  "minecraft:strong_turtle_master": "strong turtle master",
  "minecraft:swiftness": "swiftness",
  "minecraft:thick": "thick",
  "minecraft:turtle_master": "turtle master",
  "minecraft:water": "water",
  "minecraft:water_breathing": "water breathing",
  "minecraft:weakness": "weakness",
  "minecraft:weaving": "weaving",
  "minecraft:wind_charged": "wind charged",
  "minecraft:wither": "wither",
};

export default {
  "minecraft:bed": {
    texture: "textures/blocks/bed/bed_red",
    variants: { "l.color": BED_COLORS },
  },
  "minecraft:potion": {
    texture: "textures/items/potion_regular",
    variants: {
      "c.potion_liquid": POTION_LIQUIDS,
      "c.potion_effect": POTION_EFFECTS,
    },
  },
  "minecraft:splash_potion": {
    texture: "textures/items/potion_splash",
    variants: {
      "c.potion_liquid": POTION_LIQUIDS,
      "c.potion_effect": POTION_EFFECTS,
    },
  },
  "minecraft:lingering_potion": {
    texture: "textures/items/potion_lingering",
    variants: {
      "c.potion_liquid": POTION_LIQUIDS,
      "c.potion_effect": POTION_EFFECTS,
    },
  },
  "minecraft:glass_bottle": { texture: "textures/items/potion_regular" },
} as Record<string, ItemData>;
