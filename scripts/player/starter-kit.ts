import type { ItemStack, Player } from "@minecraft/server";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ITEM_STACK_TOKEN, PLAYER_TOKEN } from "../shared/global-tokens";
import { Logger } from "../shared/logging/logger";
import { PlayerStorage } from "../shared/storage";
import { NAMESPACE } from "../shared/constants";
import { BLUE, BOLD, GRAY, ITALIC, RESET } from "../shared/format-codes";
import { CRAFTING_TABLE } from "../shared/emoji";

const STORAGE_KEY = NAMESPACE + ":starter_kit_given";

@scoped(Lifecycle.ContainerScoped)
export class StarterKitService {
  constructor(
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerStorage) private readonly playerStorage: PlayerStorage,
    @inject(ITEM_STACK_TOKEN) private readonly itemStack: typeof ItemStack,
    @inject(Logger) private readonly logger: Logger
  ) {}

  run() {
    if (this.playerStorage.get<boolean>(STORAGE_KEY)) {
      return;
    }

    const inventory = this.player.getComponent("inventory") as
      | { container: { addItem: (item: ItemStack) => ItemStack | undefined } }
      | undefined;
    if (!inventory?.container) {
      this.logger.warn(`Cannot give starter kit to ${this.player.name}: no inventory`);
      return;
    }

    const item = new this.itemStack("collecteverything:checklist", 1);
    const leftover = inventory.container.addItem(item);

    if (leftover) {
      this.player.dimension.spawnItem(leftover, this.player.location);
    }

    this.playerStorage.set(STORAGE_KEY, true);

    this.player.sendMessage(
      `${GRAY}${ITALIC}[${CRAFTING_TABLE}${RESET}${GRAY}${ITALIC}] You received a ${BOLD}${BLUE}Collection Checklist${RESET}${GRAY}${ITALIC}! Use it, place it, or type ${BOLD}/browse${RESET}${GRAY}${ITALIC} to open your collection browser.${RESET}`
    );
    this.logger.log(`Starter kit given to ${this.player.name}`);
  }
}
