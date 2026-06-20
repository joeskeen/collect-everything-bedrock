import itemIds from "../data/_generated-internalIds.json";

function createTypeIdMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const [name, id] of Object.entries(itemIds)) {
    map.set(name, id as number);
  }
  return map;
}

export const typeIdToID = createTypeIdMap();

export const typeIdToDataId = new Map<string, number>();
