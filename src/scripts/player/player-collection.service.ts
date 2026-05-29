import { DiContainer } from "../shared/di.js";
import { Logger } from "../shared/logging.js";
import { PlayerStorageService } from "./player-storage.service.js";
import { Player, System, World, EntityInventoryComponent, EquipmentSlot } from "@minecraft/server";
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
  private readonly logger: Logger;
  private readonly playerStorageService: PlayerStorageService;
  private readonly playerNotifierService: PlayerNotifierService;
  private readonly player: Player;
  private readonly system: System;

  private collection = new Map<string, boolean>();

  constructor(private readonly di: DiContainer) {
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

  onCollect(what: string) {
    if (this.collection.get(what)) return;

    this.logger.debug(`Collecting ${what}`);
    this.collection.set(what, true);
    const displayName = formatCollectedId(what);
    this.playerNotifierService.toast(`§6:solid_star: Collected: ${displayName}`);
    this.save();
  }

  load() {
    const collected = this.playerStorageService.get<string[]>(COLLECTION_KEY) ?? [];
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

  private rescanCurrentState() {
    this.collectCurrentBiome();
    this.collectCurrentInventory();
  }

  private collectCurrentBiome() {
    const dimension = this.player.dimension;
    const currentBiome = dimension.getBiome(this.player.location);
    if (currentBiome) {
      this.onCollect(`biome:${currentBiome.id}`);
    }
  }

  private collectCurrentInventory() {
    try {
      const inventory = this.player.getComponent("minecraft:inventory") as EntityInventoryComponent;
      if (!inventory) return;

      const container = inventory.container;
      for (let i = 0; i < container.size; i++) {
        const item = container.getSlot(i);
        if (item && item.typeId) {
          this.onCollect(`item:${item.typeId}`);
        }
      }
    } catch {
      this.logger.warn("Failed to scan inventory on reset");
    }
  }

  private save() {
    const collected = [...this.collection.entries()].filter(([_, collected]) => collected).map(([what]) => what);
    this.logger.debug(`Saving collection: [${collected.join(", ")}]`);
    this.playerStorageService.set(COLLECTION_KEY, collected);
  }
}