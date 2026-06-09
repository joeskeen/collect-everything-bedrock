import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, RawMessage, CustomCommandResult, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME } from "../collection-constants";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { capitalCase } from "change-case";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { BiomeRegistry } from "../../collections/biome/biome.registry";
import { EntityRegistry } from "../../collections/entity/entity.registry";
import { ItemRegistry } from "../../collections/item/item.registry";
import { EffectRegistry } from "../../collections/effect/effect.registry";
import { EnchantmentRegistry } from "../../collections/enchantment/enchantment.registry";

@scoped(Lifecycle.ContainerScoped)
export class PlayerUncollectedCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(BiomeRegistry) private readonly biomeRegistry: BiomeRegistry,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry,
    @inject(EffectRegistry) private readonly effectRegistry: EffectRegistry,
    @inject(EnchantmentRegistry) private readonly enchantmentRegistry: EnchantmentRegistry,
    @inject(PLAYER_TOKEN) private readonly player: Player
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
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
        {
          category: ITEM,
          entries: this.itemRegistry
            .allItems()
            .filter((k) => !collection[ITEM][k])
            .sort()
            .map((k) => this.itemRegistry.formatItem(k)),
        },
        {
          category: EFFECT,
          entries: this.effectRegistry
            .allEffects()
            .filter((k) => !collection[EFFECT][k])
            .sort()
            .map((k) => this.effectRegistry.formatEffect(k)),
        },
        {
          category: ENCHANTMENT,
          entries: this.enchantmentRegistry
            .allEnchantments()
            .filter((k) => !collection[ENCHANTMENT][k])
            .sort()
            .map((k) => this.enchantmentRegistry.formatEnchantment(k)),
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
          { text: "\n" },
        ],
      };
      this.player.sendMessage(message);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerUncollectedCommand = addOnCommand({
  name: "uncollected",
  description: "show what you have not yet collected",
  handlerClass: PlayerUncollectedCommand,
});
