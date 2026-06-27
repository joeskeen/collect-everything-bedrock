import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandOrigin, CustomCommandResult, Player, RawMessage, System } from "@minecraft/server";
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
import { formatId, trimNamespace as removeNamespace } from "../../shared/formatting";
import { getItemTexture } from "../../collections/item/item-texture";
import ENTITIES from "../../collections/entity/entities";
import EFFECTS from "../../collections/effect/effects";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";
import { GRAY, ITALIC, RESET } from "../../shared/format-codes";
import { PlayerSettingsService } from "../player-settings";

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
  icon: string | number;
  allIds: () => string[];
  textures?: Record<string, string>;
  collectedCount: (keys: string[]) => { collected: number; total: number };
}

@scoped(Lifecycle.ContainerScoped)
export class PlayerBrowseCommand implements CommandHandler {
  private activeCategory: CategoryKey | "all" = "all";

  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerCollection) private readonly playerCollection: PlayerCollection,
    @inject(PlayerSettingsService) private readonly playerSettingsService: PlayerSettingsService,
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
      icon: getItemTexture("minecraft:diamond", false, this.itemRegistry.customItemCount()),
      allIds: () => this.itemRegistry.allItems(),
      collectedCount: (keys) => this.itemRegistry.countCollectedItems(keys),
    },
    {
      key: BIOME,
      label: "Biomes",
      icon: getItemTexture("minecraft:oak_sapling", false, this.itemRegistry.customItemCount()),
      allIds: () => this.biomeRegistry.allBiomes(),
      collectedCount: (keys) => this.biomeRegistry.countCollectedBiomes(keys),
    },
    {
      key: ENTITY,
      label: "Entities",
      icon: getItemTexture("minecraft:creeper_head", false, this.itemRegistry.customItemCount()),
      allIds: () => {
        const difficulty = this.playerSettingsService.get().difficulty;
        const entities = this.entityRegistry.allEntities(difficulty);
        return entities;
      },
      textures: Object.keys(ENTITIES).reduce(
        (prev, curr) => {
          prev[curr] = (ENTITIES as any)[curr].texture;
          return prev;
        },
        {} as Record<string, string>
      ),
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
      icon: getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount()),
      allIds: () => this.enchantmentRegistry.allEnchantments(),
      collectedCount: (keys) => this.enchantmentRegistry.countCollectedEnchantments(keys),
    },
    {
      key: UNOBTAINABLE,
      label: "Unobtainable",
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
    collectionForm.button(
      { text: "All" },
      [{ text: `${GRAY}${totalCollected}/${totalItems}` }],
      "textures/items/book_normal",
      undefined,
      Math.floor((totalCollected / totalItems) * 100)
    );

    for (const cat of this.categories) {
      const { collected } = cat.collectedCount(Object.keys(collection[cat.key] ?? {}));
      const total = cat.allIds().length;
      collectionForm.button(
        { text: cat.label },
        [{ text: `${GRAY}${collected}/${total}` }],
        cat.icon,
        undefined,
        Math.floor((collected / total) * 100)
      );
    }

    const thingsToShow =
      this.activeCategory === "all"
        ? this.categories
            .flatMap((c) => c.allIds().map((id) => [id, c.key] as const))
            .sort((a, b) => removeNamespace(a[0]).localeCompare(removeNamespace(b[0])))
        : this.getCategoryItems(this.activeCategory).map((id) => [id, this.activeCategory]);

    for (const thing of thingsToShow) {
      const [itemId, category] = thing;
      let texture: string | number;
      let name: RawMessage;
      let isEnchanted = false;
      const baseId = itemId.split("+")[0];
      const percentComplete = this.playerCollection.hasCollected(category as any, itemId) ? 100 : 0;
      if (category === "item" || category === "unobtainable") {
        name = this.itemRegistry.formatItem(itemId);
        texture = getItemTexture(baseId, false, this.itemRegistry.customItemCount());
      } else if (category === "entity") {
        texture = (ENTITIES as any)[baseId]?.texture ?? baseId;
        name = this.entityRegistry.formatEntity(itemId);
      } else if (category === "effect") {
        name = this.effectRegistry.formatEffect(itemId);
        texture = (EFFECTS as any)[itemId]?.texture ?? UNKNOWN_TEXTURE;
      } else if (category === "enchantment") {
        name = this.enchantmentRegistry.formatEnchantment(itemId);
        texture = getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount());
        isEnchanted = true;
      } else if (category === "biome") {
        name = this.biomeRegistry.formatBiome(baseId);
        texture = this.biomeRegistry.resolveTexture(itemId);
      } else {
        texture = itemId;
        name = { text: formatId(itemId) };
      }
      collectionForm.button(
        name,
        [{ text: `${ITALIC}${GRAY}${category}${RESET}` }, { text: itemId }],
        texture ?? UNKNOWN_TEXTURE,
        undefined,
        percentComplete
      );
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

  private getCategoryItems(category: CategoryKey) {
    switch (category) {
      case ITEM:
        return this.itemRegistry.allItems().sort();
      case BIOME:
        return this.biomeRegistry.allBiomes().sort();
      case ENTITY:
        return this.entityRegistry.allEntities(this.playerSettingsService.get().difficulty).sort();
      case EFFECT:
        return this.effectRegistry.allEffects().sort();
      case ENCHANTMENT:
        return this.enchantmentRegistry.allEnchantments().sort();
      case UNOBTAINABLE:
        return this.unobtainableRegistry.allUnobtainables().sort();
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
