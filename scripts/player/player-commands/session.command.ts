import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult, Player, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME, UNOBTAINABLE } from "../collection-constants";
import { capitalCase } from "change-case";
import { formatId } from "../../shared/formatting";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { PLAYER_SESSION_TOKEN, PLAYER_TOKEN, PlayerSession, SYSTEM_TOKEN } from "../../shared/global-tokens";

@scoped(Lifecycle.ContainerScoped)
export class PlayerSessionCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(PLAYER_SESSION_TOKEN) private readonly playerSession: PlayerSession
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
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
        {
          category: ITEM,
          collected: Object.entries(collection[ITEM])
            .filter(([_what, when]) => when > this.playerSession.startTick)
            .map(([what]) => what),
        },
        {
          category: EFFECT,
          collected: Object.entries(collection[EFFECT])
            .filter(([_what, when]) => when > this.playerSession.startTick)
            .map(([what]) => what),
        },
        {
          category: ENCHANTMENT,
          collected: Object.entries(collection[ENCHANTMENT])
            .filter(([_what, when]) => when > this.playerSession.startTick)
            .map(([what]) => what),
        },
        {
          category: UNOBTAINABLE,
          collected: Object.entries(collection[UNOBTAINABLE])
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
        "\n",
      ];
      this.player.sendMessage(messageLines.join("\n"));
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerSessionCommand = addOnCommand({
  name: "session",
  description: "show what you have collected this session",
  handlerClass: PlayerSessionCommand,
});
