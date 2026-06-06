import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { ensureMojangSamples } from "./vanilla-cache.js";

const __dirname = join(fileURLToPath(import.meta.url), "..");

async function main() {
  const VANILLA_RP = await ensureMojangSamples();
  const OUTPUT_FILE = join(__dirname, "../packs/bp/data/registry_blocks.json");

  console.log("[enumerate_blocks] Starting...");
  console.log("[enumerate_blocks] Using:", VANILLA_RP);

  const blocksJsonPath = join(VANILLA_RP, "resource_pack", "blocks.json");
  
  if (!existsSync(blocksJsonPath)) {
    throw new Error(`[enumerate_blocks] blocks.json not found at ${blocksJsonPath}`);
  }

  const rawContent = readFileSync(blocksJsonPath, "utf8");
  const cleanContent = rawContent.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const content = JSON.parse(cleanContent);

  const blocks = [];
  let id = 1;
  for (const [blockName] of Object.entries(content)) {
    blocks.push({
      id: id++,
      name: blockName,
      display_name: capitalCase(blockName.replace("minecraft:", "").replace(/_/g, " ")) || blockName,
    });
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
  console.log(`[enumerate_blocks] Wrote ${blocks.length} blocks to ${OUTPUT_FILE}`);
}

main().catch(console.error);