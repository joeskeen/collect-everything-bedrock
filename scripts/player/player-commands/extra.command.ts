import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, RawMessage, CustomCommandResult, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { THEME, PlayerCollectionData } from "../collection-constants";
import { GOLD, GRAY, ITALIC, RESET } from "../../shared/format-codes";
import { capitalCase } from "change-case";
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
      const collection = this.collection.getCollection();
      const extraData: Array<{ category: string; entries: { name: string; rawId: string }[] }> = [];

      for (const registry of this.registries.registries) {
        const collectedKeys = Object.keys(collection[registry.key as keyof PlayerCollectionData] ?? {});
        const entries = registry
          .getExtra(collectedKeys)
          .sort()
          .map((k: string) => ({
            name: registry.format(k),
            rawId: k.includes(";") ? k.split(";")[1] : k,
          }));

        if (entries.length > 0) {
          extraData.push({ category: registry.key, entries });
        }
      }

      if (extraData.length === 0) {
        this.player.sendMessage(`${GOLD}No extra items collected.${GRAY}`);
        return;
      }

      const message: RawMessage = {
        rawtext: [
          { text: `${GOLD}=== Extra ===${RESET}\n` },
          {
            text: `${GRAY}The following items were collected but are not recognized by the Collect Everything! add-on:${RESET}\n`,
          },
          ...extraData.flatMap((x) => [
            { text: `${THEME[x.category as keyof typeof THEME] ?? GRAY}${capitalCase(x.category)}${RESET}\n` },
            ...x.entries.flatMap((e) => [{ text: `  ${e.name} ` }, { text: `${ITALIC}${GRAY}${e.rawId}${RESET}\n` }]),
          ]),
        ],
      };
      this.player.sendMessage(message);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerExtraCommand = addOnCommand({
  name: "extra",
  description: "list extra collected items not recognized by the game",
  handlerClass: PlayerExtraCommand,
});
