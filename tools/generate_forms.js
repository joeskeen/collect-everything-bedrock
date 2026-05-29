import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const BLOCKS_FILE = join(__dirname, "../packs/bp/data/registry_blocks.json");
const ITEMS_FILE = join(__dirname, "../packs/bp/data/registry_items.json");
const ENTITIES_FILE = join(__dirname, "../packs/bp/data/registry_entities.json");
const BIOMES_FILE = join(__dirname, "../packs/bp/data/registry_biomes.json");
const OUTPUT_DIR = join(__dirname, "../packs/bp/data/forms");

function sortEntries(entries, collectedSet, sortType) {
  return [...entries].sort((a, b) => {
    if (sortType === "alphabetical") {
      return (a.display_name || a.name).localeCompare(b.display_name || b.name);
    }
    if (sortType === "grouped") {
      const ga = a.group || a.category || "other";
      const gb = b.group || b.category || "other";
      if (ga !== gb) return ga.localeCompare(gb);
      return (a.display_name || a.name).localeCompare(b.display_name || b.name);
    }
    let aC = collectedSet.has(a.name) ? 1 : 0;
    let bC = collectedSet.has(b.name) ? 1 : 0;
    if (sortType === "completed") {
      if (aC !== bC) return bC - aC;
    } else if (sortType === "incomplete") {
      if (aC !== bC) return aC - bC;
    }
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });
}

function buildCollectionBrowserForm(registry, collectedSet, category, viewType) {
  const entries = registry.entries || [];
  const sortTypeMap = {
    Alphabetical: "alphabetical",
    Grouped: "grouped",
    "Completed First": "completed",
    "Incomplete First": "incomplete",
  };
  const sortType = sortTypeMap[viewType];
  const sortedEntries = sortType
    ? sortEntries(entries, collectedSet, sortType)
    : entries;

  const collectedCount = entries.filter((e) => collectedSet.has(e.name)).length;
  const buttons = sortedEntries.slice(0, 30).map((entry) => {
    const collected = collectedSet.has(entry.name);
    return {
      text: `${collected ? "✔" : "✘"} ${entry.display_name || entry.name}`,
      data: entry.name,
    };
  });

  return {
    form_title: `${category} Collection (${collectedCount}/${entries.length})`,
    view_type: viewType,
    buttons: buttons,
    has_more: sortedEntries.length > 30,
  };
}

function buildMainBrowserForm(blocksCount, itemsCount, entitiesCount, biomesCount) {
  return {
    form_title: "Collect Everything — Browser",
    body: `Track your exploration progress!\n\nBlocks: ${blocksCount}\nItems: ${itemsCount}\nEntities: ${entitiesCount}\nBiomes: ${biomesCount}`,
    buttons: [
      { text: "Blocks", data: "blocks" },
      { text: "Items", data: "items" },
      { text: "Entities", data: "entities" },
      { text: "Biomes", data: "biomes" },
      { text: "Settings", data: "settings" },
    ],
    view_buttons: [
      { text: "Alphabetical", data: "alpha" },
      { text: "Grouped", data: "grouped" },
      { text: "Completed First", data: "completed" },
      { text: "Incomplete First", data: "incomplete" },
    ],
  };
}

function buildSettingsForm(settings) {
  return {
    form_title: "Collection Settings",
    toggles: [
      {
        label: "Track Horse Variants",
        data: "horse_variants",
        value: settings.horse_variants,
      },
      {
        label: "Track Tropical Fish Variants",
        data: "fish_variants",
        value: settings.fish_variants,
      },
      {
        label: "Collect by Villager Trade",
        data: "by_trade",
        value: settings.by_trade,
      },
      {
        label: "Collect by Naming",
        data: "by_naming",
        value: settings.by_naming,
      },
      {
        label: "Collect by Vanquishing (Killing)",
        data: "by_vanquish",
        value: settings.by_vanquish,
      },
      {
        label: "Show HUD Overlay",
        data: "hud_enabled",
        value: settings.hud_enabled,
      },
      {
        label: "Show Discovery Notifications",
        data: "notifications_enabled",
        value: settings.notifications_enabled,
      },
    ],
    buttons: [
      { text: "Save & Close", data: "save" },
      { text: "Cancel", data: "cancel" },
    ],
  };
}

