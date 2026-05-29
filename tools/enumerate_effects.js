import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";

const __dirname = join(fileURLToPath(import.meta.url), "..");

// Source: https://minecraft.fandom.com/wiki/Bedrock_Edition_data_values (Effect IDs section)
const OUTPUT_FILE = join(
  __dirname,
  "../packs/bp/data/registry_effects.json",
);

console.log("[enumerate_effects] Starting...");

const effects = [
  "minecraft:speed",
  "minecraft:slowness",
  "minecraft:haste",
  "minecraft:mining_fatigue",
  "minecraft:strength",
  "minecraft:instant_health",
  "minecraft:instant_damage",
  "minecraft:jump_boost",
  "minecraft:nausea",
  "minecraft:regeneration",
  "minecraft:resistance",
  "minecraft:fire_resistance",
  "minecraft:water_breathing",
  "minecraft:invisibility",
  "minecraft:blindness",
  "minecraft:night_vision",
  "minecraft:hunger",
  "minecraft:weakness",
  "minecraft:poison",
  "minecraft:wither",
  "minecraft:health_boost",
  "minecraft:absorption",
  "minecraft:saturation",
  "minecraft:levitation",
  "minecraft:luck",
  "minecraft:unluck",
  "minecraft:slow_falling",
  "minecraft:conduit_power",
  "minecraft:dolphins_grace",
  "minecraft:bad_omen",
  "minecraft:hero_of_the_village",
  "minecraft:darkness",
  "minecraft:fatal_poison",
  "minecraft:trial_omen",
  "minecraft:wind_charged",
  "minecraft:weaving",
  "minecraft:oozing",
  "minecraft:infested",
  "minecraft:raid_omen",
  "minecraft:breath_of_the_nautilus",
];

const effectEntries = effects.map((effectId) => ({
  name: effectId,
  display_name: capitalCase(effectId.replace("minecraft:", "").replace(/_/g, " ")) || effectId,
}));

effectEntries.sort((a, b) => a.name.localeCompare(b.name));

const output = {
  format_version: 1,
  registry_name: "effects",
  total_count: effectEntries.length,
  entries: effectEntries,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`[enumerate_effects] Done. Wrote ${effectEntries.length} effects to ${OUTPUT_FILE}`);