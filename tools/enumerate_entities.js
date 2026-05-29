import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { findVanillaPath } from "./vanilla-finder.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const VANILLA_RP = findVanillaPath();
const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_entities.json");

console.log("[enumerate_entities] Starting...");
console.log("[enumerate_entities] Looking for vanilla RP at:", VANILLA_RP);

const entities = [];
const entityDir = join(VANILLA_RP, "entity");

if (existsSync(entityDir)) {
  const files = readdirSync(entityDir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const entityData = JSON.parse(readFileSync(join(entityDir, file), "utf8"));
        const identifier =
          entityData?.["minecraft:client_entity"]?.description?.identifier;
        if (identifier) {
          entities.push({
            id: entities.length + 1,
            name: identifier,
            display_name:
              capitalCase(
                identifier.replace("minecraft:", "").replace(/_/g, " "),
              ) || identifier,
            category: "mob",
          });
        }
      } catch (e) {
        // Skip malformed files
      }
    }
  }
}

if (entities.length === 0) {
  throw new Error(
    "[enumerate_entities] Error: No entities found from vanilla RP. Please ensure you have a valid vanilla resource pack.",
  );
}

entities.sort((a, b) => a.id - b.id);

const output = {
  format_version: 1,
  registry_name: "entities",
  total_count: entities.length,
  entries: entities,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(
  `[enumerate_entities] Done. Wrote ${entities.length} entities to ${OUTPUT_FILE}`,
);