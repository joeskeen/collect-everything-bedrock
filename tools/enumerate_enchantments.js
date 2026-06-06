import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_RP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_enchantments.json");

  console.log("[enumerate_enchantments] Starting...");
  console.log("[enumerate_enchantments] Using:", VANILLA_RP);

  const enchantmentsPath = join(VANILLA_RP, "metadata", "vanilladata_modules", "mojang-enchantments.json");
  
  if (!existsSync(enchantmentsPath)) {
    throw new Error(`[enumerate_enchantments] mojang-enchantments.json not found at ${enchantmentsPath}`);
  }

  const content = JSON.parse(readFileSync(enchantmentsPath, "utf8"));
  const enchantments = content.data_items;

  const entries = [];
  let id = 1;

  for (const enchantment of enchantments) {
    const baseName = enchantment.name;
    const maxLevel = enchantment.max_level || 5;
    const displayBase = capitalCase(baseName.replace("minecraft:", "").replace(/_/g, " "));

    for (let level = 1; level <= maxLevel; level++) {
      entries.push({
        id: id++,
        name: `${baseName}:${level}`,
        display_name: `${displayBase} ${level}`,
        base_enchantment: baseName,
        level,
      });
    }
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    format_version: 1,
    registry_name: "enchantments",
    total_count: entries.length,
    entries,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`[enumerate_enchantments] Wrote ${entries.length} enchantment levels to ${OUTPUT_FILE}`);
}

main().catch(console.error);