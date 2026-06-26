import { delay, inject, injectAll, Lifecycle, registry, scoped } from "tsyringe";
import { Logger } from "../shared/logging/logger";
import {
  COLLECTOR,
  COLLECTORS_TOKEN,
  Collector,
  PlayerCollectionData,
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
import { SOLID_STAR } from "../shared/emoji";
import { BOLD, GRAY, ITALIC } from "../shared/format-codes";
import { capitalCase } from "change-case";
import type { Player, RawMessage, System, World } from "@minecraft/server";
import { PLAYER_TOKEN, SYSTEM_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { CollectionScoreboard } from "../system/scoreboard";
import { NAMESPACE } from "../shared/constants";
import { PlayerStorage } from "../shared/storage";

const COLLECTION_KEY = `${NAMESPACE}:collection`;

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

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(SYSTEM_TOKEN) private system: System,
    @inject(CollectionScoreboard) private collectionScoreboard: CollectionScoreboard,
    @inject(COLLECTOR) collector: Collector,
    @inject(PlayerNotifier) private readonly playerNotifier: PlayerNotifier,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerStorage) private readonly playerStorage: PlayerStorage,
    @injectAll(COLLECTORS_TOKEN) private readonly collectors: Runnable[],
    @inject(WORLD_TOKEN) private world: World
  ) {
    collector.collect = this.onCollect.bind(this);
  }
  run() {
    this.collection = { ...emptyCollection(), ...this.playerStorage.get<PlayerCollectionData>(COLLECTION_KEY) };
    this.updateScore();
    this.collectors.forEach((c) => c.run());
    this.logger.log(`Collection initialized.`);
  }

  hasCollected(category: keyof PlayerCollectionData, what: string) {
    return !!this.collection[category]?.[what];
  }

  onCollect(category: keyof PlayerCollectionData, what: string, formatted: RawMessage) {
    if (this.collection[category]?.[what]) {
      return;
    }
    try {
      this.collection[category][what] = this.system.currentTick;

      this.save();

      const fullMessage: RawMessage = {
        rawtext: [
          { text: `${SOLID_STAR} ${THEME[category] ?? ""}Collected ${capitalCase(category)}: ${BOLD}` },
          formatted,
        ],
      };
      this.logger.log(fullMessage);
      this.playerNotifier.toast(fullMessage);
      this.world.sendMessage({
        rawtext: [{ text: `${GRAY}${ITALIC}${this.player.name} collected ` }, formatted],
      });

      this.updateScore();
    } catch (err) {
      this.logger.error("error collecting", category, what, err, (err as Error).stack);
    }
  }

  updateScore() {
    const score = Object.keys(this.collection).reduce(
      (prev, curr) => prev + Object.keys((this.collection as any)[curr]).length,
      0
    );
    this.collectionScoreboard.update(this.player, score);
  }

  getCollection() {
    return this.collection;
  }

  save() {
    this.playerStorage.set(COLLECTION_KEY, this.collection);
  }

  delete() {
    this.collection = emptyCollection();
    this.save();
    this.updateScore();
  }
}
