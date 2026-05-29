import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { findVanillaPath } from "./vanilla-finder.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const VANILLA_RP = findVanillaPath();
const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_blocks.json");

console.log("[enumerate_blocks] Starting...");
console.log("[enumerate_blocks] Looking for vanilla RP at:", VANILLA_RP);

const blocks = [];

const blocksJsonPath = join(VANILLA_RP, "blocks.json");
if (existsSync(blocksJsonPath)) {
  try {
    const rawContent = readFileSync(blocksJsonPath, "utf8");
    // May contain comments, so remove them before parsing
    const cleanContent = rawContent
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const content = JSON.parse(cleanContent);
    if (typeof content === "object" && content !== null) {
      let id = 1;
      for (const [blockName] of Object.entries(content)) {
        blocks.push({
          id: id++,
          name: blockName,
          display_name:
            capitalCase(blockName.replace("minecraft:", "").replace(/_/g, " ")) ||
            blockName,
        });
      }
    }
  } catch (e) {
    console.log("[enumerate_blocks] Error parsing blocks.json:", e.message);
  }
}

if (blocks.length === 0) {
  throw new Error(
    "[enumerate_blocks] Error: No blocks found from vanilla RP. Please ensure you have a valid vanilla resource pack.",
  );
}

blocks.sort((a, b) => a.id - b.id);

const output = {
  format_version: 1,
  registry_name: "blocks",
  total_count: blocks.length,
  entries: blocks,
};

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(
  `[enumerate_blocks] Done. Wrote ${blocks.length} blocks to ${OUTPUT_FILE}`,
);