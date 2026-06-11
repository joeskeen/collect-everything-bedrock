export function formatItemId(itemId) {
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
            if (suffix)
                result += ` (${suffix})`;
            return result;
        }
        if (parts[1] === "splash_potion") {
            let result = `Splash Potion of ${toTitleCase(effectName.replace(/_/g, " "))}`;
            if (suffix)
                result += ` (${suffix})`;
            return result;
        }
    }
    return toTitleCase(cleanItemName.replace(/_/g, " "));
}
export function formatBiomeId(biomeId) {
    const withoutPrefix = biomeId.replace(/^biome:/, "");
    const parts = withoutPrefix.split("+");
    const biomeName = parts[0].replace(/^minecraft:/, "");
    return toTitleCase(biomeName.replace(/_/g, " "));
}
export function formatEnchantmentId(enchantmentId) {
    const withoutPrefix = enchantmentId.replace(/^enchantment:/, "");
    const parts = withoutPrefix.split(":");
    const hasNamespace = parts[0] === "minecraft";
    const name = hasNamespace ? parts[1] : parts[0];
    const level = hasNamespace ? parts[2] : parts[1];
    const cleanName = name?.replace(/^minecraft:/, "") ?? "";
    return level ? `${toTitleCase(cleanName.replace(/_/g, " "))} ${toRomanNumeral(parseInt(level))}` : toTitleCase(cleanName.replace(/_/g, " "));
}
function toTitleCase(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
function toRomanNumeral(num) {
    if (num <= 0 || num > 30)
        return String(num);
    const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
        "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
        "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"];
    return romanNumerals[num] || String(num);
}
export function formatEffectId(effectId) {
    const withoutPrefix = effectId.replace(/^effect:/, "");
    const parts = withoutPrefix.split(":");
    const hasNamespace = parts[0] === "minecraft";
    const name = hasNamespace ? parts[1] : parts[0];
    const amplifier = hasNamespace ? parts[2] : parts[1];
    const cleanName = name?.replace(/^minecraft:/, "") ?? "";
    return amplifier !== undefined ? `${toTitleCase(cleanName.replace(/_/g, " "))} ${toRomanNumeral(parseInt(amplifier) + 1)}` : toTitleCase(cleanName.replace(/_/g, " "));
}
export function formatEntityId(entityId) {
    const withoutPrefix = entityId.replace(/^entity:/, "");
    const parts = withoutPrefix.split(":");
    const entityTypeId = parts.length > 1 && parts[0] === "minecraft" ? parts[1].replace(/^minecraft:/, "") : (parts[0]?.replace(/^minecraft:/, "") ?? "");
    let variant;
    let isBaby = false;
    let biome;
    let isWarm = false;
    let isCold = false;
    let color;
    let color2;
    const extraParts = [];
    const startIndex = parts[0] === "minecraft" ? 2 : 1;
    for (let i = startIndex; i < parts.length; i++) {
        if (parts[i] === "variant" && i + 1 < parts.length) {
            variant = parseInt(parts[i + 1]);
            i++;
        }
        else if (parts[i] === "baby") {
            isBaby = true;
        }
        else if (parts[i] === "biome" && i + 1 < parts.length) {
            biome = parts[i + 1].replace(/^minecraft:/, "");
            i++;
        }
        else if (parts[i] === "warm") {
            isWarm = true;
        }
        else if (parts[i] === "cold") {
            isCold = true;
        }
        else if (parts[i] === "color" && i + 1 < parts.length) {
            color = parseInt(parts[i + 1]);
            i++;
        }
        else if (parts[i] === "color2" && i + 1 < parts.length) {
            color2 = parseInt(parts[i + 1]);
            i++;
        }
        else {
            extraParts.push(parts[i]);
        }
    }
    let result = toTitleCase(entityTypeId.replace(/_/g, " "));
    if (isWarm) {
        result = `Warm ${result}`;
    }
    else if (isCold) {
        result = `Cold ${result}`;
    }
    else if (variant !== undefined) {
        result = `${result} Variant ${variant}`;
    }
    if (color !== undefined) {
        result = `${result} ${toColorName(color)}`;
    }
    if (color2 !== undefined) {
        result = `${result}/${toColorName(color2)}`;
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
const PALETTE_COLORS = [
    "White", "Orange", "Magenta", "Light Blue", "Yellow", "Lime", "Pink", "Gray",
    "Silver", "Cyan", "Purple", "Blue", "Brown", "Green", "Red", "Black"
];
function toColorName(colorIndex) {
    if (colorIndex >= 0 && colorIndex < PALETTE_COLORS.length) {
        return PALETTE_COLORS[colorIndex];
    }
    return `Color ${colorIndex}`;
}
export function formatCollectedId(collectedId) {
    if (collectedId.startsWith("item:")) {
        return `Item: ${formatItemId(collectedId)}`;
    }
    if (collectedId.startsWith("biome:")) {
        return `Biome: ${formatBiomeId(collectedId)}`;
    }
    if (collectedId.startsWith("enchantment:")) {
        return `Enchantment: ${formatEnchantmentId(collectedId)}`;
    }
    if (collectedId.startsWith("effect:")) {
        return `Effect: ${formatEffectId(collectedId)}`;
    }
    if (collectedId.startsWith("entity:")) {
        return `Entity: ${formatEntityId(collectedId)}`;
    }
    if (collectedId.startsWith("block:")) {
        return `Block: ${formatBlockId(collectedId)}`;
    }
    return collectedId;
}
export function formatBlockId(blockId) {
    const withoutPrefix = blockId.replace(/^block:/, "");
    const blockName = withoutPrefix.replace(/^minecraft:/, "");
    return toTitleCase(blockName.replace(/_/g, " "));
}
