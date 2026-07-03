import entitiesModule, { EntityData } from "./entities";

export type DifficultyLevel = "basic" | "committed" | "insane";

export interface VariantCounter {
  enumerateEntityVariants: (entityId: string, difficulty?: DifficultyLevel) => string[];
  enumerateEntityDataVariants: (entityData: EntityData, difficulty?: DifficultyLevel) => string[];
  countEntityVariants: (entityId: string, difficulty?: DifficultyLevel) => number;
  countEntityDataVariants: (entityData: EntityData, difficulty?: DifficultyLevel) => number;
}

export function createVariantCounter(entitiesOverride?: Record<string, EntityData>): VariantCounter {
  const entities = entitiesOverride ?? (entitiesModule as unknown as Record<string, EntityData>);

  function parseExclusions(entityData: EntityData): { negatedComponent: string; otherComponent: string }[] {
    const exclusions: { negatedComponent: string; otherComponent: string }[] = [];
    if (!entityData.exclusions) return exclusions;

    for (const exclusion of entityData.exclusions) {
      const match = exclusion.match(/^!((c\.\w+)|\w+)\+((c\.\w+)|\w+)$/);
      if (!match) continue;

      const negatedFull = match[1];
      const otherFull = match[3];

      const negatedComponent = negatedFull.replace(/^c\./, "");
      const otherComponent = otherFull.replace(/^c\./, "");

      exclusions.push({ negatedComponent, otherComponent });
    }
    return exclusions;
  }

  function normalizeKey(key: string): string {
    return key.replace(/^(c\.|p\.)/, "");
  }

  const booleanDisplayValues = new Map<string, string>();

  function formatVariantValue(key: string, value: string): string | null {
    const normalized = normalizeKey(key);
    const displayValue = booleanDisplayValues.get(normalized);
    if (displayValue !== undefined) {
      return value === "true" ? displayValue : null;
    }
    return `${normalized}:${value}`;
  }

  function applyExclusions(
    combinations: string[],
    exclusions: { negatedComponent: string; otherComponent: string }[]
  ): string[] {
    const result: string[] = [];
    const seen = new Set<string>();

    for (const combo of combinations) {
      const parts = combo.split("+");
      const partMap: Record<string, string> = {};
      for (const part of parts) {
        const idx = part.indexOf(":");
        const key = part.substring(0, idx);
        const value = part.substring(idx + 1);
        partMap[normalizeKey(key)] = value;
      }

      for (const exclusion of exclusions) {
        if (partMap[exclusion.negatedComponent] === "true" && partMap[exclusion.otherComponent] !== undefined) {
          delete partMap[exclusion.otherComponent];
        }
      }

      const newCombo = Object.entries(partMap)
        .map(([k, v]) => formatVariantValue(k, v))
        .filter((v): v is string => v !== null)
        .sort()
        .join("+");

      if (!seen.has(newCombo)) {
        seen.add(newCombo);
        result.push(newCombo);
      }
    }

    return result;
  }

  function enumerateEntityDataVariants(entityData: EntityData, difficulty: DifficultyLevel = "insane"): string[] {
    if (!entityData.variants) return [];

    booleanDisplayValues.clear();
    const variantKeys = Object.keys(entityData.variants).filter((k) => !k.includes(","));
    const variantDefinitions: { key: string; values: string[] }[] = [];

    for (const key of variantKeys) {
      const value = entityData.variants[key];
      if (typeof value === "string") {
        variantDefinitions.push({ key, values: ["true", "false"] });
        booleanDisplayValues.set(normalizeKey(key), value);
      } else if (typeof value === "object" && value !== null) {
        variantDefinitions.push({ key, values: Object.keys(value) });
      }
    }

    if (variantDefinitions.length === 0) return [];

    const exclusions = parseExclusions(entityData);

    if (difficulty === "basic") {
      return [""];
    }

    if (difficulty === "committed") {
      const result: string[] = [];
      for (const { key, values } of variantDefinitions) {
        for (const value of values) {
          if (value === "undefined") continue;
          const formatted = formatVariantValue(key, value);
          if (formatted) result.push(formatted);
        }
      }
      return result;
    }

    function generateCombinations(index: number, current: string[]): string[] {
      if (index === variantDefinitions.length) {
        return [current.sort().join("+")];
      }

      const { key, values } = variantDefinitions[index];
      const results: string[] = [];

      for (const value of values) {
        const comboName = `${key}:${value}`;
        const newCombo = [...current, comboName];
        const validCombos = generateCombinations(index + 1, newCombo);
        results.push(...validCombos);
      }

      return results;
    }

    function getSubsetCombinations(arr: string[], size: number): string[][] {
      if (size === 1) return arr.map((item) => [item]);
      if (size >= arr.length) return [arr];

      const results: string[][] = [];
      for (let i = 0; i <= arr.length - size; i++) {
        const first = arr[i];
        const rest = getSubsetCombinations(arr.slice(i + 1), size - 1);
        for (const combo of rest) {
          results.push([first, ...combo]);
        }
      }
      return results;
    }

    let combinations = generateCombinations(0, []);
    combinations = applyExclusions(combinations, exclusions);

    const allSubsets = new Set<string>();
    for (const combo of combinations) {
      const parts = combo.split("+");
      for (let i = 1; i <= parts.length; i++) {
        const subsetCombos = getSubsetCombinations(parts, i);
        for (const subset of subsetCombos) {
          allSubsets.add(subset.sort().join("+"));
        }
      }
    }
    return Array.from(allSubsets);
  }

  function countEntityDataVariants(entityData: EntityData, difficulty: DifficultyLevel = "insane"): number {
    return enumerateEntityDataVariants(entityData, difficulty).length;
  }

  function enumerateEntityVariants(entityId: string, difficulty: DifficultyLevel = "insane"): string[] {
    const data = entities[entityId];
    if (!data) return [entityId];
    if (difficulty === "basic") {
      return [entityId];
    }
    const variants = enumerateEntityDataVariants(data, difficulty);
    return variants.length ? [entityId, ...variants.map((v) => (v ? `${entityId}+${v}` : entityId))] : [entityId];
  }

  function countEntityVariants(entityId: string, difficulty: DifficultyLevel = "insane"): number {
    return enumerateEntityVariants(entityId, difficulty).length;
  }

  return {
    enumerateEntityVariants,
    enumerateEntityDataVariants,
    countEntityVariants,
    countEntityDataVariants,
  };
}

export const { countEntityVariants, enumerateEntityVariants } = createVariantCounter();
