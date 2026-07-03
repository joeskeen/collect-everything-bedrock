import type { World, Player } from "@minecraft/server";
import { displaySlotIds, objectiveSortOrders } from "../shared/enums";
import { inject, singleton } from "tsyringe";
import { WORLD_TOKEN } from "../shared/global-tokens";
import { NAMESPACE } from "../shared/constants";
import { Logger } from "../shared/logging/logger";
import { MINECOIN_GOLD, RESET } from "../shared/format-codes";
import { WorldSettingsService } from "../player/player-settings";

const objectiveId = NAMESPACE + "_objective";
const objectiveDisplayName = `${MINECOIN_GOLD}Collect Everything!${RESET}`;

@singleton()
export class CollectionScoreboard {
  constructor(
    @inject(WORLD_TOKEN) private world: World,
    @inject(Logger) private logger: Logger,
    @inject(WorldSettingsService) private readonly worldSettings: WorldSettingsService
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
    if (this.worldSettings.getDisplayScoreboard()) {
      this.world.scoreboard.setObjectiveAtDisplaySlot(displaySlotIds.Sidebar, {
        objective,
        sortOrder: objectiveSortOrders.Descending,
      });
    } else {
      this.world.scoreboard.clearObjectiveAtDisplaySlot(displaySlotIds.Sidebar);
    }
    this.checkForOfflinePlayers();
  }

  checkForOfflinePlayers() {
    let objective = this.world.scoreboard.getObjective(objectiveId);
    if (!objective) {
      return;
    }

    objective.getParticipants().forEach((p) => {
      try {
        var player = p.getEntity() as Player;
        if (!player) {
          objective.removeParticipant(p);
        }
      } catch {
        objective.removeParticipant(p);
      }
    });
  }

  syncDisplay() {
    const objective = this.world.scoreboard.getObjective(objectiveId);
    if (this.worldSettings.getDisplayScoreboard()) {
      if (objective) {
        this.world.scoreboard.setObjectiveAtDisplaySlot(displaySlotIds.Sidebar, {
          objective,
          sortOrder: objectiveSortOrders.Descending,
        });
      }
    } else {
      this.world.scoreboard.clearObjectiveAtDisplaySlot(displaySlotIds.Sidebar);
    }
  }

  reset() {
    let objective = this.world.scoreboard.getObjective(objectiveId);
    if (!objective) {
      objective = this.world.scoreboard.addObjective(objectiveId, objectiveDisplayName);
    }

    this.checkForOfflinePlayers();
  }
}
