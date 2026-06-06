import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_BP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_recipe_items.json");

  console.log("[enumerate_recipes] Starting...");
  console.log("[enumerate_recipes] Using:", VANILLA_BP);

  const recipesDir = join(VANILLA_BP, "behavior_pack", "recipes");
  
  if (!existsSync(recipesDir)) {
    throw new Error(`[enumerate_recipes] recipes directory not found at ${recipesDir}`);
  }

  const itemsMap = new Map();

  function processRecipeFile(filePath) {
    try {
      const content = readFileSync(filePath, "utf8");
      const recipe = JSON.parse(content);

      function extractResult(r) {
        if (r?.item) return r.item;
        if (r?.items) {
          for (const item of r.items) {
            if (item?.item) return item.item;
          }
        }
        return null;
      }

      for (const type of Object.values(recipe)) {
        if (typeof type === "object" && type !== null) {
          const result = type.result || type["minecraft:recipe_shaped"]?.result || type["minecraft:recipe_shapeless"]?.result;
          if (result) {
            const item = extractResult(result);
            if (item) itemsMap.set(item, true);
          }
        }
      }
    } catch (e) {
      // Skip malformed recipes
    }
  }

  function walkDirectory(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkDirectory(fullPath);
      } else if (entry.name.endsWith(".json")) {
        processRecipeFile(fullPath);
      }
    }
  }

  walkDirectory(recipesDir);

  const sortedItems = Array.from(itemsMap.keys()).sort();
  console.log(`[enumerate_recipes] Found ${sortedItems.length} unique recipe outputs`);

  const output = {
    format_version: 1,
    registry_name: "recipe_items",
    total_count: sortedItems.length,
    items: sortedItems,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`[enumerate_recipes] Wrote ${sortedItems.length} items to ${OUTPUT_FILE}`);
  console.log("[enumerate_recipes] Done!");
}

main().catch(console.error);