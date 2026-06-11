import { inject, Lifecycle, scoped } from "tsyringe";
import {
  addOnCommand,
  CommandHandler,
  customCommandParamType as customCommandParamTypes,
  customCommandStatuses,
} from "../../system/add-on-command";
import type { Player, RawMessage, CustomCommandResult, System, CustomCommandOrigin } from "@minecraft/server";
import { PlayerCollection } from "../player-collection";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME } from "../collection-constants";
import { GRAY, MINECOIN_GOLD, RESET } from "../../shared/format-codes";
import { capitalCase } from "change-case";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { BiomeRegistry } from "../../collections/biome/biome.registry";
import { EntityRegistry } from "../../collections/entity/entity.registry";
import { ItemRegistry } from "../../collections/item/item.registry";
import { EffectRegistry } from "../../collections/effect/effect.registry";
import { EnchantmentRegistry } from "../../collections/enchantment/enchantment.registry";

@scoped(Lifecycle.ContainerScoped)
export class PlayerAllCommand implements CommandHandler {
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

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    const filter = (String(args[0]) || "").toLowerCase();

    this.system.run(() => {
      const collection = this.collection.getCollection();
      const allData = [
        {
          category: BIOME,
          isCollected: (k: string) => !!collection[BIOME][k],
          allEntries: () =>
            this.biomeRegistry
              .allBiomes()
              .sort()
              .filter((e) => e.includes(filter)),
          format: (k: string) => this.biomeRegistry.formatBiome(k),
        },
        {
          category: ENTITY,
          isCollected: (k: string) => !!collection[ENTITY][k],
          allEntries: () =>
            this.entityRegistry
              .allEntities()
              .sort()
              .filter((e) => e.includes(filter)),
          format: (k: string) => this.entityRegistry.formatEntity(k),
        },
        {
          category: ITEM,
          isCollected: (k: string) => !!collection[ITEM][k],
          allEntries: () =>
            this.itemRegistry
              .allItems()
              .sort()
              .filter((e) => e.includes(filter)),
          format: (k: string) => this.itemRegistry.formatItem(k),
        },
        {
          category: EFFECT,
          isCollected: (k: string) => !!collection[EFFECT][k],
          allEntries: () =>
            this.effectRegistry
              .allEffects()
              .sort()
              .filter((e) => e.includes(filter)),
          format: (k: string) => this.effectRegistry.formatEffect(k),
        },
        {
          category: ENCHANTMENT,
          isCollected: (k: string) => !!collection[ENCHANTMENT][k],
          allEntries: () =>
            this.enchantmentRegistry
              .allEnchantments()
              .sort()
              .filter((e) => e.includes(filter)),
          format: (k: string) => this.enchantmentRegistry.formatEnchantment(k),
        },
      ];

      const message: RawMessage = {
        rawtext: [
          { text: `${MINECOIN_GOLD}=== All ${filter ? `"${filter}"` : ""} ===${RESET}\n` },
          ...allData.flatMap((x) => {
            const entries = x.allEntries().map((k) => {
              const formatted = x.format(k);
              const color = x.isCollected(k) ? THEME[x.category] : GRAY;
              return [{ text: color }, formatted, { text: RESET }, { text: ", " }] as RawMessage[];
            });
            return [
              { text: `${THEME[x.category]}${capitalCase(x.category)}${RESET}: ` },
              ...entries.flat(),
              { text: "\n" },
            ];
          }),
          { text: "\n" },
        ],
      };
      this.player.sendMessage(message);
    });
    return { status: customCommandStatuses.Success };
  }
}

export const playerAllCommand = addOnCommand({
  name: "all",
  description: "show everything, highlighting collected items",
  handlerClass: PlayerAllCommand,
  optionalParameters: [{ name: "filter", type: customCommandParamTypes.String }],
});
