import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { capitalCase } from "change-case";
import { JSDOM } from "jsdom";

const __dirname = join(fileURLToPath(import.meta.url), "..");

const OUTPUT_DIR = join(__dirname, "../packs/bp/data");
const BASE_URL = "https://bedrock.dev/docs/stable/Addons";

async function scrape(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function cleanHeading(text) {
  return text.replace(/#$/, "").trim();
}

function findSection(document, name) {
  const allHeaders = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")];
  const heading = allHeaders.find((h) => cleanHeading(h.textContent || "") === name);
  return heading || null;
}

function parseAuxValueToBlockStates(document) {
  const blocks = new Map();

  const sectionHeading = findSection(document, "AuxValueToBlockStatesMap");
  if (!sectionHeading) {
    console.log("[scrape-bedrock] Could not find AuxValueToBlockStatesMap section");
    return [];
  }

  let current = sectionHeading.nextElementSibling;
  while (current && current.tagName !== "H1") {
    if (current.tagName === "TABLE") {
      const rows = current.querySelectorAll("tr");
      for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          const firstCell = cells[0].textContent?.trim() || "";
          const match = firstCell.match(/^(minecraft:[a-z_]+):(\d+)$/);
          if (match) {
            const blockName = match[1];
            if (!blocks.has(blockName)) {
              blocks.set(blockName, {
                name: blockName,
                display_name: capitalCase(blockName.replace("minecraft:", "").replace(/_/g, " ")),
              });
            }
          }
        }
      }
    }
    current = current.nextElementSibling;
  }

  return Array.from(blocks.values()).sort((a, b) => a.name.localeCompare(b.name)).map((b, i) => ({ ...b, id: i + 1 }));
}

function parseTableSection(document, sectionName) {
  const items = new Map();

  const sectionHeading = findSection(document, sectionName);
  if (!sectionHeading) return [];

  let current = sectionHeading.nextElementSibling;
  while (current && current.tagName !== "H1") {
    if (current.tagName === "TABLE") {
      const rows = current.querySelectorAll("tr");
      for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 1) {
          const identifier = cells[0].textContent?.trim() || "";
          if (identifier && !identifier.includes(" ") && identifier !== "Identifier" && identifier !== "Name" && identifier !== "Damage Source ID") {
            const fullName = identifier.startsWith("minecraft:") ? identifier : `minecraft:${identifier}`;
            if (!items.has(fullName)) {
              items.set(fullName, {
                name: fullName,
                display_name: capitalCase(identifier.replace("minecraft:", "").replace(/_/g, " ")),
              });
            }
          }
        }
      }
    }
    current = current.nextElementSibling;
  }

  return Array.from(items.values()).sort((a, b) => a.name.localeCompare(b.name)).map((item, i) => ({ ...item, id: i + 1 }));
}

function parseBlockStates(document) {
  const blockStates = [];

  const sectionHeading = findSection(document, "BlockStates");
  if (!sectionHeading) return [];

  let current = sectionHeading.nextElementSibling;
  while (current && current.tagName !== "H1") {
    if (current.tagName === "TABLE") {
      const rows = current.querySelectorAll("tr");
      for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
          const name = cells[0].textContent?.trim() || "";
          const type = cells[1].textContent?.trim() || "";
          const description = cells[2].textContent?.trim() || "";
          const valuesText = cells[3].textContent?.trim() || "";

          let values = null;
          if (type === "String" && valuesText.includes(",")) {
            values = valuesText.split(",").map((v) => v.trim());
          } else if (type === "Integer" && valuesText.includes("-")) {
            const parts = valuesText.split("-").map((v) => v.trim());
            values = { min: parseInt(parts[0]), max: parseInt(parts[1]) };
          } else if (valuesText === "True, False" || valuesText === "True, False ") {
            values = [true, false];
          }

          blockStates.push({
            name,
            type,
            description: description.substring(0, 100),
            values,
          });
        }
      }
      break;
    }
    current = current.nextElementSibling;
  }

  return blockStates.sort((a, b) => a.name.localeCompare(b.name)).map((s, i) => ({ ...s, id: i + 1 }));
}

function parseBlockStateMappings(document) {
  const stateToBlocks = {};
  const variantBlocks = new Set();

  const sectionHeading = findSection(document, "AuxValueToBlockStatesMap");
  if (!sectionHeading) return { stateToBlocks: {}, blocks: [] };

  let current = sectionHeading.nextElementSibling;
  while (current && current.tagName !== "H1") {
    if (current.tagName === "TABLE") {
      const rows = current.querySelectorAll("tr");
      for (const row of rows) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 4) {
          const blockName = cells[1].textContent?.trim() || "";
          const statesText = cells[3].textContent?.trim() || "";

          const stateMatches = statesText.matchAll(/\"([^\"]+)\"\s*=/g);
          for (const match of stateMatches) {
            const stateName = match[1];
            if (!stateToBlocks[stateName]) stateToBlocks[stateName] = new Set();
            stateToBlocks[stateName].add(blockName);
          }

          variantBlocks.add(blockName);
        }
      }
    }
    current = current.nextElementSibling;
  }

  const blockList = Array.from(variantBlocks).sort().map((name, i) => ({
    id: i + 1,
    name,
    display_name: capitalCase(name.replace("minecraft:", "").replace(/_/g, " ")),
  }));

  const mappings = Object.fromEntries(
    Object.entries(stateToBlocks).map(([k, v]) => [k, Array.from(v).sort()])
  );

  return { stateToBlocks: mappings, blocks: blockList };
}

async function run() {
  console.log("[scrape-bedrock] Fetching Addons documentation...");

  const html = await scrape(BASE_URL);
  const dom = new JSDOM(html);
  const document = dom.window.document;

  console.log("[scrape-bedrock] Parsing sections...");

  const blocks = parseAuxValueToBlockStates(document);
  console.log(`[scrape-bedrock] Found ${blocks.length} blocks`);

  const entities = parseTableSection(document, "Entities");
  console.log(`[scrape-bedrock] Found ${entities.length} entities`);

  const items = parseTableSection(document, "Items");
  console.log(`[scrape-bedrock] Found ${items.length} items`);

  const damageSources = parseTableSection(document, "Entity Damage Source");
  console.log(`[scrape-bedrock] Found ${damageSources.length} damage sources`);

  const blockStates = parseBlockStates(document);
  console.log(`[scrape-bedrock] Found ${blockStates.length} block states`);

  const { stateToBlocks, blocks: variantBlocks } = parseBlockStateMappings(document);
  console.log(`[scrape-bedrock] Found ${variantBlocks.length} blocks with state variants`);
  console.log(`[scrape-bedrock] Mapped ${Object.keys(stateToBlocks).length} states to blocks`);

  console.log("[scrape-bedrock] Note: Biomes are on a separate page");

  const outputTypes = [
    { name: "blocks", data: blocks },
    { name: "entities", data: entities },
    { name: "items", data: items },
    { name: "damage_sources", data: damageSources },
    { name: "block_states", data: blockStates },
    { name: "variant_blocks", data: variantBlocks },
  ];

  for (const { name, data } of outputTypes) {
    if (data.length === 0) continue;

    const output = {
      format_version: 1,
      registry_name: name,
      total_count: data.length,
      entries: data,
    };

    if (name === "variant_blocks") {
      output.state_mappings = stateToBlocks;
    }

    const outputFile = join(OUTPUT_DIR, `registry_${name}.json`);
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`[scrape-bedrock] Wrote ${data.length} ${name} to ${outputFile}`);
  }

  console.log("[scrape-bedrock] Done.");
}

run().catch(console.error);