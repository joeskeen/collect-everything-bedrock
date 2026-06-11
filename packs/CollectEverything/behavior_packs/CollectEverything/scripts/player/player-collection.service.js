import { Logger } from "../shared/logging.js";
import { PlayerStorageService } from "./player-storage.service.js";
import { Player, System } from "@minecraft/server";
import { BiomeCollector } from "./collectors/biome.collector.js";
import { ItemCollector } from "./collectors/item.collector.js";
import { EnchantmentCollector } from "./collectors/enchantment.collector.js";
import { EffectCollector } from "./collectors/effect.collector.js";
import { EntityCollector } from "./collectors/entity.collector.js";
import { UnobtainableBlockCollector } from "./collectors/unobtainable-block.collector.js";
import { PlayerNotifierService } from "./player-notifier.service.js";
import { formatCollectedId } from "../shared/format-id.js";
const COLLECTION_KEY = "CollectEverything:Collection";
export class PlayerCollectionService {
    di;
    logger;
    playerStorageService;
    playerNotifierService;
    player;
    system;
    collection = new Map();
    constructor(di) {
        this.di = di;
        this.logger = di.get(Logger);
        this.playerStorageService = di.get(PlayerStorageService);
        this.playerNotifierService = di.get(PlayerNotifierService);
        this.player = di.get(Player);
        this.system = di.get(System);
        this.di.register(PlayerCollectionService, this);
        this.load();
        this.startCollectors();
    }
    startCollectors() {
        this.di.register(BiomeCollector, new BiomeCollector(this.di, this.onCollect.bind(this)));
        this.di.register(ItemCollector, new ItemCollector(this.di, this.onCollect.bind(this)));
        this.di.register(EnchantmentCollector, new EnchantmentCollector(this.di, this.onCollect.bind(this)));
        this.di.register(EffectCollector, new EffectCollector(this.di, this.onCollect.bind(this)));
        this.di.register(EntityCollector, new EntityCollector(this.di, this.onCollect.bind(this)));
        this.di.register(UnobtainableBlockCollector, new UnobtainableBlockCollector(this.di, this.onCollect.bind(this)));
    }
    onCollect(what) {
        if (this.collection.get(what))
            return;
        this.logger.debug(`Collecting ${what}`);
        this.collection.set(what, true);
        const displayName = formatCollectedId(what);
        this.playerNotifierService.toast(`§6:solid_star: Collected ${displayName}`);
        this.save();
    }
    load() {
        const collected = this.playerStorageService.get(COLLECTION_KEY) ?? [];
        this.logger.debug(`Loaded collection: [${collected.join(", ")}]`);
        this.collection = new Map(collected.map((what) => [what, true]));
    }
    getCollection() {
        return [...this.collection.entries()].filter(([_, collected]) => collected).map(([what]) => what);
    }
    getStats() {
        const collected = this.getCollection();
        const byType = {
            items: collected.filter((id) => id.startsWith("item:") || id.startsWith("block:")).length,
            entities: collected.filter((id) => id.startsWith("entity:")).length,
            biomes: collected.filter((id) => id.startsWith("biome:")).length,
            enchantments: collected.filter((id) => id.startsWith("enchantment:")).length,
            effects: collected.filter((id) => id.startsWith("effect:")).length,
            total: collected.length,
        };
        return byType;
    }
    reset() {
        this.collection.clear();
        this.save();
        this.system.runTimeout(() => {
            this.rescanCurrentState();
        }, 5);
    }
    rescanCurrentState() {
        this.collectCurrentBiome();
        this.collectCurrentInventory();
    }
    collectCurrentBiome() {
        const dimension = this.player.dimension;
        const currentBiome = dimension.getBiome(this.player.location);
        if (currentBiome) {
            this.onCollect(`biome:${currentBiome.id}`);
        }
    }
    collectCurrentInventory() {
        try {
            const inventory = this.player.getComponent("minecraft:inventory");
            if (!inventory)
                return;
            const container = inventory.container;
            for (let i = 0; i < container.size; i++) {
                const item = container.getSlot(i);
                if (item && item.typeId) {
                    this.onCollect(`item:${item.typeId}`);
                }
            }
        }
        catch {
            this.logger.warn("Failed to scan inventory on reset");
        }
    }
    save() {
        const collected = [...this.collection.entries()].filter(([_, collected]) => collected).map(([what]) => what);
        this.logger.debug(`Saving collection: [${collected.join(", ")}]`);
        this.playerStorageService.set(COLLECTION_KEY, collected);
    }
}
