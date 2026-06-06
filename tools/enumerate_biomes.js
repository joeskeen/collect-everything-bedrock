import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_RP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_biomes.json");

  console.log("[enumerate_biomes] Starting...");
  console.log("[enumerate_biomes] Using:", VANILLA_RP);

  const biomesClientPath = join(VANILLA_RP, "resource_pack", "biomes_client.json");
  
  if (!existsSync(biomesClientPath)) {
    throw new Error(`[enumerate_biomes] biomes_client.json not found at ${biomesClientPath}`);
  }

  const rawContent = readFileSync(biomesClientPath, "utf8");
  const cleanContent = rawContent.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const content = JSON.parse(cleanContent);

  const biomesMap = content.biomes || content;
  const biomes = [];
  let id = 1;

  for (const [biomeName] of Object.entries(biomesMap)) {
    if (biomeName === "default") continue;
    biomes.push({
      id: id++,
      name: biomeName,
      display_name: capitalCase(biomeName.replace("minecraft:", "").replace(/_/g, " ")) || biomeName,
    });
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
  console.log(`[enumerate_biomes] Wrote ${biomes.length} biomes to ${OUTPUT_FILE}`);
}

main().catch(console.error);