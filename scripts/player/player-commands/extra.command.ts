import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, CustomCommandResult, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { GOLD, GRAY, ITALIC, RESET } from "../../shared/format-codes";
import { capitalCase } from "../../shared/formatting";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { RegistryCollection } from "../../collections/index";

@scoped(Lifecycle.ContainerScoped)
export class PlayerExtraCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(RegistryCollection) private readonly registries: RegistryCollection,
    @inject(PLAYER_TOKEN) private readonly player: Player
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
      const hasExtra = this.registries.registries
        .filter((r) => r.key !== "all")
        .some((registry) => {
          const collectedKeys = Object.keys(
            this.collection.getCollection(registry.key as keyof PlayerCollectionData) ?? {}
          );
          return registry.getExtra(collectedKeys).length > 0;
        });

      if (!hasExtra) {
        this.player.sendMessage(`${GOLD}No extra items collected.`);
        return;
      }

      this.player.sendMessage(
        `${GOLD}=== Extra ===\n${GRAY}The following items were collected but are not recognized by the Collect Everything! add-on:`
      );

      for (const registry of this.registries.registries.filter((r) => r.key !== "all")) {
        const collectedKeys = Object.keys(
          this.collection.getCollection(registry.key as keyof PlayerCollectionData) ?? {}
        );
        const entries = registry
          .getExtra(collectedKeys)
          .sort()
          .map((k: string) => {
            const rawId = k.includes(";") ? k.split(";")[1] : k;
            return `${registry.format(k)} ${ITALIC}${GRAY}${rawId}`;
          });

        if (entries.length > 0) {
          const categoryColor = THEME[registry.key as keyof typeof THEME] ?? GRAY;
          this.player.sendMessage(`${categoryColor}${capitalCase(registry.key)}${RESET}\n${entries.join("\n")}`);
        }
      }
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerExtraCommand = addOnCommand({
  name: "extra",
  description: "list extra collected items not recognized by the game",
  handlerClass: PlayerExtraCommand,
});
