import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { CustomCommandOrigin, CustomCommandResult, Player, RawMessage, System } from "@minecraft/server";
import { CREATE_ACTION_FORM_TOKEN, CreateActionFormFn, PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME, UNOBTAINABLE } from "../collection-constants";
import { ItemRegistry } from "../../collections/item/item.registry";
import { BiomeRegistry } from "../../collections/biome/biome.registry";
import { EntityRegistry } from "../../collections/entity/entity.registry";
import { EffectRegistry } from "../../collections/effect/effect.registry";
import { EnchantmentRegistry } from "../../collections/enchantment/enchantment.registry";
import { UnobtainableRegistry } from "../../collections/unobtainable/unobtainable.registry";
import { PlayerCollection } from "../player-collection";
import { capitalCase } from "change-case";
import { CollectionFormData } from "../../ui/forms";
import { trimNamespace as removeNamespace } from "../../shared/formatting";
import { getItemTexture } from "../../collections/item/item-texture";
import ENTITIES from "../../collections/entity/entities";
import EFFECTS from "../../collections/effect/effects";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";
import { BOLD, GRAY, ITALIC, RESET } from "../../shared/format-codes";
import { PlayerSettingsService } from "../player-settings";

const RESERVED_BUTTONS = 32;
const GRID_ROW_LENGTH = 17;

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
  getName: (id: string) => RawMessage;
  resolveTexture: (id: string) => string | number;
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
    @inject(CREATE_ACTION_FORM_TOKEN) private readonly createActionForm: CreateActionFormFn
  ) {}

  private readonly categories: Category[] = [
    {
      key: ITEM,
      label: ITEM,
      icon: getItemTexture("minecraft:diamond", false, this.itemRegistry.customItemCount()),
      allIds: () => this.itemRegistry.allItems().sort(),
      collectedCount: (keys) => this.itemRegistry.countCollectedItems(keys),
      getName: (itemId) => this.itemRegistry.formatItem(itemId),
      resolveTexture: (itemId) => getItemTexture(itemId, false, this.itemRegistry.customItemCount()),
    },
    {
      key: BIOME,
      label: BIOME,
      icon: getItemTexture("minecraft:oak_sapling", false, this.itemRegistry.customItemCount()),
      allIds: () => this.biomeRegistry.allBiomes().sort(),
      collectedCount: (keys) => this.biomeRegistry.countCollectedBiomes(keys),
      getName: (id) => this.biomeRegistry.formatBiome(id),
      resolveTexture: (id) => this.biomeRegistry.resolveTexture(id),
    },
    {
      key: ENTITY,
      label: ENTITY,
      icon: getItemTexture("minecraft:creeper_head", false, this.itemRegistry.customItemCount()),
      allIds: () => {
        const difficulty = this.playerSettingsService.get().difficulty;
        const entities = this.entityRegistry.allEntities(difficulty);
        return entities.sort();
      },
      textures: Object.keys(ENTITIES).reduce(
        (prev, curr) => {
          prev[curr] = (ENTITIES as any)[curr].texture;
          return prev;
        },
        {} as Record<string, string>
      ),
      collectedCount: (keys) => this.entityRegistry.countCollectedEntities(keys),
      getName: (id) => this.entityRegistry.formatEntity(id),
      resolveTexture: (id) => {
        const baseId = id.split("+")[0];
        return (ENTITIES as any)[baseId]?.texture ?? baseId;
      },
    },
    {
      key: EFFECT,
      label: EFFECT,
      icon: "textures/ui/particles",
      allIds: () => this.effectRegistry.allEffects().sort(),
      collectedCount: (keys) => this.effectRegistry.countCollectedEffects(keys),
      getName: (id) => this.effectRegistry.formatEffect(id),
      resolveTexture: (id) => (EFFECTS as any)[id]?.texture ?? UNKNOWN_TEXTURE,
    },
    {
      key: ENCHANTMENT,
      label: ENCHANTMENT,
      icon: getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount()),
      allIds: () => this.enchantmentRegistry.allEnchantments().sort(),
      collectedCount: (keys) => this.enchantmentRegistry.countCollectedEnchantments(keys),
      resolveTexture: () => getItemTexture("minecraft:enchanted_book", true, this.itemRegistry.customItemCount()),
      getName: (id) => this.enchantmentRegistry.formatEnchantment(id),
    },
    {
      key: UNOBTAINABLE,
      label: UNOBTAINABLE,
      icon: "textures/blocks/mob_spawner",
      allIds: () => this.unobtainableRegistry.allUnobtainables().sort(),
      collectedCount: (keys) => this.unobtainableRegistry.countCollectedUnobtainables(keys),
      getName: (itemId) => this.itemRegistry.formatItem(itemId),
      resolveTexture: (itemId) => getItemTexture(itemId, false, this.itemRegistry.customItemCount()),
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
      `Collection - ${BOLD}${THEME[this.activeCategory] ?? ""}${capitalCase(this.activeCategory)}`
    );
    const buttons: Array<Parameters<typeof collectionForm.button>> = [];
    const navButtons: Array<Parameters<typeof collectionForm.button>> = [];

    const totalCollected = this.categories.reduce(
      (sum, cat) => sum + cat.collectedCount(Object.keys(collection[cat.key] ?? {})).collected,
      0
    );
    const totalItems = this.categories.reduce((sum, cat) => sum + cat.allIds().length, 0);

    navButtons.push([
      { text: "All" },
      [{ text: `${GRAY}${totalCollected}/${totalItems}` }],
      "textures/items/book_normal",
      undefined,
      Math.floor((totalCollected / totalItems) * 100),
      "all",
    ]);
    buttons.push(navButtons[navButtons.length - 1]);

    for (const cat of this.categories) {
      const { collected } = cat.collectedCount(Object.keys(collection[cat.key] ?? {}));
      const total = cat.allIds().length;
      navButtons.push([
        { text: capitalCase(cat.label) },
        [{ text: `${GRAY}${collected}/${total}` }],
        cat.icon,
        undefined,
        Math.floor((collected / total) * 100),
        cat.key,
      ]);
      buttons.push(navButtons[navButtons.length - 1]);
    }

    buttons.push([{ text: "Search" }, [], "", undefined, undefined, "search"]);
    buttons.push([{ text: "Recent" }, [], "", undefined, undefined, "recent"]);
    buttons.push([{ text: "Settings" }, [], "", undefined, undefined, "settings"]);
    buttons.push([{ text: "Help" }, [], "", undefined, undefined, "help"]);
    const filler: Parameters<typeof collectionForm.button> = [{}, [], "", undefined, undefined, undefined];
    while (buttons.length < GRID_ROW_LENGTH) {
      buttons.push(filler);
    }

    const category = this.categories.find((c) => c.key === this.activeCategory);
    const thingsToShow = category
      ? category.allIds().map((id) => [id, this.activeCategory])
      : this.categories // 'all'
          .flatMap((c) => c.allIds().map((id) => [id, c.key] as const))
          .sort((a, b) => removeNamespace(a[0]).localeCompare(removeNamespace(b[0])));

    collectionForm.itemsCount(thingsToShow.length);
    collectionForm.activeTab(this.categories.findIndex((c) => c.key === category?.key) + 1);

    for (const thing of thingsToShow) {
      const [id, categoryId] = thing;
      const category = this.categories.find((c) => c.key === categoryId)!;
      let texture: string | number = category.resolveTexture(id);
      let name: RawMessage = category.getName(id);
      const percentComplete = this.playerCollection.hasCollected(category.key, id) ? 100 : 0;
      buttons.push([
        name,
        [{ text: `${ITALIC}${THEME[categoryId] ?? GRAY}${category.label}${RESET}` }, { text: `${ITALIC}${GRAY}${id}` }],
        texture ?? UNKNOWN_TEXTURE,
        undefined,
        percentComplete,
        `${categoryId};${id}`,
      ]);
    }

    for (const button of buttons) {
      collectionForm.button(...button);
    }

    collectionForm
      .show(this.player)
      .then((result) => {
        console.log(
          "result",
          JSON.stringify({
            canceled: result?.canceled,
            selection: result?.selection,
            cancelationReason: result?.cancelationReason,
            selectedButtonValue: result?.selectedButtonValue,
          })
        );
        if (result.canceled || result.selection === undefined) return;

        const selection = result.selection;

        // TODO: show item detail
        if (selection > RESERVED_BUTTONS) return;

        const navIndex = 0;
        if (selection === navIndex) {
          this.activeCategory = "all";
          this.system.run(() => this.showForm());
        } else if (selection < navButtons.length) {
          this.activeCategory = this.categories[selection - 1].key;
          this.system.run(() => this.showForm());
        }
      })
      .catch((err) => {
        console.log("error", err);
      })
      .finally(() => console.log("done"));
  }
}

export const playerBrowseCommand = addOnCommand({
  name: "browse",
  description: "browse your collection",
  handlerClass: PlayerBrowseCommand,
});
