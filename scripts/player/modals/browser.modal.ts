import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, RawMessage, System } from "@minecraft/server";
import {
  CREATE_ACTION_FORM_TOKEN,
  CREATE_MESSAGE_FORM_TOKEN,
  CREATE_MODAL_FORM_TOKEN,
  CreateActionFormFn,
  CreateMessageFormFn,
  CreateModalFormFn,
  PLAYER_TOKEN,
  SYSTEM_TOKEN,
} from "../../shared/global-tokens";
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
import { SettingsModal } from "./settings.modal";
import { HelpModal } from "./help.modal";
import { SessionModal } from "./session.modal";

const RESERVED_BUTTONS = 32;
const GRID_ROW_LENGTH = 17;

type CategoryKey =
  | typeof ITEM
  | typeof BIOME
  | typeof ENTITY
  | typeof EFFECT
  | typeof ENCHANTMENT
  | typeof UNOBTAINABLE;

const categoryKeys: (CategoryKey | "all")[] = ["all", ITEM, BIOME, ENTITY, EFFECT, ENCHANTMENT, UNOBTAINABLE];

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
export class BrowserModal {
  private activeCategory: CategoryKey | "all" = "all";
  private readonly actions: Record<string, (id: string) => void | Promise<void>> = {
    category: (id) => {
      this.activeCategory = id as CategoryKey;
      this.system.run(() => this.show());
    },
    search: async () => {
      const form = this.createMessageForm().title("Search Collection").body("This feature is not yet implemented.");
      await form.show(this.player);
      this.system.run(() => this.show());
    },
    recent: async () => {
      this.system.run(async () => {
        await this.sessionModal.show();
        this.show();
      });
    },
    settings: async () => {
      this.system.run(async () => {
        await this.settingsModal.show();
        this.show();
      });
    },
    help: async () => {
      this.system.run(async () => {
        await this.helpModal.show();
        this.show();
      });
    },
    session: async () => {
      this.system.run(async () => {
        await this.sessionModal.show();
        this.show();
      });
    },
    details: async (id) => {
      const form = this.createMessageForm().title(id).body(`This feature is not yet implemented.`);
      await form.show(this.player);
      this.system.run(() => this.show());
    },
  };

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
    @inject(CREATE_MESSAGE_FORM_TOKEN) private readonly createMessageForm: CreateMessageFormFn,
    @inject(SettingsModal) private readonly settingsModal: SettingsModal,
    @inject(HelpModal) private readonly helpModal: HelpModal,
    @inject(SessionModal) private readonly sessionModal: SessionModal
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

  show() {
    const collection = this.playerCollection.getCollection();
    const collectionForm = new CollectionFormData(this.createActionForm).title(
      `Collection - ${BOLD}${THEME[this.activeCategory] ?? ""}${capitalCase(this.activeCategory)}`
    );
    const buttons: Array<Parameters<typeof collectionForm.button>> = [];

    const totalCollected = this.categories.reduce(
      (sum, cat) => sum + cat.collectedCount(Object.keys(collection[cat.key] ?? {})).collected,
      0
    );
    const totalItems = this.categories.reduce((sum, cat) => sum + cat.allIds().length, 0);

    buttons.push([
      { text: "All" },
      [{ text: `${GRAY}${totalCollected}/${totalItems}` }],
      "textures/items/book_normal",
      undefined,
      Math.floor((totalCollected / totalItems) * 100),
      "all",
    ]);

    for (const cat of this.categories) {
      const { collected } = cat.collectedCount(Object.keys(collection[cat.key] ?? {}));
      const total = cat.allIds().length;
      buttons.push([
        { text: capitalCase(cat.label) },
        [{ text: `${GRAY}${collected}/${total}` }],
        cat.icon,
        undefined,
        Math.floor((collected / total) * 100),
        cat.key,
      ]);
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
        // console.log(
        //   "result",
        //   JSON.stringify({
        //     canceled: result?.canceled,
        //     selection: result?.selection,
        //     cancelationReason: result?.cancelationReason,
        //     selectedButtonValue: result?.selectedButtonValue,
        //   })
        // );
        if (result.canceled || result.selectedButtonValue === undefined || result.selectedButtonValue === null) {
          return;
        }

        const selection = result.selectedButtonValue as string;

        if (selection in this.actions) {
          this.actions[selection](selection);
        } else if (categoryKeys.includes(selection as CategoryKey)) {
          this.actions.category(selection);
        } else {
          this.actions.details(selection);
        }
      })
      .catch((err) => {
        console.log("error", err);
      });
  }
}
