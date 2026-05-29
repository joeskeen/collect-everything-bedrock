import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { findVanillaPath } from "./vanilla-finder.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const VANILLA_RP = findVanillaPath();
const OUTPUT_FILE = join(
  __dirname,
  "../packs/bp/data/registry_biomes.json",
);

console.log("[enumerate_biomes] Starting...");
console.log("[enumerate_biomes] Looking for vanilla RP at:", VANILLA_RP);

const biomes = [];

const biomesClientPath = join(VANILLA_RP, "biomes_client.json");
if (existsSync(biomesClientPath)) {
  try {
    const rawContent = readFileSync(biomesClientPath, "utf8");
    // May contain comments, so remove them before parsing
    const cleanContent = rawContent
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    const content = JSON.parse(cleanContent);
    if (content?.biomes) {
      for (const [biomeId] of Object.entries(content.biomes)) {
        if (biomeId === "default") continue;
        biomes.push({
          name: biomeId,
          display_name:
            capitalCase(biomeId.replace("minecraft:", "").replace(/_/g, " ")) ||
            biomeId,
        });
      }
    }
  } catch (e) {
    console.log(
      "[enumerate_biomes] Error parsing biomes_client.json:",
      e.message,
    );
  }
}

if (biomes.length === 0) {
  throw new Error("[enumerate_biomes] Error: No biomes found from vanilla RP.");
}

biomes.sort((a, b) => a.name.localeCompare(b.name));

const output = {
  format_version: 1,
  registry_name: "biomes",
  total_count: biomes.length,
  entries: biomes,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(
  `[enumerate_biomes] Done. Wrote ${biomes.length} biomes to ${OUTPUT_FILE}`,
);
