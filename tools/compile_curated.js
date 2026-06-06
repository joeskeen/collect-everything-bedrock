import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURATED_DIR = join(__dirname, "..", "curated");
const OUTPUT_DIR = join(__dirname, "..", "src", "scripts", "generated");

mkdirSync(OUTPUT_DIR, { recursive: true });

const entityPropsData = JSON.parse(readFileSync(join(CURATED_DIR, "entity_properties.json"), "utf-8"));
const unobtainableData = JSON.parse(readFileSync(join(CURATED_DIR, "unobtainable_blocks.json"), "utf-8"));
const paletteData = JSON.parse(readFileSync(join(CURATED_DIR, "palette_colors.json"), "utf-8"));

const entityPropertiesOutput = `// Auto-generated from curated/entity_properties.json - DO NOT EDIT
export const ENTITY_PROPERTIES = ${JSON.stringify(entityPropsData, null, 2)} as const;
`;
writeFileSync(join(OUTPUT_DIR, "entity_properties.ts"), entityPropertiesOutput);
console.log("Generated: entity_properties.ts");

const unobtainableBlocksOutput = `// Auto-generated from curated/unobtainable_blocks.json - DO NOT EDIT
export const UNOBTAINABLE_BLOCKS = ${JSON.stringify(unobtainableData.entries, null, 2)} as const;
`;
writeFileSync(join(OUTPUT_DIR, "unobtainable_blocks.ts"), unobtainableBlocksOutput);
console.log("Generated: unobtainable_blocks.ts");

const paletteColorsOutput = `// Auto-generated from curated/palette_colors.json - DO NOT EDIT
export const PALETTE_COLORS = ${JSON.stringify(paletteData, null, 2)} as const;
`;
writeFileSync(join(OUTPUT_DIR, "palette_colors.ts"), paletteColorsOutput);
console.log("Generated: palette_colors.ts");

const entityPropertyCount = Object.keys(entityPropsData.properties).length;
const paletteColorCount = paletteData.values.length;
const unobtainableBlockCount = unobtainableData.entries.length;

const entitiesWithColor = entityPropsData.properties["minecraft:color"]?.entities ?? [];
const entitiesWithColor2 = entityPropsData.properties["minecraft:color2"]?.entities ?? [];
const entitiesWithClimateVariant = entityPropsData.properties["minecraft:climate_variant"]?.entities ?? [];

const statsOutput = `// Auto-generated from curated/*.json - DO NOT EDIT
export const CURATED_STATS = {
  paletteColorCount: ${paletteColorCount},
  entityPropertyCount: ${entityPropertyCount},
  unobtainableBlockCount: ${unobtainableBlockCount},
  entitiesWithColor: ${entitiesWithColor.length},
  entitiesWithColor2: ${entitiesWithColor2.length},
  entitiesWithClimateVariant: ${entitiesWithClimateVariant.length},
  colorCombinations: ${paletteColorCount * entitiesWithColor.length},
  color2Combinations: ${paletteColorCount * entitiesWithColor2.length},
  climateVariantCombinations: ${entitiesWithClimateVariant.length * 3},
} as const;
`;
mkdirSync(join(OUTPUT_DIR, "stats"), { recursive: true });
writeFileSync(join(OUTPUT_DIR, "stats", "index.ts"), statsOutput);
console.log("Generated: stats/index.ts");
