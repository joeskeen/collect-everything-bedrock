import {
  Player,
  PlayerInventoryItemChangeAfterEvent,
  World,
  ItemStack,
  ItemComponentTypes,
} from "@minecraft/server";
import { DiContainer } from "../../shared/di.js";
import { Logger } from "../../shared/logging.js";
import { CollectFn } from "./collect.js";

export class ItemCollector {
  private readonly logger: Logger;
  private readonly world: World;
  private readonly player: Player;
  private readonly boundCallback: (event: PlayerInventoryItemChangeAfterEvent) => void;

  constructor(di: DiContainer, private readonly collect: CollectFn) {
    this.logger = di.get(Logger);
    this.world = di.get<World>(World);
    this.player = di.get(Player);

    this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
    this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
  }

  private getItemId(itemStack: ItemStack): string {
    let itemId = itemStack.typeId;

    if (itemStack.hasComponent(ItemComponentTypes.Potion)) {
      try {
        const potionComponent = itemStack.getComponent(ItemComponentTypes.Potion);
        if (potionComponent && potionComponent.potionEffectType) {
          itemId = `${itemId}:${potionComponent.potionEffectType.id}`;
        }
      } catch {
      }
    }

    return itemId;
  }

  onPlayerInventoryItemChange(event: PlayerInventoryItemChangeAfterEvent) {
    if (event.player.id !== this.player.id) return;

    const newItem = event.itemStack;
    const previousItem = event.beforeItemStack;

    if (newItem && !previousItem) {
      const itemId = this.getItemId(newItem);
      this.logger.debug(`Collected new item: ${itemId}`);
      this.collect(`item:${itemId}`);
    } else if (newItem && previousItem && newItem.typeId !== previousItem.typeId) {
      const itemId = this.getItemId(newItem);
      this.logger.debug(`Collected crafted/replaced item: ${itemId}`);
      this.collect(`item:${itemId}`);
    }
  }

  dispose() {
    this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
  }
}
