import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { CREATE_ACTION_FORM_TOKEN, CreateActionFormFn, PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { Logger } from "../../shared/logging/logger";
import { SearchModal } from "./search.modal";
import { THEME, PlayerCollectionData, RegistryKey } from "../collection-constants";
import { RegistryCollection } from "../../collections/index";
import { AllRegistry } from "../../collections/all-registry";
import { PlayerCollection } from "../player-collection";
import { CollectionFormData } from "../../ui/forms";
import type { Thing } from "../../collections/registry";
import { capitalCase, percent } from "../../shared/formatting";
import { BOLD, GRAY, ITALIC, RESET } from "../../shared/format-codes";
import { PlayerSettingsService } from "../player-settings";
import { SettingsModal } from "./settings.modal";
import { HelpModal } from "./help.modal";
import { SessionModal } from "./session.modal";
import { DetailsModal } from "./details.modal";
import { UNKNOWN_TEXTURE } from "../../ui/shared-textures";

const GRID_ROW_LENGTH = 17;

@scoped(Lifecycle.ContainerScoped)
export class BrowserModal {
  private previousCategory: string = "all";
  private readonly actions: Record<string, (id: string) => void | Promise<void>> = {
    category: (id) => {
      this.playerSettingsService.change({ ...this.playerSettingsService.get(), activeCategory: id });
      this.system.run(() => this.show());
    },
    search: async () => {
      const { activeCategory } = this.playerSettingsService.get();
      const currentSearch = activeCategory.startsWith("search:") ? activeCategory.slice("search:".length) : "";
      const text = await this.searchModal.show(currentSearch);
      if (text) {
        this.playerSettingsService.change({ ...this.playerSettingsService.get(), activeCategory: `search:${text}` });
      } else {
        const fallback = this.previousCategory.startsWith("search:") ? "all" : this.previousCategory;
        this.playerSettingsService.change({ ...this.playerSettingsService.get(), activeCategory: fallback });
      }
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
      this.system.run(async () => {
        await this.detailsModal.show(id);
        this.show();
      });
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
    @inject(SearchModal) private readonly searchModal: SearchModal,
    @inject(SettingsModal) private readonly settingsModal: SettingsModal,
    @inject(HelpModal) private readonly helpModal: HelpModal,
    @inject(SessionModal) private readonly sessionModal: SessionModal,
    @inject(DetailsModal) private readonly detailsModal: DetailsModal,
    @inject(Logger) private readonly logger: Logger
  ) {}

  show() {
    const { difficulty, activeCategory } = this.playerSettingsService.get();
    const registries = this.registryCollection.registries;
    const isSearch = activeCategory.startsWith("search:");

    if (!isSearch) {
      this.previousCategory = activeCategory;
    }

    let title: string;
    let thingsToShow: Thing[];

    if (isSearch) {
      const keywords = activeCategory.slice("search:".length);
      const wordList = keywords.toLowerCase().split(/\s+/).filter(Boolean);
      thingsToShow = this.allRegistry
        .all(difficulty)
        .filter((thing) => wordList.every((word) => thing.displayName.toLowerCase().includes(word)));
      title = `Collection - ${BOLD}"${keywords}"`;
    } else {
      const registry = registries.find((r) => r.key === activeCategory);
      thingsToShow = registry ? registry.all(difficulty) : this.allRegistry.all(difficulty);
      title = `Collection - ${BOLD}${THEME[activeCategory as keyof typeof THEME] ?? ""}${capitalCase(activeCategory)}`;
    }

    const collectionForm = new CollectionFormData(this.createActionForm, this.logger).title(title);
    const buttons: Array<Parameters<typeof collectionForm.button>> = [];

    for (const reg of registries) {
      const collection = this.playerCollection.getCollection(reg.key as keyof PlayerCollectionData);
      const prefixedKeys = Object.keys(collection ?? {}).map((k) => `${reg.key};${k}`);
      const { collected, total } = reg.count(prefixedKeys, difficulty);
      buttons.push([
        capitalCase(reg.key),
        [`${GRAY}${collected}/${total} (${percent(collected, total, false)})`],
        reg.getIcon(),
        undefined,
        Math.floor((collected / total) * 100),
        reg.key,
      ]);
    }

    buttons.push(["Search", [], "", undefined, undefined, "search"]);
    buttons.push(["Recent", [], "", undefined, undefined, "recent"]);
    buttons.push(["Settings", [], "", undefined, undefined, "settings"]);
    buttons.push(["Help", [], "", undefined, undefined, "help"]);
    const filler: Parameters<typeof collectionForm.button> = ["", [], "", undefined, undefined, undefined];
    while (buttons.length < GRID_ROW_LENGTH) {
      buttons.push(filler);
    }

    collectionForm.itemsCount(thingsToShow.length);
    if (isSearch) {
      const searchIndex = buttons.findIndex((b) => b[0] === "Search");
      if (searchIndex >= 0) {
        collectionForm.activeTab(searchIndex);
      }
    } else {
      const registry = registries.find((r) => r.key === activeCategory);
      const activeIndex = registries.findIndex((r) => r.key === registry?.key);
      if (activeIndex >= 0) {
        collectionForm.activeTab(activeIndex);
      }
    }

    for (const { id, displayName, texture, registry: reg } of thingsToShow) {
      const [categoryKey, rawId] = id.includes(";") ? id.split(";") : [reg.key, id];
      const collected = this.playerCollection.hasCollected(categoryKey as keyof PlayerCollectionData, rawId);
      const percentComplete = collected ? 100 : 0;
      buttons.push([
        displayName,
        [
          `${ITALIC}${THEME[categoryKey as keyof typeof THEME] ?? GRAY}${capitalCase(categoryKey)}${RESET}`,
          collected ? "Collected" : "Not Collected",
        ],
        texture ?? UNKNOWN_TEXTURE,
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
        this.logger.debug("error", err);
      });
  }
}
