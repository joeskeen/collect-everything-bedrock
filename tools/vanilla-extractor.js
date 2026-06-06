import { existsSync, readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureVanillaPacks, BP_EXTRACTED_DIR, RP_EXTRACTED_DIR } from "./vanilla-downloader.js";

export async function findVanillaBPPathEnsured() {
  await ensureVanillaPacks();
  return BP_EXTRACTED_DIR;
}

export async function findVanillaRPPathEnsured() {
  await ensureVanillaPacks();
  return RP_EXTRACTED_DIR;
}

export function findLootTablePathsFromExtracted(bpPath) {
  const lootTablesPath = join(bpPath, "loot_tables");
  const paths = [];

  function walkDir(dir, prefix = "") {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walkDir(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith(".json")) {
        const tableName = entry.name.replace(".json", "");
        const path = prefix ? `${prefix}/${tableName}` : tableName;
        paths.push(path);
      }
    }
  }

  if (existsSync(lootTablesPath)) {
    walkDir(lootTablesPath);
  }
  return paths;
}

export async function enumerateLootTableItemsFromExtracted(bpPath) {
  const lootTablesPath = join(bpPath, "loot_tables");
  const itemsMap = new Map();

  function processFile(filePath) {
    try {
      const content = readFileSync(filePath, "utf8").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const lootTable = JSON.parse(content);

      function processEntries(entries) {
        for (const entry of entries || []) {
          if (entry.type === "item" && entry.name) {
            itemsMap.set(entry.name, true);
          }
          if (entry.subTable && entry.subTable.pools) {
            for (const pool of entry.subTable.pools) {
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
    } catch (e) {
      // Skip invalid files
    }
  }

  function walkDir(dir, prefix = "") {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.name.endsWith(".json")) {
        processFile(fullPath);
      }
    }
  }

  if (existsSync(lootTablesPath)) {
    walkDir(lootTablesPath);
  }
  return Array.from(itemsMap.keys()).sort();
}
