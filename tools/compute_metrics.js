import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from "path";

const __dirname = dirname(new URL(import.meta.url).pathname);

const metricSources = {
    blocks: join(__dirname, "../packs/bp/data/registry_blocks.json"),
    items: join(__dirname, "../packs/bp/data/registry_items.json"),
    enchantments: join(__dirname, "../packs/bp/data/registry_enchantments.json"),
    entities: join(__dirname, "../packs/bp/data/registry_entities.json"),
    biomes: join(__dirname, "../packs/bp/data/registry_biomes.json"),
    effects: join(__dirname, "../packs/bp/data/registry_effects.json"),
};

const outputLines = ['// Auto-generated metrics file'];

Object.entries(metricSources).forEach(([key, path]) => {
    if (existsSync(path)) {
        try {
            const data = JSON.parse(readFileSync(path, "utf8"));
            console.log(`${key}: ${data.total_count}`);
            outputLines.push(`export const TOTAL_${key.toUpperCase()} = ${data.total_count};`);
        } catch (e) {
            console.error(`Error parsing ${key} data:`, e.message);
        }
    } else {
        console.warn(`Metric source for ${key} not found at path: ${path}`);
    }
});

writeFileSync(join(__dirname, "../src/scripts/dynamic/computed-metrics.ts"), outputLines.join("\n"));
