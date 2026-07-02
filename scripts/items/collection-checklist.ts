import { inject, singleton } from "tsyringe";
import { BrowserModal } from "../player/modals/browser.modal";
import { WORLD_TOKEN } from "../shared/global-tokens";
import type { ItemUseAfterEvent, World } from "@minecraft/server";
import { PlayerManager } from "../system/player-manager";
import { Logger } from "../shared/logging/logger";

@singleton()
export class CollectionChecklistItemDefinition {
  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PlayerManager) private readonly playerManager: PlayerManager
  ) {}

  init() {
    this.world.afterEvents.itemUse.subscribe((e) => {
      if (e.itemStack.typeId === "collecteverything:checklist") {
        this.onUse(e);
      }
    });
  }

  onUse(e: ItemUseAfterEvent) {
    const player = e.source;
    const playerContainer = this.playerManager.getPlayerContainer(player.name);
    if (!playerContainer) {
      this.logger.warn(`Player container not found for ${player.name}`);
      return;
    }
    const browserModal = playerContainer.resolve(BrowserModal);
    browserModal.show();
  }
}
