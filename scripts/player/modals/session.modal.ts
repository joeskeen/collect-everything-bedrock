import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { PLAYER_SESSION_TOKEN, PLAYER_TOKEN, PlayerSession, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN } from "../../ui/ui.tokens";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME, UNOBTAINABLE } from "../collection-constants";
import { PlayerCollection } from "../player-collection";
import { capitalCase, timeAgo } from "../../shared/formatting";
import { GRAY, RESET } from "../../shared/format-codes";
import type { DDUI } from "../../ui/ui.tokens";
import { PlayerSettingsService } from "../player-settings";
import { AllRegistry } from "../../collections/all-registry";

@scoped(Lifecycle.ContainerScoped)
export class SessionModal {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(PLAYER_SESSION_TOKEN) private readonly playerSession: PlayerSession,
    @inject(PlayerSettingsService) private readonly playerSettingsService: PlayerSettingsService,
    @inject(AllRegistry) private readonly allRegistry: AllRegistry
  ) {}

  async show(): Promise<void> {
    const currentTick = this.system.currentTick;
    const difficulty = this.playerSettingsService.get().difficulty;
    const validIds = this.allRegistry.validIds(difficulty);

    type Entry = { what: string; tick: number };
    const collectionProgress: { category: string; collected: Entry[] }[] = [
      {
        category: BIOME,
        collected: Object.entries(this.collection.getCollection(BIOME))
          .filter(([, when]) => when > this.playerSession.startTick)
          .map(([what, tick]) => ({ what, tick })),
      },
      {
        category: ENTITY,
        collected: Object.entries(this.collection.getCollection(ENTITY))
          .filter(([, when]) => when > this.playerSession.startTick)
          .map(([what, tick]) => ({ what, tick })),
      },
      {
        category: ITEM,
        collected: Object.entries(this.collection.getCollection(ITEM))
          .filter(([, when]) => when > this.playerSession.startTick)
          .map(([what, tick]) => ({ what, tick })),
      },
      {
        category: EFFECT,
        collected: Object.entries(this.collection.getCollection(EFFECT))
          .filter(([, when]) => when > this.playerSession.startTick)
          .map(([what, tick]) => ({ what, tick })),
      },
      {
        category: ENCHANTMENT,
        collected: Object.entries(this.collection.getCollection(ENCHANTMENT))
          .filter(([, when]) => when > this.playerSession.startTick)
          .map(([what, tick]) => ({ what, tick })),
      },
      {
        category: UNOBTAINABLE,
        collected: Object.entries(this.collection.getCollection(UNOBTAINABLE))
          .filter(([, when]) => when > this.playerSession.startTick)
          .map(([what, tick]) => ({ what, tick })),
      },
    ];

    const totalCollected = collectionProgress.reduce((prev, curr) => prev + curr.collected.length, 0);

    const form = new this.ddui.CustomForm(this.player, `Recently Collected (${totalCollected})`);

    for (const progress of collectionProgress) {
      const sessionCollected = progress.collected.filter((entry) => validIds.has(`${progress.category};${entry.what}`));
      sessionCollected.sort((a, b) => {
        const nameA = this.allRegistry.format(`${progress.category};${a.what}`);
        const nameB = this.allRegistry.format(`${progress.category};${b.what}`);
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
      });
      if (sessionCollected.length > 0) {
        const lines = sessionCollected
          .map(
            (entry) =>
              `${GRAY}- ${RESET}${this.allRegistry.format(`${progress.category};${entry.what}`)} ${GRAY}(${timeAgo(entry.tick, currentTick)})${RESET}`
          )
          .join("\n");
        form.divider();
        form.label(
          `${THEME[progress.category]}${capitalCase(progress.category)}${RESET} ${GRAY}(${sessionCollected.length})${RESET}:\n${lines}`
        );
      }
    }
    form.divider();

    await form.show();
  }
}
