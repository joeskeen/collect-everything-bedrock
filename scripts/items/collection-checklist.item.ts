import { inject, singleton } from "tsyringe";
import { BrowserModal } from "../player/modals/collection-browser/browser.modal";
import { WORLD_TOKEN } from "../shared/global-tokens";
import type {
  World,
  BlockCustomComponent,
  BlockComponentPlayerInteractEvent,
  StartupEvent,
  Player,
} from "@minecraft/server";
import { PlayerManager } from "../system/player-manager";
import { Logger } from "../shared/logging/logger";

@singleton()
export class CollectionChecklistItem implements BlockCustomComponent {
  constructor(
    @inject(Logger) private readonly logger: Logger,
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PlayerManager) private readonly playerManager: PlayerManager
  ) {}

  onStartUp(startupEvent: StartupEvent) {
    this.world.afterEvents.itemUse.subscribe((e) => {
      if (e.itemStack.typeId === "collecteverything:checklist") {
        this.onUse(e.source);
      }
    });
    startupEvent.blockComponentRegistry.registerCustomComponent("collecteverything:checklist_interact", {
      onPlayerInteract: this.onPlayerInteract.bind(this),
    });
  }

  onUse(player: Player) {
    const playerContainer = this.playerManager.getPlayerContainer(player.name);
    if (!playerContainer) {
      this.logger.warn(`Player container not found for ${player.name}`);
      return;
    }
    const browserModal = playerContainer.resolve(BrowserModal);
    player.playSound("block.click");
    browserModal.show();
  }

  onPlayerInteract(event: BlockComponentPlayerInteractEvent): void {
    const player = event.player;
    if (!player) {
      return;
    }
    this.onUse(player);
  }
}
