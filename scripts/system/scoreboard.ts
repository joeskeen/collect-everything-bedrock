import type { World, Player } from "@minecraft/server";
import { displaySlotIds, objectiveSortOrders } from "../shared/enums";
import { inject, singleton } from "tsyringe";
import { WORLD_TOKEN } from "../shared/global-tokens";
import { NAMESPACE } from "../shared/constants";
import { Logger } from "../shared/logging/logger";
import { MINECOIN_GOLD, RESET } from "../shared/format-codes";

const objectiveId = NAMESPACE + "_objective";
const objectiveDisplayName = `${MINECOIN_GOLD}Collect Everything!${RESET}`;

@singleton()
export class CollectionScoreboard {
  constructor(
    @inject(WORLD_TOKEN) private world: World,
    @inject(Logger) private logger: Logger
  ) {}

  update(player: Player, score: number) {
    let objective = this.world.scoreboard.getObjective(objectiveId);
    if (!objective) {
      objective = this.world.scoreboard.addObjective(objectiveId, objectiveDisplayName);
    }

    if (!player.scoreboardIdentity) {
      objective.setScore(player, 0);
    }

    const scoreboardIdentity = player.scoreboardIdentity;
    if (!scoreboardIdentity) {
      this.logger.warn(`couldn't find/initialize scoreboard identity for player ${player.name}`);
      return;
    }

    objective.setScore(scoreboardIdentity, score);
    this.world.scoreboard.setObjectiveAtDisplaySlot(displaySlotIds.Sidebar, {
      objective,
      sortOrder: objectiveSortOrders.Descending,
    });
  }

  reset() {
    let objective = this.world.scoreboard.getObjective(objectiveId);
    if (!objective) {
      objective = this.world.scoreboard.addObjective(objectiveId, objectiveDisplayName);
    }

    const participants = objective.getParticipants();
    participants.forEach((p) => {
      if (this.world.getPlayers({ name: p.displayName }).length) {
        objective.setScore(p, 0);
      } else {
        objective.removeParticipant(p);
      }
    });
  }
}
