import itemsModule, { ItemData } from "./items";

export interface ItemVariantCounter {
  enumerateItemVariants: (itemId: string) => string[];
  enumerateItemDataVariants: (itemData: ItemData) => string[];
  countItemVariants: (itemId: string) => number;
  countItemDataVariants: (itemData: ItemData) => number;
}

export function createItemVariantCounter(itemsOverride?: Record<string, ItemData>): ItemVariantCounter {
  const items = itemsOverride ?? (itemsModule as unknown as Record<string, ItemData>);

  function getVariantValues(itemData: ItemData): string[][] {
    if (!itemData.variants) return [];

    const allValues: string[][] = [];
    for (const key of Object.keys(itemData.variants)) {
      const value = itemData.variants[key];
      if (typeof value === "object" && value !== null) {
        allValues.push(Object.keys(value));
      }
    }
    return allValues;
  }

  function enumerateItemDataVariants(itemData: ItemData): string[] {
    const values = getVariantValues(itemData);
    if (values.length === 0) return [];

    function combine(index: number, current: string[]): string[] {
      if (index === values.length) {
        return current.length > 0 ? [current.sort().join("+")] : [];
      }

      const results: string[] = [];
      for (const val of values[index]) {
        results.push(...combine(index + 1, [...current, val]));
      }
      return results;
    }

    const combinations = combine(0, []);
    const individuals: string[] = [];
    for (const vals of values) {
      for (const val of vals) {
        if (!individuals.includes(val)) individuals.push(val);
      }
    }

    const result = new Set([...individuals, ...combinations]);
    return Array.from(result);
  }

  function enumerateItemVariants(itemId: string): string[] {
    const data = items[itemId];
    if (!data) return [itemId];
    const variants = enumerateItemDataVariants(data);
    return variants.length ? [itemId, ...variants.map((v) => `${itemId}+${v}`)] : [itemId];
  }

  function countItemVariants(itemId: string): number {
    return enumerateItemVariants(itemId).length;
  }

  function countItemDataVariants(itemData: ItemData): number {
    return enumerateItemDataVariants(itemData).length;
  }

  return {
    enumerateItemVariants,
    enumerateItemDataVariants,
    countItemVariants,
    countItemDataVariants,
  };
}

export const { enumerateItemVariants, countItemVariants } = createItemVariantCounter();
