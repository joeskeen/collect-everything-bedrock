import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { PLAYER_SESSION_TOKEN, PLAYER_TOKEN, PlayerSession, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN } from "../../ui/ui.tokens";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME, UNOBTAINABLE } from "../collection-constants";
import { PlayerCollection } from "../player-collection";
import { capitalCase } from "change-case";
import { formatId, timeAgo } from "../../shared/formatting";
import { GRAY, RESET } from "../../shared/format-codes";
import type { DDUI } from "../../ui/ui.tokens";

@scoped(Lifecycle.ContainerScoped)
export class SessionModal {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(PlayerCollection) private readonly collection: PlayerCollection,
    @inject(PLAYER_SESSION_TOKEN) private readonly playerSession: PlayerSession
  ) {}

  async show(): Promise<void> {
    const currentTick = this.system.currentTick;

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
      if (progress.collected.length > 0) {
        const lines = progress.collected
          .map(
            (entry) => `${GRAY}- ${RESET}${formatId(entry.what)} ${GRAY}(${timeAgo(entry.tick, currentTick)})${RESET}`
          )
          .join("\n");
        form.divider();
        form.label(
          `${THEME[progress.category]}${capitalCase(progress.category)}${RESET} ${GRAY}(${progress.collected.length})${RESET}:\n${lines}`
        );
      }
    }
    form.divider();

    await form.show();
  }
}
