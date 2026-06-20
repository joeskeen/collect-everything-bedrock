import type { Player } from "@minecraft/server";
import type {} from "@minecraft/server-ui";
import { typeIdToDataId, typeIdToID } from "./typeIds";
import type { CreateActionFormFn } from "./global-tokens";
import { RESET } from "./format-codes";

export const COLLECTION_FORM_KEY = "§c§o§l§l§e§c§t§i§o§n";
export const custom_content: Record<string, { texture: string; type: "item" | "block" }> = {};
export const custom_content_keys = new Set(Object.keys(custom_content));
export const number_of_custom_items = Object.values(custom_content).filter((v) => v.type === "item").length;

export function encodeTexture(typeId: string): string | number {
  const targetTexture = custom_content[typeId]?.texture ?? typeId;
  const id = typeIdToDataId.get(targetTexture) ?? typeIdToID.get(targetTexture);
  const encoded =
    id === undefined
      ? targetTexture
      : (id + (id < 256 ? 0 : id < 603 ? 29 : id < 715 ? 28 : id < 811 ? 25 : 17)) * 65536;
  return encoded;
}

export class CollectionFormData {
  #titleText: { rawtext: Array<{ text?: string; translate?: string }> };
  #buttonArray: Array<[{ rawtext: Array<{ text: string }> }, number | undefined]> = [];

  constructor(private readonly createActionForm: CreateActionFormFn) {
    this.#titleText = { rawtext: [{ text: COLLECTION_FORM_KEY }] };
  }

  title(text: string): this {
    this.#titleText.rawtext.push({ text: `${RESET}${text}` });
    return this;
  }

  button(
    itemName: string,
    itemDesc: string[] | undefined,
    texture: string,
    stackSize = 1,
    durability = 0,
    enchanted = false
  ): this {
    const stackStr = `stack#${String(Math.min(Math.max(stackSize, 1), 99)).padStart(2, "0")}`;
    const durStr = `dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, "0")}`;

    const buttonRawtext: { rawtext: Array<{ text: string }> } = {
      rawtext: [{ text: `${stackStr}${durStr}§r` }],
    };

    buttonRawtext.rawtext.push({ text: itemName ? `${itemName}§r` : "§r" });

    if (Array.isArray(itemDesc) && itemDesc.length > 0) {
      for (const obj of itemDesc) {
        buttonRawtext.rawtext.push({ text: `\n${obj}` });
      }
    }

    const encodedTexture = encodeTexture(texture);

    this.#buttonArray.push([buttonRawtext, encodedTexture as number]);
    return this;
  }

  async show(player: Player) {
    const form = this.createActionForm().title(this.#titleText);
    for (const button of this.#buttonArray) {
      form.button(button[0], button[1]?.toString());
    }
    return form.show(player);
  }
}
