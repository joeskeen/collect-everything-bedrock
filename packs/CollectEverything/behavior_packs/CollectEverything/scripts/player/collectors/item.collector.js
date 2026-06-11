import { Player, World, ItemComponentTypes, } from "@minecraft/server";
import { Logger } from "../../shared/logging.js";
export class ItemCollector {
    collect;
    logger;
    world;
    player;
    boundCallback;
    constructor(di, collect) {
        this.collect = collect;
        this.logger = di.get(Logger);
        this.world = di.get(World);
        this.player = di.get(Player);
        this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
        this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
    }
    getItemId(itemStack) {
        let itemId = itemStack.typeId;
        if (itemStack.hasComponent(ItemComponentTypes.Potion)) {
            try {
                const potionComponent = itemStack.getComponent(ItemComponentTypes.Potion);
                if (potionComponent && potionComponent.potionEffectType) {
                    itemId = `${itemId}:${potionComponent.potionEffectType.id}`;
                }
            }
            catch {
            }
        }
        return itemId;
    }
    onPlayerInventoryItemChange(event) {
        if (event.player.id !== this.player.id)
            return;
        const newItem = event.itemStack;
        const previousItem = event.beforeItemStack;
        if (newItem && !previousItem) {
            const itemId = this.getItemId(newItem);
            this.logger.debug(`Collected new item: ${itemId}`);
            this.collect(`item:${itemId}`);
        }
        else if (newItem && previousItem && newItem.typeId !== previousItem.typeId) {
            const itemId = this.getItemId(newItem);
            this.logger.debug(`Collected crafted/replaced item: ${itemId}`);
            this.collect(`item:${itemId}`);
        }
    }
    dispose() {
        this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
    }
}
