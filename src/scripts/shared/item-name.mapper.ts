import { ItemStack, ItemTypes } from "@minecraft/server";

export class ItemNameMapper {
  formatName(itemStack: ItemStack): string {
    const key = itemStack.localizationKey;
    if (key && key.startsWith("item.") && key.endsWith(".name")) {
      const truncated = key.substring(5, key.length - 5);
      return truncated.replace(/_/g, " ").replace(/\./g, " ");
    }

    if (key) {
      const truncated = key.replace(/^.*\./, "");
      return truncated.replace(/_/g, " ");
    }

    const typeId = itemStack.typeId;
    const withoutNamespace = typeId.replace(/^.*:/, "");
    return withoutNamespace.replace(/_/g, " ");
  }
}