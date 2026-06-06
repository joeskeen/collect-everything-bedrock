import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_BP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_loot_table_paths.json");
  const ITEMS_OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_loot_items.json");

  console.log("[enumerate_loot_tables] Starting...");
  console.log("[enumerate_loot_tables] Using:", VANILLA_BP);

  const lootTablesDir = join(VANILLA_BP, "behavior_pack", "loot_tables");
  
  if (!existsSync(lootTablesDir)) {
    throw new Error(`[enumerate_loot_tables] loot_tables directory not found at ${lootTablesDir}`);
  }

  const paths = [];
  const itemsMap = new Map();

  function processLootTableFile(filePath) {
    try {
      const content = readFileSync(filePath, "utf8");
      const lootTable = JSON.parse(content);
      
      const lootPath = filePath.replace(lootTablesDir + "/", "").replace(".json", "");
      
      function processEntries(entries) {
        for (const entry of entries || []) {
          if (entry.type === "item" && entry.name) {
            itemsMap.set(entry.name, true);
          }
          if (entry.subTable?.pools) {
            for (const pool of entry.subTable.pools) {
              processEntries(pool.entries);
            }
          }
          if (entry.loot_table?.pools) {
            for (const pool of entry.loot_table.pools) {
              processEntries(pool.entries);
            }
          }
        }
      }

      if (lootTable.pools) {
        for (const pool of lootTable.pools) {
          processEntries(pool.entries);
        }
      }
      
      return lootPath;
    } catch (e) {
      return null;
    }
  }

  function walkDirectory(dir, basePath = "") {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        walkDirectory(fullPath, relativePath);
      } else if (entry.name.endsWith(".json")) {
        const lootPath = processLootTableFile(fullPath);
        if (lootPath) paths.push(lootPath);
      }
    }
  }

  walkDirectory(lootTablesDir);

  const sortedPaths = paths.sort();
  console.log(`[enumerate_loot_tables] Found ${sortedPaths.length} loot table paths`);
  console.log(`[enumerate_loot_tables] Found ${itemsMap.size} unique items from loot tables`);

  const pathsOutput = {
    format_version: 1,
    registry_name: "loot_table_paths",
    total_count: sortedPaths.length,
    paths: sortedPaths,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(pathsOutput, null, 2));
  console.log(`[enumerate_loot_tables] Wrote ${sortedPaths.length} paths to ${OUTPUT_FILE}`);

  const itemsOutput = {
    format_version: 1,
    registry_name: "loot_items",
    total_count: itemsMap.size,
    items: Array.from(itemsMap.keys()).sort(),
  };

  writeFileSync(ITEMS_OUTPUT_FILE, JSON.stringify(itemsOutput, null, 2));
  console.log(`[enumerate_loot_tables] Wrote ${itemsMap.size} items to ${ITEMS_OUTPUT_FILE}`);
  console.log("[enumerate_loot_tables] Done!");
}

main().catch(console.error);