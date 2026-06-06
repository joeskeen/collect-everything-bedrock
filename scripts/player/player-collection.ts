import { inject, Lifecycle, scoped } from "tsyringe";
import { PLAYER_TOKEN } from "../global-tokens";
import type { Player } from "@minecraft/server";
import { Logger } from "../shared/logging/logger";

@scoped(Lifecycle.ContainerScoped)
export class PlayerCollection {
  constructor(
    @inject(PLAYER_TOKEN) private player: Player,
    @inject(Logger) private logger: Logger
  ) {}
  run() {
    this.logger.log(`Collection initialized.`);
  }
}