console.log("[generate_forms] Starting...");

mkdirSync(OUTPUT_DIR, { recursive: true });

let blocksCount = 0;
let itemsCount = 0;
let entitiesCount = 0;
let biomesCount = 0;
let blocksData = { entries: [] };
let itemsData = { entries: [] };
let entitiesData = { entries: [] };
let biomesData = { entries: [] };

if (existsSync(BLOCKS_FILE)) {
  blocksData = JSON.parse(readFileSync(BLOCKS_FILE, "utf8"));
  blocksCount = blocksData.total_count || blocksData.entries?.length || 0;
}
if (existsSync(ITEMS_FILE)) {
  itemsData = JSON.parse(readFileSync(ITEMS_FILE, "utf8"));
  itemsCount = itemsData.total_count || itemsData.entries?.length || 0;
}
if (existsSync(ENTITIES_FILE)) {
  entitiesData = JSON.parse(readFileSync(ENTITIES_FILE, "utf8"));
  entitiesCount = entitiesData.total_count || entitiesData.entries?.length || 0;
}
if (existsSync(BIOMES_FILE)) {
  biomesData = JSON.parse(readFileSync(BIOMES_FILE, "utf8"));
  biomesCount = biomesData.total_count || biomesData.entries?.length || 0;
}

const mainForm = buildMainBrowserForm(blocksCount, itemsCount, entitiesCount, biomesCount);
writeFileSync(
  join(OUTPUT_DIR, "main_browser.json"),
  JSON.stringify(mainForm, null, 2),
);
console.log("[generate_forms] Generated main_browser form");

const defaultSettings = {
  horse_variants: false,
  fish_variants: false,
  by_trade: true,
  by_naming: true,
  by_vanquish: true,
  hud_enabled: true,
  notifications_enabled: true,
};
const settingsForm = buildSettingsForm(defaultSettings);
writeFileSync(
  join(OUTPUT_DIR, "settings.json"),
  JSON.stringify(settingsForm, null, 2),
);
console.log("[generate_forms] Generated settings form");

const collectedSet = new Set();
const viewTypeMap = {
  alpha: "Alphabetical",
  grouped: "Grouped",
  completed: "Completed First",
  incomplete: "Incomplete First",
};
for (const [vtKey, viewType] of Object.entries(viewTypeMap)) {
  if (blocksData.entries?.length > 0) {
    const form = buildCollectionBrowserForm(
      blocksData,
      collectedSet,
      "Blocks",
      viewType,
    );
    writeFileSync(
      join(OUTPUT_DIR, `blocks_${vtKey}.json`),
      JSON.stringify(form, null, 2),
    );
  }
  if (itemsData.entries?.length > 0) {
    const form = buildCollectionBrowserForm(
      itemsData,
      collectedSet,
      "Items",
      viewType,
    );
    writeFileSync(
      join(OUTPUT_DIR, `items_${vtKey}.json`),
      JSON.stringify(form, null, 2),
    );
  }
  if (entitiesData.entries?.length > 0) {
    const form = buildCollectionBrowserForm(
      entitiesData,
      collectedSet,
      "Entities",
      viewType,
    );
    writeFileSync(
      join(OUTPUT_DIR, `entities_${vtKey}.json`),
      JSON.stringify(form, null, 2),
    );
  }
  if (biomesData.entries?.length > 0) {
    const form = buildCollectionBrowserForm(
      biomesData,
      collectedSet,
      "Biomes",
      viewType,
    );
    writeFileSync(
      join(OUTPUT_DIR, `biomes_${vtKey}.json`),
      JSON.stringify(form, null, 2),
    );
  }
}

console.log("[generate_forms] Done.");