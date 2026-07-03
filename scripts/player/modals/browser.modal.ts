import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import {
  CREATE_ACTION_FORM_TOKEN,
  CREATE_MESSAGE_FORM_TOKEN,
  CreateActionFormFn,
  CreateMessageFormFn,
  PLAYER_TOKEN,
  SYSTEM_TOKEN,
} from "../../shared/global-tokens";
import { THEME, PlayerCollectionData, RegistryKey } from "../collection-constants";
import { RegistryCollection } from "../../collections/index";
import { AllRegistry } from "../../collections/all-registry";
import { PlayerCollection } from "../player-collection";
import { capitalCase } from "change-case";
import { CollectionFormData } from "../../ui/forms";
import { trimNamespace as removeNamespace } from "../../shared/formatting";
import { BOLD, GRAY, ITALIC, RESET } from "../../shared/format-codes";
import { PlayerSettingsService } from "../player-settings";
import { SettingsModal } from "./settings.modal";
import { HelpModal } from "./help.modal";
import { SessionModal } from "./session.modal";
import type { Registry } from "../../collections/registry";

const GRID_ROW_LENGTH = 17;

@scoped(Lifecycle.ContainerScoped)
export class BrowserModal {
  private activeCategory = "all";
  private readonly actions: Record<string, (id: string) => void | Promise<void>> = {
    category: (id) => {
      this.activeCategory = id;
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
    @inject(RegistryCollection) private readonly registryCollection: RegistryCollection,
    @inject(AllRegistry) private readonly allRegistry: AllRegistry,
    @inject(CREATE_ACTION_FORM_TOKEN) private readonly createActionForm: CreateActionFormFn,
    @inject(CREATE_MESSAGE_FORM_TOKEN) private readonly createMessageForm: CreateMessageFormFn,
    @inject(SettingsModal) private readonly settingsModal: SettingsModal,
    @inject(HelpModal) private readonly helpModal: HelpModal,
    @inject(SessionModal) private readonly sessionModal: SessionModal
  ) {}

  private getRegistries(): Registry[] {
    const difficulty = this.playerSettingsService.get().difficulty;

    const wrapWithDifficulty = (reg: Registry): Registry => ({
      key: reg.key,
      getIcon: () => reg.getIcon(),
      all: () => reg.all(difficulty),
      count: (items) => reg.count(items, difficulty),
      getExtra: (collectedKeys) => reg.getExtra(collectedKeys),
      enumerateVariants: (id, diff) => reg.enumerateVariants(id, diff),
      countVariants: (id, diff) => reg.countVariants(id, diff),
      identify: (input) => reg.identify(input as any),
      format: (id) => reg.format(id),
      findByKeyword: (word) => reg.findByKeyword(word),
      resolveTexture: (id) => reg.resolveTexture(id),
    });

    return [
      wrapWithDifficulty(this.allRegistry),
      this.registryCollection.getItem(),
      this.registryCollection.getBiome(),
      wrapWithDifficulty(this.registryCollection.getEntity()),
      wrapWithDifficulty(this.registryCollection.getEffect()),
      wrapWithDifficulty(this.registryCollection.getEnchantment()),
      this.registryCollection.getUnobtainable(),
    ];
  }

  show() {
    const collection = this.playerCollection.getCollection();
    const registries = this.getRegistries();
    const collectionForm = new CollectionFormData(this.createActionForm).title(
      `Collection - ${BOLD}${THEME[this.activeCategory as keyof typeof THEME] ?? ""}${capitalCase(this.activeCategory)}`
    );
    const buttons: Array<Parameters<typeof collectionForm.button>> = [];

    const totalCollected = registries.reduce((sum, reg) => {
      const prefixedKeys = Object.keys(collection[reg.key as keyof PlayerCollectionData] ?? {}).map(
        (k) => `${reg.key};${k}`
      );
      return sum + reg.count(prefixedKeys).collected;
    }, 0);
    const totalItems = registries.reduce((sum, reg) => sum + reg.all().length, 0);

    for (const reg of registries) {
      const prefixedKeys = Object.keys(collection[reg.key as keyof PlayerCollectionData] ?? {}).map(
        (k) => `${reg.key};${k}`
      );
      const { collected } = reg.count(prefixedKeys);
      const total = reg.all().length;
      buttons.push([
        { text: capitalCase(reg.key) },
        [{ text: `${GRAY}${collected}/${total}` }],
        reg.getIcon(),
        undefined,
        Math.floor((collected / total) * 100),
        reg.key,
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

    const registry = registries.find((r) => r.key === this.activeCategory);
    const formatRegistry = registry ?? this.allRegistry;
    const allItems = registry
      ? registry.all().map((id) => [id, registry] as const)
      : registries.flatMap((r) => r.all().map((id) => [id, r] as const));
    const thingsToShow = allItems.sort((a, b) => {
      const nameA = formatRegistry.format(a[0]);
      const nameB = formatRegistry.format(b[0]);
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
    });

    collectionForm.itemsCount(thingsToShow.length);
    const activeIndex = registries.findIndex((r) => r.key === registry?.key);
    if (activeIndex >= 0) {
      collectionForm.activeTab(activeIndex);
    }

    for (const [id, reg] of thingsToShow) {
      const texture = reg.resolveTexture(id);
      const name = reg.format(id);
      const key = reg.key as RegistryKey;
      const rawId = id.includes(";") ? id.split(";")[1] : id;
      const percentComplete = key === "all" ? 0 : this.playerCollection.hasCollected(key, rawId) ? 100 : 0;
      buttons.push([
        { text: name },
        [
          { text: `${ITALIC}${THEME[reg.key as keyof typeof THEME] ?? GRAY}${capitalCase(reg.key)}${RESET}` },
          { text: `${ITALIC}${GRAY}${rawId}` },
        ],
        texture ?? "textures/ui/降_alert",
        undefined,
        percentComplete,
        id,
      ]);
    }

    for (const button of buttons) {
      collectionForm.button(...button);
    }

    collectionForm
      .show(this.player)
      .then((result) => {
        if (result.canceled || result.selectedButtonValue === undefined || result.selectedButtonValue === null) {
          return;
        }

        const selection = result.selectedButtonValue as string;

        if (selection in this.actions) {
          this.actions[selection](selection);
        } else if (registries.some((r) => r.key === selection)) {
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
