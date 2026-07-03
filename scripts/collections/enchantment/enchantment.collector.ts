import { inject, Lifecycle, scoped } from "tsyringe";
import { Runnable } from "../../shared/runnable";
import { Disposable } from "../../shared/disposable";
import {
  ITEM_COMPONENT_TYPES_TOKEN,
  ITEM_ENCHANTABLE_COMPONENT_TOKEN,
  PLAYER_TOKEN,
  WORLD_TOKEN,
} from "../../shared/global-tokens";
import type {
  PlayerInventoryItemChangeAfterEvent,
  Player,
  World,
  ItemStack,
  ItemComponentTypes,
  ItemEnchantableComponent,
} from "@minecraft/server";
import { COLLECTOR, Collector, ENCHANTMENT } from "../../player/collection-constants";
import { EnchantmentRegistry } from "./enchantment.registry";

@scoped(Lifecycle.ContainerScoped)
export class EnchantmentCollector implements Runnable, Disposable {
  private readonly boundCallback: (event: PlayerInventoryItemChangeAfterEvent) => void;
  private readonly unsubscribe: () => void;

  constructor(
    @inject(WORLD_TOKEN) private readonly world: World,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(COLLECTOR) private readonly collector: Collector,
    @inject(EnchantmentRegistry) private readonly enchantmentRegistry: EnchantmentRegistry,
    @inject(ITEM_COMPONENT_TYPES_TOKEN) private readonly itemComponentTypes: typeof ItemComponentTypes,
    @inject(ITEM_ENCHANTABLE_COMPONENT_TOKEN) private readonly itemEnchantableComponent: typeof ItemEnchantableComponent
  ) {
    this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
    this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
    this.unsubscribe = () => this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
  }

  run() {}

  dispose() {
    this.unsubscribe();
  }

  private readonly onPlayerInventoryItemChange = (event: PlayerInventoryItemChangeAfterEvent) => {
    if (event.player.id !== this.player.id) return;

    const newItem = event.itemStack;
    if (!newItem) return;

    const enchantments = this.enchantmentRegistry.identify(newItem.getComponent(this.itemComponentTypes.Enchantable));
    for (const enchantmentId of enchantments) {
      this.collector.collect(enchantmentId);
    }
  };
}
