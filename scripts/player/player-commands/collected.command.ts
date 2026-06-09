import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME } from "../collection-constants";
import { formatId } from "../../shared/formatting";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";

@scoped(Lifecycle.ContainerScoped)
export class PlayerCollectedCommand implements CommandHandler {
  constructor(@inject(PlayerCollection) private readonly collection: PlayerCollection) {}

  handleCommand(event: any): CustomCommandResult {
    const collection = this.collection.getCollection();
    const flattened = Object.entries(collection)
      .flatMap(([category, entries]: [string, Record<string, number>]) =>
        Object.keys(entries).map((what) => [category, what])
      )
      .sort((a, b) => a[1].localeCompare(b[1]));
    const messageLines = [
      `${GOLD}=== Collected ===${GRAY}`,
      flattened.map(([category, what]) => `${THEME[category]}${formatId(what)}${RESET}`).join(", "),
    ];
    return { message: messageLines.join("\n"), status: customCommandStatuses.Success };
  }
}

export const playerCollectedCommand = addOnCommand({
  name: "collected",
  description: "show what you have collected",
  handlerClass: PlayerCollectedCommand,
});
