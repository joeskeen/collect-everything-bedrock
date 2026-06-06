import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");

function normalizeItemName(name) {
  if (!name.startsWith("minecraft:")) {
    return `minecraft:${name}`;
  }
  return name;
}

async function main() {
  const LOOT_ITEMS_FILE = join(__dirname, "../packs/bp/data/registry_loot_items.json");
  const RECIPE_ITEMS_FILE = join(__dirname, "../packs/bp/data/registry_recipe_items.json");
  const BLOCKS_FILE = join(__dirname, "../packs/bp/data/registry_blocks.json");
  const OVERRIDES_FILE = join(__dirname, "../curated/overrides.json");
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_items.json");

  console.log("[enumerate_items] Combining blocks + loot_tables + recipes into unified item list...");

  const lootData = JSON.parse(readFileSync(LOOT_ITEMS_FILE, "utf8"));
  const recipeData = JSON.parse(readFileSync(RECIPE_ITEMS_FILE, "utf8"));
  const blocksData = JSON.parse(readFileSync(BLOCKS_FILE, "utf8"));
  const overrides = existsSync(OVERRIDES_FILE) ? JSON.parse(readFileSync(OVERRIDES_FILE, "utf8")) : { items: {} };

  const itemSet = new Set();
  const modifyMap = new Map();

  for (const entry of blocksData.entries || []) {
    itemSet.add(normalizeItemName(entry.name));
  }
  
  for (const item of lootData.items || []) {
    itemSet.add(normalizeItemName(item));
  }
  
  for (const item of recipeData.items || []) {
    itemSet.add(normalizeItemName(item));
  }

  const itemsOverrides = overrides.items || {};

  for (const removeName of itemsOverrides.remove || []) {
    itemSet.delete(normalizeItemName(removeName));
  }

  for (const addEntry of itemsOverrides.add || []) {
    itemSet.add(normalizeItemName(addEntry.name));
    modifyMap.set(normalizeItemName(addEntry.name), addEntry);
  }

  for (const modifyEntry of itemsOverrides.modify || []) {
    modifyMap.set(normalizeItemName(modifyEntry.name), modifyEntry);
  }

  const sortedItems = Array.from(itemSet).sort();

  const entries = sortedItems.map((name, index) => {
    const baseDisplay = name.replace("minecraft:", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const override = modifyMap.get(name);
    return {
      id: index + 1,
      name,
      display_name: override?.display_name || baseDisplay,
      category: "item",
    };
  });

  const output = {
    format_version: 1,
    registry_name: "items",
    total_count: entries.length,
    entries,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  const blocksCount = (blocksData.entries || []).length;
  const lootCount = (lootData.items || []).length;
  const recipeCount = (recipeData.items || []).length;
  const addCount = (itemsOverrides.add || []).length;
  const removeCount = (itemsOverrides.remove || []).length;
  const modifyCount = (itemsOverrides.modify || []).length;
  
  console.log(`[enumerate_items] Wrote ${entries.length} items to ${OUTPUT_FILE}`);
  console.log(`[enumerate_items] Sources: ${blocksCount} blocks + ${lootCount} loot + ${recipeCount} recipes`);
  console.log(`[enumerate_items] Overrides: +${addCount} added, ${removeCount} removed, ${modifyCount} modified`);
}

main().catch(console.error);