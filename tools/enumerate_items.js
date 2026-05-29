import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { findVanillaBPPath } from "./vanilla-finder.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const VANILLA_BP = findVanillaBPPath();
const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_items.json");

console.log("[enumerate_items] Starting...");
console.log("[enumerate_items] Looking for vanilla BP at:", VANILLA_BP);

const itemsMap = new Map();

const craftingCatalogPath = join(VANILLA_BP, "item_catalog", "crafting_item_catalog.json");
if (existsSync(craftingCatalogPath)) {
  try {
    const rawContent = readFileSync(craftingCatalogPath, "utf8");
    const cleanContent = rawContent
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const content = JSON.parse(cleanContent);
    if (content && content["minecraft:crafting_items_catalog"]) {
      const catalog = content["minecraft:crafting_items_catalog"];
      if (catalog.categories) {
        for (const category of catalog.categories) {
          if (category.groups) {
            for (const group of category.groups) {
              if (group.items) {
                for (const itemId of group.items) {
                  if (!itemsMap.has(itemId)) {
                    itemsMap.set(itemId, {
                      name: itemId,
                      display_name: capitalCase(itemId.replace("minecraft:", "").replace(/_/g, " ")),
                      category: category.category_name,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("[enumerate_items] Error parsing crafting_item_catalog.json:", e.message);
  }
}

if (itemsMap.size === 0) {
  throw new Error(
    "[enumerate_items] Error: No items found from vanilla BP. Please ensure you have a valid vanilla behavior pack.",
  );
}

const items = Array.from(itemsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
items.forEach((item, index) => {
  item.id = index + 1;
});

const output = {
  format_version: 1,
  registry_name: "items",
  total_count: items.length,
  entries: items,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(
  `[enumerate_items] Done. Wrote ${items.length} items to ${OUTPUT_FILE}`,
);