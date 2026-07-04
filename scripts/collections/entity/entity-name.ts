import entities from "./entities";
import { capitalCase, formatId } from "../../shared/formatting";
import { getTropicalFishDisplayName } from "./tropicalfish-variants";

export function getEntityDisplayName(entityIdWithVariants: string): string {
  const [entityId, ...variantParts] = entityIdWithVariants.split("+");

  if (entityId === "minecraft:tropicalfish" && variantParts.length > 0) {
    const specialName = getTropicalFishDisplayName(variantParts);
    if (specialName !== undefined) return specialName;
  }
  const entityData = (entities as Record<string, { name?: string; variants?: Record<string, unknown> }>)[entityId];

  const baseName = entityData?.name ? capitalCase(entityData.name) : formatId(entityId);

  if (variantParts.length === 0) {
    return baseName;
  }

  const variants = new Map<string, string | undefined>();
  for (const part of variantParts) {
    if (part.includes(":")) {
      const [key, value] = part.split(":");
      variants.set(key, value);
    } else {
      variants.set(part, undefined);
    }
  }

  const matchedNames: string[] = [];

  for (let comboSize = variants.size; comboSize >= 2; comboSize--) {
    const remainingKeys = Array.from(variants.keys());
    for (const entityVariantKey of Object.keys(entityData?.variants ?? {})) {
      if (!entityVariantKey.includes(",")) continue;

      const entityKeys = entityVariantKey.split(",").map((k) => k.replace(/^c\./, "").replace(/^p\./, ""));
      if (entityKeys.length !== comboSize) continue;
      if (!entityKeys.every((ek) => remainingKeys.includes(ek))) continue;

      const valueCombo = entityKeys.map((ek) => variants.get(ek)!).join(",");
      const variantMap = entityData.variants![entityVariantKey] as Record<string, string>;
      if (variantMap[valueCombo]) {
        matchedNames.push(variantMap[valueCombo]);
        entityKeys.forEach((ek) => variants.delete(ek));
        break;
      }
    }
  }

  for (const [key, value] of Array.from(variants.entries())) {
    const displayName =
      value !== undefined ? getVariantDisplayName(entityId, `${key}:${value}`) : getVariantDisplayName(entityId, key);
    if (displayName !== undefined) {
      matchedNames.push(displayName);
    }
  }

  if (matchedNames.length === 0) {
    return baseName;
  }

  return `${baseName} (${matchedNames
    .map((n) => capitalCase(n))
    .sort()
    .join(", ")})`;
}

function getVariantDisplayName(entityId: string, variantPart: string): string | undefined {
  const entityData = (entities as Record<string, { variants?: Record<string, unknown> }>)[entityId];

  if (variantPart.includes(":")) {
    const [key, value] = variantPart.split(":");

    if (entityData?.variants) {
      const variantKey = `c.${key}`;
      const simpleMapping = entityData.variants[variantKey];
      if (simpleMapping && typeof simpleMapping === "object") {
        const result = (simpleMapping as Record<string, string>)[value];
        if (result) return result;
      }

      const propVariantKey = `p.${key}`;
      const propMapping = entityData.variants[propVariantKey];
      if (propMapping && typeof propMapping === "object") {
        const result = (propMapping as Record<string, string>)[value];
        if (result) return result;
      }
    }

    return `${capitalCase(key)} ${value}`;
  }

  if (entityData?.variants) {
    for (const [variantKey, variantValue] of Object.entries(entityData.variants)) {
      if (typeof variantValue === "string" && variantValue === variantPart) {
        return variantValue;
      }
    }
  }

  return undefined;
}
