import {
  Player,
  PlayerInventoryItemChangeAfterEvent,
  World,
  ItemStack,
  ItemComponentTypes,
  ItemEnchantableComponent,
} from "@minecraft/server";
import { DiContainer } from "../../shared/di.js";
import { CollectFn } from "./collect.js";

export class EnchantmentCollector {
  private readonly world: World;
  private readonly player: Player;
  private readonly boundCallback: (event: PlayerInventoryItemChangeAfterEvent) => void;
  private readonly unsubscribe: () => void;

  constructor(di: DiContainer, private readonly collect: CollectFn) {
    this.world = di.get<World>(World);
    this.player = di.get(Player);

    this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
    this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
    this.unsubscribe = () => this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
  }

  private getEnchantments(itemStack: ItemStack): string[] {
    try {
      const enchantComponent = itemStack.getComponent(ItemComponentTypes.Enchantable) as ItemEnchantableComponent | undefined;
      if (!enchantComponent) return [];

      const enchantments = enchantComponent.getEnchantments();
      return enchantments.map((e) => `${e.type.id}:${e.level}`);
    } catch {
      return [];
    }
  }

  onPlayerInventoryItemChange(event: PlayerInventoryItemChangeAfterEvent) {
    if (event.player.id !== this.player.id) return;

    const newItem = event.itemStack;
    if (!newItem) return;

    const enchantments = this.getEnchantments(newItem);
    for (const enchantmentId of enchantments) {
      this.collect(`enchantment:${enchantmentId}`);
    }
  }

  dispose() {
    this.unsubscribe();
  }
}