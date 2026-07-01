import type { Player, RawMessage } from "@minecraft/server";
import type { CreateActionFormFn } from "../shared/global-tokens";
import { DataSchema, encodeItemData } from "./data-encoder";
import { RESET } from "../shared/format-codes";
import type { ActionFormResponse } from "@minecraft/server-ui";

export const COLLECTION_FORM_KEY = "__collection_form__";
export const formDataSchema: DataSchema = {
  _prefix: COLLECTION_FORM_KEY,
  activeIndex: { digits: 2, default: 0 },
  itemCount: { digits: 5, default: 0 },
};
export const formButtonDataSchema: DataSchema = {
  count: { digits: 2, default: 0 },
  percent: { digits: 3, default: 0 },
};
export interface CollectionFormResponse extends ActionFormResponse {
  selectedButtonValue?: unknown;
}
export type ButtonData = [text: RawMessage, texture: number | string | undefined, value: unknown];

export class CollectionFormData {
  private titleText: string = RESET;
  private activeIndex: number = 0;
  private itemCount: number = 0;
  private buttonArray: ButtonData[] = [];

  constructor(private readonly createActionForm: CreateActionFormFn) {}

  title(text: string): this {
    this.titleText = text;
    return this;
  }

  activeTab(index: number): this {
    this.activeIndex = index;
    return this;
  }

  itemsCount(count: number): this {
    this.itemCount = count;
    return this;
  }

  button(
    itemName: RawMessage,
    itemDesc: RawMessage[] | undefined,
    texture: string | number,
    count = 1,
    percent = 0,
    buttonValue: unknown = undefined
  ): this {
    const header = encodeItemData({ count, percent }, formButtonDataSchema);

    const buttonRawtext = {
      rawtext: [{ text: header }, itemName, { text: RESET }],
    };

    if (Array.isArray(itemDesc) && itemDesc.length > 0) {
      for (const obj of itemDesc) {
        buttonRawtext.rawtext.push({ text: "\n" });
        buttonRawtext.rawtext.push(obj);
      }
    }

    const encodedTexture = texture;

    this.buttonArray.push([buttonRawtext, encodedTexture, buttonValue]);
    return this;
  }

  async show(player: Player): Promise<CollectionFormResponse> {
    const fullTitle =
      encodeItemData({ activeIndex: this.activeIndex, itemCount: this.itemCount }, formDataSchema) + this.titleText;
    console.log("titleData", fullTitle.replace(/§/g, "$"));
    const form = this.createActionForm().title(fullTitle);
    for (const button of this.buttonArray) {
      form.button(button[0], button[1]?.toString());
    }
    const response = await form.show(player);
    return {
      ...response,
      selectedButtonValue: response.selection ? this.buttonArray[response.selection][2] : undefined,
    };
  }
}
