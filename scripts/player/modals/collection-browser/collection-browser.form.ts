import type { Player } from "@minecraft/server";
import type { CreateActionFormFn } from "../../../shared/global-tokens";
import { DataSchema, encodeItemData } from "../../../ui/data-encoder";
import { DIFFICULTY_INDEX_MAP } from "../../player-settings";
import { RESET } from "../../../shared/format-codes";
import type { ActionFormResponse } from "@minecraft/server-ui";
import type { Logger } from "../../../shared/logging/logger";

// any time these schemas change, we need to also change the form
// use this tool to help:
// https://joe.skeen.rocks/bedrock-json-ui-data-helper/
import FORM_DATA_SCHEMA from "./form-data.schema.json";
import BUTTON_DATA_SCHEMA from "./button-data.schema.json";

export interface CollectionFormResponse extends ActionFormResponse {
  selectedButtonValue?: unknown;
}
export type ButtonData = [text: string, texture: number | string | undefined, value: unknown];

export class CollectionBrowserFormData {
  private titleText: string = RESET;
  private activeIndex: number = 0;
  private itemCount: number = 0;
  private difficulty: number = 0;
  private pageNumber: number = 0;
  private totalPages: number = 0;
  private hasPrevious: boolean = false;
  private hasNext: boolean = false;
  private buttonArray: ButtonData[] = [];

  constructor(
    private readonly createActionForm: CreateActionFormFn,
    private readonly logger?: Logger
  ) {}

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

  difficultyLevel(level: "basic" | "committed" | "insane"): this {
    this.difficulty = DIFFICULTY_INDEX_MAP[level] ?? 0;
    return this;
  }

  pagination(pageNumber: number, totalPages: number, hasPrevious: boolean, hasNext: boolean): this {
    this.pageNumber = pageNumber;
    this.totalPages = totalPages;
    this.hasPrevious = hasPrevious;
    this.hasNext = hasNext;
    return this;
  }

  button(
    itemName: string,
    itemDesc: string[] | undefined,
    texture: string | number,
    count = 1,
    percent = 0,
    buttonValue: unknown = undefined
  ): this {
    const header = encodeItemData({ count, percent }, BUTTON_DATA_SCHEMA);
    let buttonText = `${header}${itemName}${RESET}`;
    if (Array.isArray(itemDesc) && itemDesc.length > 0) {
      buttonText += "\n" + itemDesc.join("\n");
    }
    const encodedTexture = texture;
    this.buttonArray.push([buttonText, encodedTexture, buttonValue]);
    return this;
  }

  async show(player: Player): Promise<CollectionFormResponse> {
    const fullTitle =
      encodeItemData(
        {
          activeIndex: this.activeIndex,
          itemCount: this.itemCount,
          difficulty: this.difficulty,
          pageNumber: this.pageNumber + 1, // display pages starting with 1 not 0
          totalPages: this.totalPages,
          hasPrevious: this.hasPrevious ? 1 : 0,
          hasNext: this.hasNext ? 1 : 0,
        },
        FORM_DATA_SCHEMA
      ) + this.titleText;
    this.logger?.debug("titleData", fullTitle.replace(/§/g, "$"));
    const form = this.createActionForm().title(fullTitle);
    for (const button of this.buttonArray) {
      form.button(button[0], button[1]?.toString());
    }
    const response = await form.show(player);
    return {
      ...response,
      selectedButtonValue: typeof response.selection === "number" ? this.buttonArray[response.selection][2] : undefined,
    };
  }
}
