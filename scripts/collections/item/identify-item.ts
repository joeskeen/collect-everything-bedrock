import { ItemStack, ItemComponentTypes } from "@minecraft/server";
import itemsModule, { ItemData } from "./items";

export function IdentifyItem(itemStack: ItemStack, itemComponentTypes: typeof ItemComponentTypes): string[] {
  const result: string[] = [itemStack.typeId];

  const itemData = (itemsModule as Record<string, ItemData>)[itemStack.typeId];
  if (!itemData?.variants) return result;

  const activeVariants: string[] = [];

  for (const key of Object.keys(itemData.variants)) {
    if (key === "c.potion_liquid") {
      const potionComponent = itemStack.getComponent(itemComponentTypes.Potion);
      if (potionComponent) {
        activeVariants.push(potionComponent.potionDeliveryType.id);
      }
    } else if (key === "c.potion_effect") {
      const potionComponent = itemStack.getComponent(itemComponentTypes.Potion);
      if (potionComponent) {
        activeVariants.push(potionComponent.potionEffectType.id);
      }
    } else if (key.startsWith("l.")) {
      const variantKey = key.slice(2);
      if (variantKey === "color") {
        const color = /^item\.bed\.(.+)\.name$/.exec(itemStack.localizationKey)?.[1];
        if (color) activeVariants.push(color);
      }
    }
  }

  for (let i = 1; i <= activeVariants.length; i++) {
    const combos = getCombinations(activeVariants, i);
    for (const combo of combos) {
      result.push(`${itemStack.typeId}+${combo.sort().join("+")}`);
    }
  }

  return result;
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
