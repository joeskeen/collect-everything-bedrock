import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import { CustomCommandResult } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, ENTITY } from "../collection-constants";
import { countCollectedBiomes } from "../../data/biomes";
import { capitalCase } from "change-case";
import { percent } from "../../shared/formatting";
import { GOLD, GRAY } from "../../shared/format-codes";
import { countCollectedEntities } from "../../data/entities";

@scoped(Lifecycle.ContainerScoped)
export class PlayerStatsCommand implements CommandHandler {
  constructor(@inject(PlayerCollection) private readonly collection: PlayerCollection) {}

  handleCommand(event: any): CustomCommandResult {
    const collection = this.collection.getCollection();
    const collectionProgress = [
      { category: BIOME, ...countCollectedBiomes([...collection[BIOME].keys()]) },
      { category: ENTITY, ...countCollectedEntities([...collection[ENTITY].keys()]) },
    ];
    const totalProgress = {
      collected: collectionProgress.reduce((prev, curr) => prev + curr.collected, 0),
      total: collectionProgress.reduce((prev, curr) => prev + curr.total, 0),
    };
    const messageLines = [
      `${GOLD}=== Collection Stats ===${GRAY}`,
      collectionProgress
        .map(
          (c) =>
            `${capitalCase(c.category)}: ${c.collected}/${c.total || "?"} (${percent(c.collected, c.total)}) ${c.extra ? "+" + c.extra : ""}`
        )
        .join("\n"),
      `${GOLD}Total: ${totalProgress.collected}/${totalProgress.total} (${percent(totalProgress.collected, totalProgress.total)})`,
    ];
    return { message: messageLines.join("\n"), status: customCommandStatuses.Success };
  }
}

export const playerStatsCommand = addOnCommand({
  name: "stats",
  description: "show collection statistics",
  handlerClass: PlayerStatsCommand,
});
