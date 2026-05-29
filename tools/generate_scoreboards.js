import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { findVanillaPath } from "./vanilla-finder.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const BLOCKS_FILE = join(__dirname, "../packs/bp/data/registry_blocks.json");
const ITEMS_FILE = join(__dirname, "../packs/bp/data/registry_items.json");
const ENCHANTMENTS_FILE = join(__dirname, "../packs/bp/data/registry_enchantments.json");
const ENTITIES_FILE = join(__dirname, "../packs/bp/data/registry_entities.json");
const BIOMES_FILE = join(__dirname, "../packs/bp/data/registry_biomes.json");
const OUTPUT_FILE = join(__dirname, "../packs/bp/data/scoreboard_init.json");

function generateScoreboardEntries(registry, prefix) {
  const entries = registry.entries || [];
  return entries.map((entry) => ({
    objective: `collect_${prefix}`,
    criteria: "dummy",
    display_name: entry.display_name || entry.name,
    canonical_name: entry.name,
  }));
}

console.log("[generate_scoreboards] Starting...");

const allEntries = [];

if (existsSync(BLOCKS_FILE)) {
  const data = JSON.parse(readFileSync(BLOCKS_FILE, "utf8"));
  allEntries.push(...generateScoreboardEntries(data, "block"));
}
if (existsSync(ITEMS_FILE)) {
  const data = JSON.parse(readFileSync(ITEMS_FILE, "utf8"));
  allEntries.push(...generateScoreboardEntries(data, "item"));
}
if (existsSync(ENCHANTMENTS_FILE)) {
  const data = JSON.parse(readFileSync(ENCHANTMENTS_FILE, "utf8"));
  allEntries.push(...generateScoreboardEntries(data, "enchantment"));
}
if (existsSync(ENTITIES_FILE)) {
  const data = JSON.parse(readFileSync(ENTITIES_FILE, "utf8"));
  allEntries.push(...generateScoreboardEntries(data, "entity"));
}
if (existsSync(BIOMES_FILE)) {
  const data = JSON.parse(readFileSync(BIOMES_FILE, "utf8"));
  allEntries.push(...generateScoreboardEntries(data, "biome"));
}

const output = {
  format_version: 1,
  objectives: [
    { name: "collect_blocks", display_name: "Blocks Collected", criteria: "dummy" },
    { name: "collect_items", display_name: "Items Collected", criteria: "dummy" },
    { name: "collect_enchantments", display_name: "Enchantments Collected", criteria: "dummy" },
    { name: "collect_entities", display_name: "Entities Collected", criteria: "dummy" },
    { name: "collect_biomes", display_name: "Biomes Collected", criteria: "dummy" },
  ],
  entries: allEntries,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(
  `[generate_scoreboards] Done. Wrote ${allEntries.length} scoreboard entries to ${OUTPUT_FILE}`,
);