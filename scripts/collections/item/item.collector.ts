import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { ITEM_COMPONENT_TYPES_TOKEN, PLAYER_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import type {
  PlayerInventoryItemChangeAfterEvent,
  Player,
  World,
  ItemStack,
  ItemComponentTypes,
} from "@minecraft/server";
import { COLLECTOR, Collector, ITEM } from "../../player/collection-constants";
import { ItemRegistry } from "./item.registry";

@scoped(Lifecycle.ContainerScoped)
export class ItemCollector implements Runnable, Disposable {
  private readonly boundCallback: (event: PlayerInventoryItemChangeAfterEvent) => void;

  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry,
    @inject(ITEM_COMPONENT_TYPES_TOKEN) private readonly itemComponentTypes: typeof ItemComponentTypes
  ) {
    this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
  }

  run() {
    this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
  }

  dispose() {
    this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
  }

  private getItemId(itemStack: ItemStack): string {
    let itemId = itemStack.typeId;

    if (itemStack.hasComponent(this.itemComponentTypes.Potion)) {
      try {
        const potionComponent = itemStack.getComponent(this.itemComponentTypes.Potion);
        if (potionComponent && potionComponent.potionEffectType) {
          return `${itemId}_of_${potionComponent.potionEffectType.id.replace(/^minecraft:/, "")}`;
        }
      } catch {}
    }

    return itemId;
  }

  private readonly onPlayerInventoryItemChange = (event: PlayerInventoryItemChangeAfterEvent) => {
    if (event.player.id !== this.player.id) return;

    const newItem = event.itemStack;
    const previousItem = event.beforeItemStack;

    if (newItem && !previousItem) {
      const itemId = this.getItemId(newItem);
      this.collector.collect(ITEM, itemId, this.itemRegistry.formatItem(itemId));
    } else if (newItem && previousItem && newItem.typeId !== previousItem.typeId) {
      const itemId = this.getItemId(newItem);
      this.collector.collect(ITEM, itemId, this.itemRegistry.formatItem(itemId));
    }
  };
}
