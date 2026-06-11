import { Player, World, ItemComponentTypes, } from "@minecraft/server";
export class EnchantmentCollector {
    collect;
    world;
    player;
    boundCallback;
    unsubscribe;
    constructor(di, collect) {
        this.collect = collect;
        this.world = di.get(World);
        this.player = di.get(Player);
        this.boundCallback = this.onPlayerInventoryItemChange.bind(this);
        this.world.afterEvents.playerInventoryItemChange.subscribe(this.boundCallback);
        this.unsubscribe = () => this.world.afterEvents.playerInventoryItemChange.unsubscribe(this.boundCallback);
    }
    getEnchantments(itemStack) {
        try {
            const enchantComponent = itemStack.getComponent(ItemComponentTypes.Enchantable);
            if (!enchantComponent)
                return [];
            const enchantments = enchantComponent.getEnchantments();
            return enchantments.map((e) => `${e.type.id}:${e.level}`);
        }
        catch {
            return [];
        }
    }
    onPlayerInventoryItemChange(event) {
        if (event.player.id !== this.player.id)
            return;
        const newItem = event.itemStack;
        if (!newItem)
            return;
        const enchantments = this.getEnchantments(newItem);
        for (const enchantmentId of enchantments) {
            this.collect(`enchantment:${enchantmentId}`);
        }
    }
    dispose() {
        this.unsubscribe();
    }
}
