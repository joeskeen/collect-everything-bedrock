import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, ENTITY, THEME } from "../collection-constants";
import { capitalCase } from "change-case";
import { formatId } from "../../shared/formatting";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { PLAYER_SESSION_TOKEN, PlayerSession } from "../../shared/global-tokens";

@scoped(Lifecycle.ContainerScoped)
export class PlayerSessionCommand implements CommandHandler {
  constructor(
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(PLAYER_SESSION_TOKEN) private readonly playerSession: PlayerSession
  ) {}

  handleCommand(event: any): CustomCommandResult {
    const collection = this.collection.getCollection();
    const collectionProgress = [
      {
        category: BIOME,
        collected: Object.entries(collection[BIOME])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
      {
        category: ENTITY,
        collected: Object.entries(collection[ENTITY])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
    ];
    const totalCollected = {
      collected: collectionProgress.reduce((prev, curr) => prev + curr.collected.length, 0),
    };
    const messageLines = [
      `${GOLD}=== Collected this Session (${totalCollected.collected}) ===${GRAY}`,
      collectionProgress
        .map(
          (c) =>
            `${THEME[c.category]}${capitalCase(c.category)}${RESET} (${c.collected.length}): ${c.collected.map(formatId).join(", ")}`
        )
        .join("\n"),
    ];
    return { message: messageLines.join("\n"), status: customCommandStatuses.Success };
  }
}

export const playerSessionCommand = addOnCommand({
  name: "session",
  description: "show what you have collected this session",
  handlerClass: PlayerSessionCommand,
});
