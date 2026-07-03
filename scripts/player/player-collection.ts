import { inject, injectAll, Lifecycle, registry, scoped } from "tsyringe";
import { Logger } from "../shared/logging/logger";
import {
  COLLECTED_PREFIX,
  COLLECTOR,
  COLLECTORS_TOKEN,
  CollectedMetadata,
  Collector,
  PlayerCollectionData,
  RegistryKey,
  THEME,
  emptyCollection,
} from "./collection-constants";
import { Runnable } from "../shared/runnable";
import { BiomeCollector } from "../collections/biome/biome.collector";
import { EffectCollector } from "../collections/effect/effect.collector";
import { EnchantmentCollector } from "../collections/enchantment/enchantment.collector";
import { EntityKilledCollector } from "../collections/entity/entity-killed.collector";
import { EnderDragonCollector } from "../collections/entity/ender-dragon.collector";
import { EntityNamedCollector } from "../collections/entity/entity-named.collector";
import { EntityLeashedCollector } from "../collections/entity/entity-leashed.collector";
import { EntityTamedCollector } from "../collections/entity/entity-tamed.collector";
import { ItemCollector } from "../collections/item/item.collector";
import { UnobtainableCollector } from "../collections/unobtainable/unobtainable.collector";
import { PlayerNotifier } from "./player-notifier";
import { PlayerSettingsService, WorldSettingsService } from "./player-settings";
import { SOLID_STAR } from "../shared/emoji";
import { BOLD, GRAY, ITALIC } from "../shared/format-codes";
import { capitalCase } from "../shared/formatting";
import type { ItemStack, Player, System, World } from "@minecraft/server";
import { EQUIPMENT_SLOT_TOKEN, PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { CollectionScoreboard } from "../system/scoreboard";
import { PlayerStorage } from "../shared/storage";
import { AllRegistry } from "../collections/all-registry";
import { ItemRegistry } from "../collections/item/item.registry";

@registry([
  { token: COLLECTORS_TOKEN, useClass: BiomeCollector },
  { token: COLLECTORS_TOKEN, useClass: EffectCollector },
  { token: COLLECTORS_TOKEN, useClass: EnchantmentCollector },
  { token: COLLECTORS_TOKEN, useClass: EnderDragonCollector },
  { token: COLLECTORS_TOKEN, useClass: EntityKilledCollector },
  { token: COLLECTORS_TOKEN, useClass: EntityNamedCollector },
  { token: COLLECTORS_TOKEN, useClass: EntityLeashedCollector },
  { token: COLLECTORS_TOKEN, useClass: EntityTamedCollector },
  { token: COLLECTORS_TOKEN, useClass: ItemCollector },
  { token: COLLECTORS_TOKEN, useClass: UnobtainableCollector },
])
@scoped(Lifecycle.ContainerScoped)
export class PlayerCollection {
  private collection: PlayerCollectionData = emptyCollection();
  private suppressNotifications = false;

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(SYSTEM_TOKEN) private system: System,
    @inject(CollectionScoreboard) private collectionScoreboard: CollectionScoreboard,
    @inject(COLLECTOR) collector: Collector,
    @inject(PlayerNotifier) private readonly playerNotifier: PlayerNotifier,
    @inject(PlayerSettingsService) private readonly playerSettingsService: PlayerSettingsService,
    @inject(WorldSettingsService) private readonly worldSettings: WorldSettingsService,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerStorage) private readonly playerStorage: PlayerStorage,
    @injectAll(COLLECTORS_TOKEN) private readonly collectors: Runnable[],
    @inject(WORLD_TOKEN) private world: World,
    @inject(AllRegistry) private readonly allRegistry: AllRegistry,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry,
    @inject(EQUIPMENT_SLOT_TOKEN) private readonly equipmentSlot: typeof import("@minecraft/server").EquipmentSlot
  ) {
    collector.collect = this.onCollect.bind(this);
  }
  run() {
    this.load();
    this.collectors.forEach((c) => c.run());
    this.scanInventory();
    this.logger.log(`Collection initialized.`);
  }

  private scanInventory() {
    this.suppressNotifications = true;

    const inventoryComponent = this.player.getComponent("inventory") as
      | { container: { getItem: (slot: number) => ItemStack | undefined; size: number } }
      | undefined;
    if (inventoryComponent) {
      const container = inventoryComponent.container;
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;
        const ids = this.itemRegistry.identify(item);
        ids.forEach((id) => this.onCollect(id));
      }
    }

    const equipmentComponent = this.player.getComponent("equippable") as
      | { getEquipment: (slot: {}) => ItemStack | undefined }
      | undefined;
    if (equipmentComponent) {
      const slots = [
        this.equipmentSlot.Head,
        this.equipmentSlot.Chest,
        this.equipmentSlot.Legs,
        this.equipmentSlot.Feet,
        this.equipmentSlot.Offhand,
      ];
      for (const slot of slots) {
        const item = equipmentComponent.getEquipment(slot);
        if (!item) continue;
        const ids = this.itemRegistry.identify(item);
        ids.forEach((id) => this.onCollect(id));
      }
    }

    this.suppressNotifications = false;
  }

  private load() {
    this.collection = emptyCollection();
    for (const key of this.playerStorage.keys()) {
      if (!key.startsWith(COLLECTED_PREFIX)) continue;
      const id = key.substring(COLLECTED_PREFIX.length);
      const [category, what] = id.includes(";") ? id.split(";") : ["", id];
      if (!category || !what) continue;
      const metadata = this.playerStorage.get<CollectedMetadata>(key);
      if (metadata) {
        this.collection[category as keyof PlayerCollectionData][what] = metadata.collectedOnTick;
      }
    }
    this.updateScore();
  }

  hasCollected(category: keyof PlayerCollectionData, what: string) {
    return !!this.collection[category]?.[what];
  }

  onCollect(id: string) {
    const [category, what] = id.includes(";") ? id.split(";") : ["", id];
    if (!category || !what) {
      return;
    }
    try {
      const tick = this.system.currentTick;
      const key = COLLECTED_PREFIX + id;
      const existing = this.playerStorage.get<CollectedMetadata>(key);

      if (existing) {
        if (this.suppressNotifications) return;
        const metadata: CollectedMetadata = {
          collectedOnTick: existing.collectedOnTick,
          collectedNTimes: existing.collectedNTimes + 1,
          lastCollectedOnTick: tick,
        };
        this.collection[category as keyof PlayerCollectionData][what] = metadata.collectedOnTick;
        this.playerStorage.set(key, metadata);
        return;
      }

      const metadata: CollectedMetadata = {
        collectedOnTick: tick,
        collectedNTimes: 1,
        lastCollectedOnTick: tick,
      };
      this.collection[category as keyof PlayerCollectionData][what] = metadata.collectedOnTick;
      this.playerStorage.set(key, metadata);

      if (this.suppressNotifications) return;

      if (!this.shouldSuppressNotification(id)) {
        const formatted = this.allRegistry.format(id);
        const notification = `${SOLID_STAR} ${THEME[category] ?? ""}Collected ${capitalCase(category)}: ${BOLD}${formatted}`;
        this.logger.log(notification);
        this.playerNotifier.toast(notification);
        if (this.worldSettings.getBroadcastCollectionEvents()) {
          this.world.sendMessage(`${GRAY}${ITALIC}${this.player.name} collected ${formatted}`);
        }
      }

      this.updateScore();
    } catch (err) {
      this.logger.error("error collecting", category, what, err, (err as Error).stack);
    }
  }

  private shouldSuppressNotification(id: string): boolean {
    const validIds = this.allRegistry.validIds(this.playerSettingsService.get().difficulty);
    return !validIds.has(id);
  }

  updateScore() {
    const score = Object.keys(this.collection).reduce(
      (prev, curr) => prev + Object.keys((this.collection as any)[curr]).length,
      0
    );
    this.collectionScoreboard.update(this.player, score);
  }

  getCollection(registryKey: RegistryKey): Record<string, number> {
    if (registryKey === "all") {
      return Object.keys(this.collection).reduce(
        (prev, curr) => ({ ...prev, ...this.collection[curr as keyof PlayerCollectionData] }),
        {} as Record<string, number>
      );
    }
    return this.collection[registryKey as keyof PlayerCollectionData];
  }

  delete() {
    for (const key of this.playerStorage.keys()) {
      if (key.startsWith(COLLECTED_PREFIX)) {
        this.playerStorage.deleteKey(key);
      }
    }
    this.playerStorage.deleteKey("biome;lastVisited");
    this.collection = emptyCollection();
    this.updateScore();
  }
}
