import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import { ITEM_COMPONENT_TYPES_TOKEN, PLAYER_TOKEN, WORLD_TOKEN } from "../../shared/global-tokens";
import type { PlayerInventoryItemChangeAfterEvent, Player, World } from "@minecraft/server";
import { COLLECTOR, Collector, ITEM } from "../../player/collection-constants";
import { ItemRegistry } from "./item.registry";

@scoped(Lifecycle.ContainerScoped)
export class ItemCollector implements Runnable, Disposable {
  private readonly boundCallback: (event: PlayerInventoryItemChangeAfterEvent) => void;

  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry
  ) {
    this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
  }

  run() {
    this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
  }

  dispose() {
    this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
  }

  private readonly onPlayerInventoryItemChange = (event: PlayerInventoryItemChangeAfterEvent) => {
    if (event.player.id !== this.player.id) return;

    const newItem = event.itemStack;
    const previousItem = event.beforeItemStack;

    if (newItem && newItem?.typeId !== previousItem?.typeId) {
      const ids = this.itemRegistry.identify(newItem);
      ids.forEach((id) => {
        this.collector.collect(id);
      });
    }
  };
}
