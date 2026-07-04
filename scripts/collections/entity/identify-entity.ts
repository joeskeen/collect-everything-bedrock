import { Entity } from "@minecraft/server";
import entities from "./entities";

export function IdentifyEntity(entity: Entity): string[] {
  const typeId = entity.typeId;
  const entityData = (entities as Record<string, { variants?: Record<string, unknown> }>)[typeId];

  const result: string[] = [typeId];

  if (!entityData?.variants) {
    return result;
  }

  const activeVariants: string[] = [];

  for (const [key, value] of Object.entries(entityData.variants)) {
    if (key.includes(",")) {
      if (key.split(",").length <= 2) {
        const variantResults = evaluateCompoundVariant(entity, key, value);
        if (variantResults) {
          activeVariants.push(...variantResults);
        }
      }
    } else if (key.startsWith("c.")) {
      const componentName = key.slice(2);
      const variantResult = evaluateComponentVariant(entity, componentName, value);
      if (variantResult !== undefined) {
        activeVariants.push(variantResult);
      }
    } else if (key.startsWith("p.")) {
      const propertyName = key.slice(2);
      const variantResult = evaluatePropertyVariant(entity, propertyName, value);
      if (variantResult !== undefined) {
        activeVariants.push(variantResult);
      }
    }
  }

  for (let i = 1; i <= activeVariants.length; i++) {
    const combinations = getCombinations(activeVariants, i);
    for (const combo of combinations) {
      result.push(`${typeId}+${combo.sort().join("+")}`);
    }
  }

  return result;
}

function evaluateComponentVariant(entity: Entity, componentName: string, value: unknown): string | undefined {
  try {
    const component = entity.getComponent(`minecraft:${componentName}`);

    if (typeof value === "string") {
      if (component) {
        return value;
      }
      return undefined;
    }

    if (typeof value === "object" && value !== null) {
      const lookup = value as Record<string, string>;

      if (component) {
        const componentValue = (component as unknown as { value?: unknown }).value ?? component;
        const key = String(componentValue);
        return `${componentName}:${key}`;
      }

      if (lookup["undefined"] !== undefined) {
        return `${componentName}:0`;
      }

      return undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function evaluatePropertyVariant(entity: Entity, propertyName: string, value: unknown): string | undefined {
  try {
    if (typeof value !== "object" || value === null) return undefined;

    const property = entity.getProperty(`minecraft:${propertyName}`);
    if (property === undefined) return undefined;

    const key = String(property);
    return `${propertyName}:${key}`;
  } catch {
    return undefined;
  }
}

function evaluateCompoundVariant(entity: Entity, key: string, value: unknown): string[] | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const componentNames = key.split(",");
  const keys: string[] = [];
  const parts: string[] = [];

  for (const compName of componentNames) {
    try {
      if (compName.startsWith("c.")) {
        const componentName = compName.slice(2);
        const component = entity.getComponent(`minecraft:${componentName}`);
        if (!component) return undefined;
        const componentValue = (component as unknown as { value?: unknown }).value ?? component;
        keys.push(String(componentValue));
        parts.push(`${componentName}:${componentValue}`);
      } else if (compName.startsWith("p.")) {
        const propName = compName.slice(2);
        const propValue = entity.getProperty(`minecraft:${propName}`);
        if (propValue === undefined) return undefined;
        keys.push(String(propValue));
        parts.push(`${propName}:${propValue}`);
      }
    } catch {
      return undefined;
    }
  }

  const lookupKey = keys.join(",");
  const lookup = value as Record<string, string>;
  if (!lookup[lookupKey]) return undefined;

  return parts;
}

function getCombinations(arr: string[], size: number): string[][] {
  if (size === 1) return arr.map((item) => [item]);
  if (size >= arr.length) return [arr];

  const results: string[][] = [];
  for (let i = 0; i <= arr.length - size; i++) {
    const first = arr[i];
    const restCombos = getCombinations(arr.slice(i + 1), size - 1);
    for (const combo of restCombos) {
      results.push([first, ...combo]);
    }
  }
  return results;
}
