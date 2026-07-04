import { capitalCase } from "../../shared/formatting";
import { DifficultyLevel } from "./entity-variants";
import entities from "./entities";

const SPECIES_KEYS = ["0,0", "0,1", "0,2", "0,3", "0,4", "0,5", "1,0", "1,1", "1,2", "1,3", "1,4", "1,5"];

const NAMED_KEYS = [
  "1,1,1,7",
  "1,0,7,7",
  "0,1,7,3",
  "0,4,0,7",
  "0,5,11,7",
  "0,0,1,0",
  "0,5,6,3",
  "1,3,10,4",
  "1,5,0,14",
  "0,5,0,4",
  "1,2,0,7",
  "1,5,0,1",
  "0,3,9,6",
  "0,4,5,3",
  "1,4,14,0",
  "0,2,7,14",
  "1,3,14,0",
  "1,0,0,4",
  "0,1,14,0",
  "0,5,7,0",
  "1,0,4,4",
  "0,3,9,4",
];

const YELLOWTAIL_PARROTFISH = "0,3,9,4";
const COLORS = Object.freeze(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);

const enumerateCache = new Map<string, string[]>();
const countCache = new Map<string, number>();

export function enumerateTropicalFishVariants(entityId: string, difficulty: DifficultyLevel): string[] {
  const key = `${entityId}|${difficulty}`;
  const cached = enumerateCache.get(key);
  if (cached) return cached;

  let result: string[];
  if (difficulty === "basic") {
    result = [entityId];
  } else if (difficulty === "committed") {
    result = [entityId];
    for (const c of COLORS) result.push(`${entityId}+color:${c}`);
    for (const c2 of COLORS) result.push(`${entityId}+color2:${c2}`);
    for (const sk of SPECIES_KEYS) {
      const [v, mv] = sk.split(",");
      const parts = [`variant:${v}`, `mark_variant:${mv}`];
      parts.sort();
      result.push(`${entityId}+${parts.join("+")}`);
    }
    for (const nk of NAMED_KEYS) {
      if (nk === YELLOWTAIL_PARROTFISH) continue;
      const [v, mv, c, c2] = nk.split(",");
      const parts = [`variant:${v}`, `mark_variant:${mv}`, `color:${c}`, `color2:${c2}`];
      parts.sort();
      result.push(`${entityId}+${parts.join("+")}`);
    }
  } else {
    result = [entityId];
    for (const sk of SPECIES_KEYS) {
      const [v, mv] = sk.split(",");
      for (const c of COLORS) {
        for (const c2 of COLORS) {
          const parts = [`variant:${v}`, `mark_variant:${mv}`, `color:${c}`, `color2:${c2}`];
          parts.sort();
          result.push(`${entityId}+${parts.join("+")}`);
        }
      }
    }
  }

  enumerateCache.set(key, result);
  return result;
}

export function countTropicalFishVariants(entityId: string, difficulty: DifficultyLevel): number {
  const cacheKey = `${entityId}|${difficulty}`;
  const cached = countCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const count = enumerateTropicalFishVariants(entityId, difficulty).length;
  countCache.set(cacheKey, count);
  return count;
}

export function getTropicalFishDisplayName(variantParts: string[]): string | undefined {
  const variants = new Map<string, string>();
  for (const part of variantParts) {
    const [key, value] = part.split(":");
    variants.set(key, value);
  }

  const variantData =
    (entities as Record<string, { variants?: Record<string, unknown> }>)["minecraft:tropicalfish"]?.variants ?? {};

  const colorName = (key: string, value: string): string | undefined => {
    const map = variantData[key] as Record<string, string> | undefined;
    return map?.[value];
  };

  const allFour =
    variants.has("variant") && variants.has("mark_variant") && variants.has("color") && variants.has("color2");

  if (allFour) {
    const namedMap = variantData["c.variant,c.mark_variant,c.color,c.color2"] as Record<string, string> | undefined;
    if (namedMap) {
      const combo = `${variants.get("variant")},${variants.get("mark_variant")},${variants.get("color")},${variants.get("color2")}`;
      const named = namedMap[combo];
      if (named) {
        return `Tropical Fish (${capitalCase(named)})`;
      }
    }

    const speciesMap = variantData["c.variant,c.mark_variant"] as Record<string, string> | undefined;
    const species = speciesMap?.[`${variants.get("variant")},${variants.get("mark_variant")}`];
    const col = colorName("c.color", variants.get("color")!);
    const col2 = colorName("c.color2", variants.get("color2")!);
    if (species && col && col2) {
      const c = capitalCase(col);
      const c2 = capitalCase(col2);
      const s = capitalCase(species);
      if (variants.get("color") === variants.get("color2")) {
        return `Tropical Fish (${c} ${s})`;
      }
      return `Tropical Fish (${c}-${c2} ${s})`;
    }
  }

  const hasSpecies = variants.has("variant") && variants.has("mark_variant");
  const hasColor = variants.has("color");
  const hasColor2 = variants.has("color2");

  if (hasSpecies && !hasColor && !hasColor2) {
    const speciesMap = variantData["c.variant,c.mark_variant"] as Record<string, string> | undefined;
    const species = speciesMap?.[`${variants.get("variant")},${variants.get("mark_variant")}`];
    if (species) {
      return `Tropical Fish (${capitalCase(species)})`;
    }
  }

  if (variants.size === 1 && hasColor) {
    const col = colorName("c.color", variants.get("color")!);
    if (col) return `Tropical Fish (${capitalCase(col)} base color)`;
  }

  if (variants.size === 1 && hasColor2) {
    const col = colorName("c.color2", variants.get("color2")!);
    if (col) return `Tropical Fish (${capitalCase(col)} pattern color)`;
  }

  return undefined;
}
