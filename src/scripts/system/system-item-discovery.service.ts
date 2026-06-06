import { World, system, world, LootItem } from "@minecraft/server";
import { Logger } from "../shared/logging.js";
import { DiContainer } from "../shared/di.js";

interface ItemDiscoveredCallback {
  (itemId: string): void;
}

class SystemItemDiscoveryService {
  private readonly logger: Logger;
  private readonly discoveredItems = new Set<string>();
  private readonly onItemDiscoveredCallbacks: ItemDiscoveredCallback[] = [];
  private initialized = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  initialize(): void {
    if (this.initialized) {
      this.logger.debug("Item discovery already initialized");
      return;
    }

    this.logger.debug("Starting item discovery enumeration...");
    const startTime = Date.now();

    this.discoverLootTables();
    this.discoverRecipes();

    const elapsed = Date.now() - startTime;
    this.logger.debug(`Item discovery complete: ${this.discoveredItems.size} items in ${elapsed}ms`);
    this.initialized = true;
  }

  private discoverLootTables(): void {
    const lootTableManager = world.getLootTableManager();
    const knownLootTables = [
      "entities/sheep",
      "entities/cow",
      "entities/pig",
      "entities/chicken",
      "entities/rabbit",
      "entities/llama",
      "entities/wolf",
      "entities/villager",
      "entities/creeper",
      "entities/zombie",
      "entities/skeleton",
      "entities/spider",
      "entities/enderman",
      "entities/ghast",
      "entities/pufferfish",
      "entities/tropicalfish",
    ];

    const knownGenericTables = [
      "chests/spawn_bonus_chest",
      "chests/village_blacksmith",
      "chests/simple_dungeon",
      "chests/nether_bridge",
      "chests/end_city_treasure",
      "gameplay/fishing",
    ];

    const allTables = [...knownLootTables, ...knownGenericTables];
    let tableItemCount = 0;
    let usedTables = 0;

    for (const tableId of allTables) {
      try {
        const lootTable = lootTableManager.getLootTable(tableId);
        if (lootTable) {
          usedTables++;
          for (const pool of lootTable.pools) {
            for (const entry of pool.entries) {
              if (entry instanceof LootItem && entry.name) {
                const itemName = String(entry.name);
                if (!this.discoveredItems.has(itemName)) {
                  this.discoveredItems.add(itemName);
                  tableItemCount++;
                  this.notifyCallbacks(itemName);
                }
              }
            }
          }
        }
      } catch {
        // Loot table may not exist
      }
    }

    this.logger.debug(`Loot tables: ${usedTables}/${allTables.length} found, ${tableItemCount} new items`);
  }

  private discoverRecipes(): void {
    this.logger.debug("Recipe enumeration not available in Bedrock Script API - using curated fallback");
  }

  onItemDiscovered(callback: ItemDiscoveredCallback): () => void {
    this.onItemDiscoveredCallbacks.push(callback);
    return () => {
      const index = this.onItemDiscoveredCallbacks.indexOf(callback);
      if (index > -1) {
        this.onItemDiscoveredCallbacks.splice(index, 1);
      }
    };
  }

  private notifyCallbacks(itemId: string): void {
    for (const callback of this.onItemDiscoveredCallbacks) {
      try {
        callback(itemId);
      } catch (e) {
        this.logger.error(`Callback error: ${e}`);
      }
    }
  }

  getDiscoveredItems(): Set<string> {
    return new Set(this.discoveredItems);
  }

  getDiscoveredItemCount(): number {
    return this.discoveredItems.size;
  }
}

let instance: SystemItemDiscoveryService | null = null;

system.beforeEvents.startup.subscribe(() => {
  const di = new DiContainer();
  di.register(World, world);
  const logger = new Logger(di);
  instance = new SystemItemDiscoveryService(logger);
  instance.initialize();
});

export function getItemDiscoveryService(): SystemItemDiscoveryService {
  if (!instance) {
    throw new Error("Item discovery service not initialized");
  }
  return instance;
}