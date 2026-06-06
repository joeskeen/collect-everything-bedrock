import { container, inject, injectAll, Lifecycle, registry, scoped } from "tsyringe";
import { PLAYER_TOKEN } from "../shared/global-tokens";
import type { Player } from "@minecraft/server";
import { Logger } from "../shared/logging/logger";
import { COLLECT_FN, CollectFn, COLLECTORS_TOKEN } from "./collection-tokens";
import { Runnable } from "../shared/runnable";
import { BiomeCollector } from "./collectors/biome.collector";

@registry([
  { token: COLLECT_FN, useValue: { collect: () => {} } },
  { token: COLLECTORS_TOKEN, useClass: BiomeCollector },
])
@scoped(Lifecycle.ContainerScoped)
export class PlayerCollection {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(COLLECT_FN) collectFn: { collect: CollectFn },
    @injectAll(COLLECTORS_TOKEN) private readonly collectors: Runnable[]
  ) {
    collectFn.collect = this.onCollect.bind(this);
  }
  run() {
    // TODO: load collection from storage
    this.collectors.forEach((c) => c.run());
    this.logger.log(`Collection initialized.`);
  }

  onCollect(what: string) {
    this.logger.log(`COLLECTED: ${what}`);
  }
}
