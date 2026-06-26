import itemNumericalIds from "./item-numerical-ids";
import itemOverrides from "./item-overrides";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";

type ItemIdWithKnownNumericalId = keyof typeof itemNumericalIds;
type ItemIdWithOverride = keyof typeof itemOverrides;

const VANILLA_MAX_ID_WITHOUT_MODIFICATION = 255;

/**
 * translates an item id string to a renderable value
 * @param itemId the `minecraft:some_id` id string
 * @param enchanted whether the item should show as enchanted (only used with a resolved numeric ID)
 * @returns
 *   - the unknown texture value if the item id namespace is not 'minecraft:'
 *   - the texture path if there is a texture override defined for the item id
 *   - the internal runtime numeric ID
 */
export function getItemTexture(itemId: string, enchanted = false, customItemCount = NaN): string | number {
  const baseItemId = itemId.split("+")[0];
  if (!baseItemId.startsWith("minecraft:")) {
    return UNKNOWN_TEXTURE;
  }

  if (baseItemId in itemOverrides) {
    const overrideData = itemOverrides[baseItemId as ItemIdWithOverride];
    if (overrideData.texture) {
      return overrideData.texture;
    }
  }

  if (baseItemId in itemNumericalIds) {
    const id = itemNumericalIds[baseItemId as ItemIdWithKnownNumericalId];
    if (id > VANILLA_MAX_ID_WITHOUT_MODIFICATION && isNaN(customItemCount)) {
      throw new Error(
        `Cannot compute a runtime numeric ID for ${itemId}(${id}) without knowing how many custom items exist.`
      );
    }

    const encoded =
      (id +
        (id <= VANILLA_MAX_ID_WITHOUT_MODIFICATION ? 0 : customItemCount) +
        // these numbers were discovered by pure trial-and-error, and may change in future versions. Yuck.
        (id <= VANILLA_MAX_ID_WITHOUT_MODIFICATION ? 0 : id < 603 ? 29 : id < 715 ? 28 : id < 811 ? 25 : 17)) *
        65536 +
      (enchanted ? 32768 : 0);

    return encoded;
  }

  return UNKNOWN_TEXTURE;
}
