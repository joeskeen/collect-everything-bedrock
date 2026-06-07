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
import { PlayerNotifier } from "./player-notifier";
import { SOLID_STAR } from "../shared/emoji";
import { formatId } from "../shared/formatting";
import { BOLD } from "../shared/format-codes";
import { capitalCase } from "change-case";
import type { System } from "@minecraft/server";
import { SYSTEM_TOKEN } from "../shared/global-tokens";

@registry([
  { token: COLLECTOR, useValue: { collect: () => {} } as Collector },
  { token: COLLECTORS_TOKEN, useClass: BiomeCollector },
])
@scoped(Lifecycle.ContainerScoped)
export class PlayerCollection {
  private collection: PlayerCollectionData = emptyCollection();

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(SYSTEM_TOKEN) private system: System,
    @inject(COLLECTOR) collector: Collector,
    @inject(PlayerNotifier) private readonly playerNotifier: PlayerNotifier,
    @injectAll(COLLECTORS_TOKEN) private readonly collectors: Runnable[]
  ) {
    collector.collect = this.onCollect.bind(this);
  }
  run() {
    // TODO: load collection from storage
    this.collectors.forEach((c) => c.run());
    this.logger.log(`Collection initialized.`);
  }

  onCollect(category: keyof PlayerCollectionData, what: string) {
    if (this.collection[category].has(what)) {
      return;
    }
    // TODO: save collection to storage
    this.collection[category].set(what, this.system.currentTick);
    const fullMessage = `${SOLID_STAR} ${THEME[category] ?? ""}Collected ${capitalCase(category)}: ${BOLD}${formatId(what)}`;
    this.logger.log(fullMessage);
    this.playerNotifier.toast(fullMessage);
  }

  getCollection() {
    return this.collection;
  }
}
