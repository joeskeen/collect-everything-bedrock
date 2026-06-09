import { inject, injectAll, Lifecycle, registry, scoped } from "tsyringe";
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
import { BiomeCollector } from "./collectors/biome.collector";
import { EntityKilledCollector } from "./collectors/entity-killed.collector";
import { EntityNamedCollector } from "./collectors/entity-named.collector";
import { PlayerNotifier } from "./player-notifier";
import { SOLID_STAR } from "../shared/emoji";
import { formatId } from "../shared/formatting";
import { BOLD } from "../shared/format-codes";
import { capitalCase } from "change-case";
import type { Player, System } from "@minecraft/server";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../shared/global-tokens";
import { CollectionScoreboard } from "../system/scoreboard";
import { NAMESPACE } from "../shared/constants";
import { PlayerStorage } from "../shared/storage";

const COLLECTION_KEY = `${NAMESPACE}:collection`;

@registry([
  { token: COLLECTORS_TOKEN, useClass: BiomeCollector },
  { token: COLLECTORS_TOKEN, useClass: EntityKilledCollector },
  { token: COLLECTORS_TOKEN, useClass: EntityNamedCollector },
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
    @injectAll(COLLECTORS_TOKEN) private readonly collectors: Runnable[]
  ) {
    collector.collect = this.onCollect.bind(this);
  }
  run() {
    this.collection = this.playerStorage.get<PlayerCollectionData>(COLLECTION_KEY) ?? emptyCollection();
    console.log(this.collection);
    console.log(typeof this.collection);
    this.updateScore();
    this.collectors.forEach((c) => c.run());
    this.logger.log(`Collection initialized.`);
  }

  onCollect(category: keyof PlayerCollectionData, what: string, displayName?: string) {
    if (this.collection[category]?.[what]) {
      return;
    }
    try {
      if (!displayName) {
        displayName = formatId(what);
      }
      this.collection[category][what] = this.system.currentTick;

      this.playerStorage.set(COLLECTION_KEY, this.collection);

      const fullMessage = `${SOLID_STAR} ${THEME[category] ?? ""}Collected ${capitalCase(category)}: ${BOLD}${displayName}`;
      this.logger.log(fullMessage);
      this.playerNotifier.toast(fullMessage);

      this.updateScore();
    } catch (err) {
      this.logger.error("errror collecting", category, what, err, (err as Error).stack);
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
}
