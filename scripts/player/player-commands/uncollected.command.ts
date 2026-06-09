import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, RawMessage, CustomCommandResult } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, ENTITY, THEME } from "../collection-constants";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { capitalCase } from "change-case";
import { PLAYER_TOKEN } from "../../shared/global-tokens";
import { BiomeRegistry } from "../../collections/biome/biome.registry";
import { EntityRegistry } from "../../collections/entity/entity.registry";

@scoped(Lifecycle.ContainerScoped)
export class PlayerUncollectedCommand implements CommandHandler {
  constructor(
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(BiomeRegistry) private readonly biomeRegistry: BiomeRegistry,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(PLAYER_TOKEN) private readonly player: Player
  ) {}

  handleCommand(event: any): CustomCommandResult {
    const collection = this.collection.getCollection();
    const uncollection = [
      {
        category: BIOME,
        entries: this.biomeRegistry
          .allBiomes()
          .filter((k) => !collection[BIOME][k])
          .sort()
          .map((k) => this.biomeRegistry.formatBiome(k)),
      },
      {
        category: ENTITY,
        entries: this.entityRegistry
          .allEntities()
          .filter((k) => !collection[ENTITY][k])
          .sort()
          .map((k) => this.entityRegistry.formatEntity(k)),
      },
    ];

    const message: RawMessage = {
      rawtext: [
        { text: `${GOLD}=== Uncollected ===${GRAY}\n` },
        ...uncollection.flatMap((x) => [
          { text: `${THEME[x.category]}${capitalCase(x.category)}${RESET}: ` },
          ...x.entries.flatMap((e) => [e, { text: ", " }]),
          { text: "\n" },
        ]),
      ],
    };
    this.player.sendMessage(message);
    return { status: customCommandStatuses.Success };
  }
}

export const playerUncollectedCommand = addOnCommand({
  name: "uncollected",
  description: "show what you have not yet collected",
  handlerClass: PlayerUncollectedCommand,
});
