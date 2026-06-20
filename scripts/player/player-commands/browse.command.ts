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
import { CollectionFormData } from "../../shared/forms";
import { formatId } from "../../shared/formatting";
import IDS from "../../data/_generated-internalIds.json";
import { GRAY } from "../../shared/format-codes";

const SLOT_COUNT = 136;

type CategoryKey =
  | typeof ITEM
  | typeof BIOME
  | typeof ENTITY
  | typeof EFFECT
  | typeof ENCHANTMENT
  | typeof UNOBTAINABLE;

interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  allIds: () => string[];
  collectedCount: (keys: string[]) => { collected: number; total: number };
}

@scoped(Lifecycle.ContainerScoped)
export class PlayerBrowseCommand implements CommandHandler {
  private activeCategory: CategoryKey | "all" = "all";

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

  private readonly categories: Category[] = [
    {
      key: ITEM,
      label: "Items",
      icon: "minecraft:diamond",
      allIds: () => this.itemRegistry.allItems(),
      collectedCount: (keys) => this.itemRegistry.countCollectedItems(keys),
    },
    {
      key: BIOME,
      label: "Biomes",
      icon: "minecraft:oak_sapling",
      allIds: () => this.biomeRegistry.allBiomes(),
      collectedCount: (keys) => this.biomeRegistry.countCollectedBiomes(keys),
    },
    {
      key: ENTITY,
      label: "Entities",
      icon: "minecraft:creeper_head",
      allIds: () => this.entityRegistry.allEntities(),
      collectedCount: (keys) => this.entityRegistry.countCollectedEntities(keys),
    },
    {
      key: EFFECT,
      label: "Effects",
      icon: "textures/ui/particles",
      allIds: () => this.effectRegistry.allEffects(),
      collectedCount: (keys) => this.effectRegistry.countCollectedEffects(keys),
    },
    {
      key: ENCHANTMENT,
      label: "Enchant",
      icon: "minecraft:enchanted_book",
      allIds: () => this.enchantmentRegistry.allEnchantments(),
      collectedCount: (keys) => this.enchantmentRegistry.countCollectedEnchantments(keys),
    },
    {
      key: UNOBTAINABLE,
      label: "Special",
      icon: "textures/blocks/mob_spawner",
      allIds: () => this.unobtainableRegistry.allUnobtainables(),
      collectedCount: (keys) => this.unobtainableRegistry.countCollectedUnobtainables(keys),
    },
  ];

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    this.activeCategory = "all";
    this.system.run(() => this.showForm());
    return { status: customCommandStatuses.Success };
  }

  private showForm() {
    const collection = this.playerCollection.getCollection();
    const collectionForm = new CollectionFormData(this.createActionForm).title(
      `Collection - ${capitalCase(this.activeCategory)}`
    );

    const totalCollected = this.categories.reduce(
      (sum, cat) => sum + cat.collectedCount(Object.keys(collection[cat.key] ?? {})).collected,
      0
    );
    const totalItems = this.categories.reduce((sum, cat) => sum + cat.allIds().length, 0);
    collectionForm.button("All", [`${GRAY}${totalCollected}/${totalItems}`], "textures/items/book_normal");

    for (const cat of this.categories) {
      const { collected, total } = cat.collectedCount(Object.keys(collection[cat.key] ?? {}));
      collectionForm.button(cat.label, [`${GRAY}${collected}/${total}`], cat.icon);
    }

    const itemsToShow =
      this.activeCategory === "all"
        ? this.itemRegistry
            .allItems()
            .map((id) => [id, (IDS as any)[id]] as [string, number])
            .sort((a, b) => a[1] - b[1])
        : this.getCategoryItems(this.activeCategory);

    for (const item of itemsToShow) {
      // if (slot >= SLOT_COUNT) break;
      collectionForm.button(formatId(item[0]), [item[0], String(item[1])], item[0]);
    }

    collectionForm.show(this.player).then((result) => {
      if (result.canceled || result.selection === undefined) return;
      const selection = result.selection;
      if (selection === 0) {
        this.activeCategory = "all";
        this.system.run(() => this.showForm());
      } else if (selection <= this.categories.length) {
        this.activeCategory = this.categories[selection - 1].key;
        this.system.run(() => this.showForm());
      }
    });
  }

  private getCategoryItems(category: CategoryKey): [string, number][] {
    switch (category) {
      case ITEM:
        return this.itemRegistry
          .allItems()
          .map((id) => [id, (IDS as any)[id]] as [string, number])
          .sort((a, b) => a[1] - b[1]);
      case BIOME:
        return this.biomeRegistry
          .allBiomes()
          .map((id) => [id, (IDS as any)[id]] as [string, number])
          .sort((a, b) => a[1] - b[1]);
      case ENTITY:
        return this.entityRegistry
          .allEntities()
          .map((id) => [id, (IDS as any)[id]] as [string, number])
          .sort((a, b) => a[1] - b[1]);
      case EFFECT:
        return this.effectRegistry
          .allEffects()
          .map((id) => [id, (IDS as any)[id]] as [string, number])
          .sort((a, b) => a[1] - b[1]);
      case ENCHANTMENT:
        return this.enchantmentRegistry
          .allEnchantments()
          .map((id) => [id, (IDS as any)[id]] as [string, number])
          .sort((a, b) => a[1] - b[1]);
      case UNOBTAINABLE:
        return this.unobtainableRegistry
          .allUnobtainables()
          .map((id) => [id, (IDS as any)[id]] as [string, number])
          .sort((a, b) => a[1] - b[1]);
      default:
        return [];
    }
  }
}

export const playerBrowseCommand = addOnCommand({
  name: "browse",
  description: "browse your collection",
  handlerClass: PlayerBrowseCommand,
});
