import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandResult, Player, System } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME } from "../collection-constants";
import { capitalCase } from "change-case";
import { percent } from "../../shared/formatting";
import { GOLD, GRAY, RESET } from "../../shared/format-codes";
import { BiomeRegistry } from "../../collections/biome/biome.registry";
import { EntityRegistry } from "../../collections/entity/entity.registry";
import { ItemRegistry } from "../../collections/item/item.registry";
import { EffectRegistry } from "../../collections/effect/effect.registry";
import { EnchantmentRegistry } from "../../collections/enchantment/enchantment.registry";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";

@scoped(Lifecycle.ContainerScoped)
export class PlayerStatsCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(BiomeRegistry) private readonly biomeRegistry: BiomeRegistry,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry,
    @inject(EffectRegistry) private readonly effectRegistry: EffectRegistry,
    @inject(EnchantmentRegistry) private readonly enchantmentRegistry: EnchantmentRegistry
  ) {}

  handleCommand(event: any): CustomCommandResult {
    this.system.run(() => {
      const collection = this.collection.getCollection();
      const collectionProgress = [
        { category: BIOME, ...this.biomeRegistry.countCollectedBiomes(Object.keys(collection[BIOME] ?? {})) },
        { category: ENTITY, ...this.entityRegistry.countCollectedEntities(Object.keys(collection[ENTITY] ?? {})) },
        { category: ITEM, ...this.itemRegistry.countCollectedItems(Object.keys(collection[ITEM] ?? {})) },
        { category: EFFECT, ...this.effectRegistry.countCollectedEffects(Object.keys(collection[EFFECT] ?? {})) },
        {
          category: ENCHANTMENT,
          ...this.enchantmentRegistry.countCollectedEnchantments(Object.keys(collection[ENCHANTMENT] ?? {})),
        },
      ];
      const totalProgress = {
        collected: collectionProgress.reduce((prev, curr) => prev + curr.collected, 0),
        total: collectionProgress.reduce((prev, curr) => prev + curr.total, 0),
      };
      const messageLines = [
        `${GOLD}=== Collection Stats ===${GRAY}`,
        collectionProgress
          .map(
            (c) =>
              `${THEME[c.category]}${capitalCase(c.category)}${RESET}: ${c.collected}/${c.total || "?"} (${percent(c.collected, c.total)}) ${c.extra ? "+" + c.extra : ""}`
          )
          .join("\n"),
        `${GOLD}Total: ${totalProgress.collected}/${totalProgress.total} (${percent(totalProgress.collected, totalProgress.total)})\n`,
      ];
      this.player.sendMessage(messageLines.join("\n"));
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerStatsCommand = addOnCommand({
  name: "stats",
  description: "show collection statistics",
  handlerClass: PlayerStatsCommand,
});
