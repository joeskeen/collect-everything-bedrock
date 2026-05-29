export function formatItemId(itemId: string): string {
  const withoutPrefix = itemId.replace(/^item:/, "");
  const parts = withoutPrefix.split(":");

  const itemName = parts.length > 1 ? parts[1] : parts[0];
  const cleanItemName = itemName.replace(/^minecraft:/, "");

  if (parts.length > 1 && parts[0] === "minecraft" && (parts[1] === "potion" || parts[1] === "splash_potion")) {
    const effectPart = parts.slice(2).join(":").replace(/^minecraft:/, "");
    const effectName = effectPart.replace(/:(long|strong|weak)$/, "");
    const suffix = effectPart.match(/:(long|strong|weak)$/)?.[1];

    if (parts[1] === "potion") {
      let result = `Potion of ${toTitleCase(effectName.replace(/_/g, " "))}`;
      if (suffix) result += ` (${suffix})`;
      return result;
    }
    if (parts[1] === "splash_potion") {
      let result = `Splash Potion of ${toTitleCase(effectName.replace(/_/g, " "))}`;
      if (suffix) result += ` (${suffix})`;
      return result;
    }
  }

  return toTitleCase(cleanItemName.replace(/_/g, " "));
}

export function formatBiomeId(biomeId: string): string {
  const withoutPrefix = biomeId.replace(/^biome:/, "");
  const parts = withoutPrefix.split("+");
  const biomeName = parts[0].replace(/^minecraft:/, "");
  return toTitleCase(biomeName.replace(/_/g, " "));
}

export function formatEnchantmentId(enchantmentId: string): string {
  const withoutPrefix = enchantmentId.replace(/^enchantment:/, "");
  const parts = withoutPrefix.split(":");

  const hasNamespace = parts[0] === "minecraft";
  const name = hasNamespace ? parts[1] : parts[0];
  const level = hasNamespace ? parts[2] : parts[1];
  const cleanName = name?.replace(/^minecraft:/, "") ?? "";
  return level ? `${toTitleCase(cleanName.replace(/_/g, " "))} ${toRomanNumeral(parseInt(level))}` : toTitleCase(cleanName.replace(/_/g, " "));
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

function toRomanNumeral(num: number): string {
  if (num <= 0 || num > 30) return String(num);
  const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
    "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"];
  return romanNumerals[num] || String(num);
}

export function formatEffectId(effectId: string): string {
  const withoutPrefix = effectId.replace(/^effect:/, "");
  const parts = withoutPrefix.split(":");

  const hasNamespace = parts[0] === "minecraft";
  const name = hasNamespace ? parts[1] : parts[0];
  const amplifier = hasNamespace ? parts[2] : parts[1];
  const cleanName = name?.replace(/^minecraft:/, "") ?? "";
  return amplifier !== undefined ? `${toTitleCase(cleanName.replace(/_/g, " "))} ${toRomanNumeral(parseInt(amplifier) + 1)}` : toTitleCase(cleanName.replace(/_/g, " "));
}

export function formatEntityId(entityId: string): string {
  const withoutPrefix = entityId.replace(/^entity:/, "");
  const parts = withoutPrefix.split(":");

  const entityTypeId = parts.length > 1 && parts[0] === "minecraft" ? parts[1].replace(/^minecraft:/, "") : (parts[0]?.replace(/^minecraft:/, "") ?? "");

  let variant: number | undefined;
  let isBaby = false;
  let biome: string | undefined;
  let isWarm = false;
  let isCold = false;
  const extraParts: string[] = [];

  const startIndex = parts[0] === "minecraft" ? 2 : 1;
  for (let i = startIndex; i < parts.length; i++) {
    if (parts[i] === "variant" && i + 1 < parts.length) {
      variant = parseInt(parts[i + 1]);
      i++;
    } else if (parts[i] === "baby") {
      isBaby = true;
    } else if (parts[i] === "biome" && i + 1 < parts.length) {
      biome = parts[i + 1].replace(/^minecraft:/, "");
      i++;
    } else if (parts[i] === "warm") {
      isWarm = true;
    } else if (parts[i] === "cold") {
      isCold = true;
    } else {
      extraParts.push(parts[i]);
    }
  }

  let result = toTitleCase(entityTypeId.replace(/_/g, " "));

  if (isWarm) {
    result = `Warm ${result}`;
  } else if (isCold) {
    result = `Cold ${result}`;
  } else if (variant !== undefined) {
    result = `${result} Variant ${variant}`;
  }

  if (isBaby) {
    result = `Baby ${result}`;
  }

  if (biome && entityTypeId === "villager") {
    result += ` (${toTitleCase(biome.replace(/_/g, " "))})`;
  }

  if (extraParts.length > 0) {
    result += ` ${extraParts.join(" ").replace(/_/g, " ")}`;
  }

  return result;
}

export function formatCollectedId(collectedId: string): string {
  if (collectedId.startsWith("item:")) {
    return formatItemId(collectedId);
  }
  if (collectedId.startsWith("biome:")) {
    return formatBiomeId(collectedId);
  }
  if (collectedId.startsWith("enchantment:")) {
    return formatEnchantmentId(collectedId);
  }
  if (collectedId.startsWith("effect:")) {
    return formatEffectId(collectedId);
  }
  if (collectedId.startsWith("entity:")) {
    return formatEntityId(collectedId);
  }
  if (collectedId.startsWith("block:")) {
    return formatBlockId(collectedId);
  }
  return collectedId;
}

export function formatBlockId(blockId: string): string {
  const withoutPrefix = blockId.replace(/^block:/, "");
  const blockName = withoutPrefix.replace(/^minecraft:/, "");
  return toTitleCase(blockName.replace(/_/g, " "));
}