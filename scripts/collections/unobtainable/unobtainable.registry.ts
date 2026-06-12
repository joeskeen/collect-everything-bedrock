import { singleton } from "tsyringe";
import type { RawMessage } from "@minecraft/server";
import { formatId } from "../../shared/formatting";
import { UNOBTAINABLE_BUT_BREAKABLE } from "./unobtainables";

@singleton()
export class UnobtainableRegistry {
  private unobtainables: string[] = [];

  constructor() {
    this.unobtainables = [...UNOBTAINABLE_BUT_BREAKABLE];
  }

  formatUnobtainable(blockId: string): RawMessage {
    return { text: formatId(blockId) };
  }

  isUnobtainable(blockId: string): boolean {
    return this.unobtainables.includes(blockId);
  }

  findUnobtainablesByKeyword(word: string): string[] {
    return this.unobtainables.filter((id) => id.includes(word));
  }

  countCollectedUnobtainables(unobtainables: string[]) {
    const builtInCount = unobtainables.filter((u) => this.unobtainables.includes(u)).length;
    return { collected: builtInCount, extra: unobtainables.length - builtInCount, total: this.unobtainables.length };
  }

  allUnobtainables() {
    return [...this.unobtainables];
  }

  unobtainableCount() {
    return this.unobtainables.length;
  }
}
