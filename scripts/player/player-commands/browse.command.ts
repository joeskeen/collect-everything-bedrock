import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandOrigin, CustomCommandResult, Player, System } from "@minecraft/server";
import { CREATE_ACTION_FORM_TOKEN, CreateActionFormFn, PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, UNOBTAINABLE } from "../collection-constants";
import { ItemRegistry } from "../../collections/item/item.registry";
import { BiomeRegistry } from "../../collections/biome/biome.registry";
import { EntityRegistry } from "../../collections/entity/entity.registry";
import { EffectRegistry } from "../../collections/effect/effect.registry";
import { EnchantmentRegistry } from "../../collections/enchantment/enchantment.registry";
import { UnobtainableRegistry } from "../../collections/unobtainable/unobtainable.registry";
import { PlayerCollection } from "../player-collection";
import { capitalCase } from "change-case";
import { DDUI, DDUI_TOKEN } from "../../ui/ui.tokens";
import { CollectionFormData, encodeTexture } from "../../shared/forms";
import { formatId } from "../../shared/formatting";
import IDS from "../../data/_generated-internalIds.json";

@scoped(Lifecycle.ContainerScoped)
export class PlayerBrowseCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerCollection) private readonly playerCollection: PlayerCollection,
    @inject(ItemRegistry) private readonly itemRegistry: ItemRegistry,
    @inject(BiomeRegistry) private readonly biomeRegistry: BiomeRegistry,
    @inject(EntityRegistry) private readonly entityRegistry: EntityRegistry,
    @inject(EffectRegistry) private readonly effectRegistry: EffectRegistry,
    @inject(EnchantmentRegistry) private readonly enchantmentRegistry: EnchantmentRegistry,
    @inject(UnobtainableRegistry) private readonly unobtainableRegistry: UnobtainableRegistry,
    @inject(CREATE_ACTION_FORM_TOKEN) private readonly createActionForm: CreateActionFormFn,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI
  ) {}

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    this.system.run(() => {
      const collection = this.playerCollection.getCollection();
      const categories = [
        {
          key: ITEM,
          items: this.itemRegistry.allItems(),
          collected: this.itemRegistry.countCollectedItems(Object.keys(collection[ITEM])),
        },
        {
          key: BIOME,
          items: this.biomeRegistry.allBiomes(),
          collected: this.biomeRegistry.countCollectedBiomes(Object.keys(collection[BIOME])),
        },
        {
          key: ENTITY,
          items: this.entityRegistry.allEntities(),
          collected: this.entityRegistry.countCollectedEntities(Object.keys(collection[ENTITY])),
        },
        {
          key: EFFECT,
          items: this.effectRegistry.allEffects(),
          collected: this.effectRegistry.countCollectedEffects(Object.keys(collection[EFFECT])),
        },
        {
          key: ENCHANTMENT,
          items: this.enchantmentRegistry.allEnchantments(),
          collected: this.enchantmentRegistry.countCollectedEnchantments(Object.keys(collection[ENCHANTMENT])),
        },
        {
          key: UNOBTAINABLE,
          items: this.unobtainableRegistry.allUnobtainables(),
          collected: this.unobtainableRegistry.countCollectedUnobtainables(Object.keys(collection[UNOBTAINABLE])),
        },
      ];

      const form = new this.ddui.CustomForm(this.player, "Collection Browser");
      const chestForm = new CollectionFormData("mega", this.createActionForm).title("Collection Browser");

      let slot = 0;
      for (const category of categories) {
        const icon = this.getCategoryIcon(category.key);
        form.button(capitalCase(category.key), () => console.log(category.key));
        chestForm.button(slot++, capitalCase(category.key), [], icon);
      }

      for (const item of this.itemRegistry
        .allItems()
        .map((id) => [id, (IDS as any)[id]])
        .sort((a, b) => a[1] - b[1])) {
        if (slot >= 136) break;

        // if (item[1] <= 769) continue;

        chestForm.button(slot++, formatId(item[0]), [item, item[1], encodeTexture(item[0])], item[0]);
      }

      chestForm.show(this.player);
      // form.show();
    });

    return { status: customCommandStatuses.Success };
  }

  private getCategoryIcon(category: string): string {
    switch (category) {
      case ITEM:
        return "minecraft:diamond";
      // return "textures/items/diamond";
      case BIOME:
        return "minecraft:oak_sapling";
      case ENTITY:
        return "minecraft:creeper_head";
      case EFFECT:
        return "textures/ui/particles";
      case ENCHANTMENT:
        return "minecraft:enchanted_book";
      case UNOBTAINABLE:
        return "textures/blocks/mob_spawner";
      default:
        return "textures/items/paper";
    }
  }
}

export const playerBrowseCommand = addOnCommand({
  name: "browse",
  description: "browse your collection",
  handlerClass: PlayerBrowseCommand,
});
