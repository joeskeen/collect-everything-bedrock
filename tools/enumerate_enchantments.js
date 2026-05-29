import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";

const __dirname = join(fileURLToPath(import.meta.url), "..");

// Source: https://wiki.bedrock.dev/items/enchantments.html
const enchantments = [
  { id: "minecraft:protection", maxLevel: 4 },
  { id: "minecraft:fire_protection", maxLevel: 4 },
  { id: "minecraft:feather_falling", maxLevel: 4 },
  { id: "minecraft:blast_protection", maxLevel: 4 },
  { id: "minecraft:projectile_protection", maxLevel: 4 },
  { id: "minecraft:thorns", maxLevel: 3 },
  { id: "minecraft:respiration", maxLevel: 3 },
  { id: "minecraft:depth_strider", maxLevel: 3 },
  { id: "minecraft:aqua_affinity", maxLevel: 1 },
  { id: "minecraft:sharpness", maxLevel: 5 },
  { id: "minecraft:smite", maxLevel: 5 },
  { id: "minecraft:bane_of_arthropods", maxLevel: 5 },
  { id: "minecraft:knockback", maxLevel: 2 },
  { id: "minecraft:fire_aspect", maxLevel: 2 },
  { id: "minecraft:looting", maxLevel: 3 },
  { id: "minecraft:efficiency", maxLevel: 5 },
  { id: "minecraft:silk_touch", maxLevel: 1 },
  { id: "minecraft:unbreaking", maxLevel: 3 },
  { id: "minecraft:fortune", maxLevel: 3 },
  { id: "minecraft:power", maxLevel: 5 },
  { id: "minecraft:punch", maxLevel: 2 },
  { id: "minecraft:flame", maxLevel: 1 },
  { id: "minecraft:infinity", maxLevel: 1 },
  { id: "minecraft:luck_of_the_sea", maxLevel: 3 },
  { id: "minecraft:lure", maxLevel: 3 },
  { id: "minecraft:frost_walker", maxLevel: 2 },
  { id: "minecraft:mending", maxLevel: 1 },
  { id: "minecraft:curse_of_binding", maxLevel: 1 },
  { id: "minecraft:curse_of_vanishing", maxLevel: 1 },
  { id: "minecraft:impaling", maxLevel: 5 },
  { id: "minecraft:riptide", maxLevel: 3 },
  { id: "minecraft:loyalty", maxLevel: 3 },
  { id: "minecraft:channeling", maxLevel: 1 },
  { id: "minecraft:multishot", maxLevel: 1 },
  { id: "minecraft:piercing", maxLevel: 4 },
  { id: "minecraft:quick_charge", maxLevel: 3 },
  { id: "minecraft:soul_speed", maxLevel: 3 },
  { id: "minecraft:swift_sneak", maxLevel: 3 },
];

const OUTPUT_FILE = join(
  __dirname,
  "../packs/bp/data/registry_enchantments.json",
);

console.log("[enumerate_enchantments] Starting...");

const enchantmentEntries = [];
for (const enchantment of enchantments) {
  for (let level = 1; level <= enchantment.maxLevel; level++) {
    enchantmentEntries.push({
      name: `${enchantment.id}:${level}`,
      display_name: `${capitalCase(enchantment.id.replace("minecraft:", "").replace(/_/g, " "))} ${level}`,
      base_enchantment: enchantment.id,
      level: level,
    });
  }
}

enchantmentEntries.sort((a, b) => a.name.localeCompare(b.name));

const output = {
  format_version: 1,
  registry_name: "enchantments",
  total_count: enchantmentEntries.length,
  entries: enchantmentEntries,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`[enumerate_enchantments] Done. Wrote ${enchantmentEntries.length} enchantment levels to ${OUTPUT_FILE}`);