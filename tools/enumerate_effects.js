import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_RP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_effects.json");

  console.log("[enumerate_effects] Starting...");
  console.log("[enumerate_effects] Using:", VANILLA_RP);

  const effectsPath = join(VANILLA_RP, "metadata", "vanilladata_modules", "mojang-potion-effects.json");
  
  if (!existsSync(effectsPath)) {
    throw new Error(`[enumerate_effects] mojang-potion-effects.json not found at ${effectsPath}`);
  }

  const content = JSON.parse(readFileSync(effectsPath, "utf8"));
  const effects = content.data_items;

  const entries = [];
  let id = 1;

  for (const effect of effects) {
    const effectName = effect.name;
    entries.push({
      id: id++,
      name: effectName,
      display_name: capitalCase(effectName.replace("minecraft:", "").replace(/_/g, " ")) || effectName,
    });
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    format_version: 1,
    registry_name: "effects",
    total_count: entries.length,
    entries,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`[enumerate_effects] Wrote ${entries.length} effects to ${OUTPUT_FILE}`);
}

main().catch(console.error);