import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_RP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_entities.json");

  console.log("[enumerate_entities] Starting...");
  console.log("[enumerate_entities] Using:", VANILLA_RP);

  const entityDir = join(VANILLA_RP, "resource_pack", "entity");
  
  if (!existsSync(entityDir)) {
    throw new Error(`[enumerate_entities] Entity directory not found at ${entityDir}`);
  }

  const entities = [];
  const files = readdirSync(entityDir);

  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const entityData = JSON.parse(readFileSync(join(entityDir, file), "utf8"));
        const identifier = entityData?.["minecraft:client_entity"]?.description?.identifier;
        if (identifier) {
          entities.push({
            id: entities.length + 1,
            name: identifier,
            display_name: capitalCase(identifier.replace("minecraft:", "").replace(/_/g, " ")) || identifier,
            category: "mob",
          });
        }
      } catch (e) {
        // Skip malformed files
      }
    }
  }

  entities.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    format_version: 1,
    registry_name: "entities",
    total_count: entities.length,
    entries: entities,
  };

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`[enumerate_entities] Wrote ${entities.length} entities to ${OUTPUT_FILE}`);
}

main().catch(console.error);