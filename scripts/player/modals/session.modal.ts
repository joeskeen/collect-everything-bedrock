import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { PLAYER_SESSION_TOKEN, PLAYER_TOKEN, PlayerSession, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN } from "../../ui/ui.tokens";
import { BIOME, EFFECT, ENCHANTMENT, ENTITY, ITEM, THEME, UNOBTAINABLE } from "../collection-constants";
import { PlayerCollection } from "../player-collection";
import { capitalCase } from "change-case";
import { formatId } from "../../shared/formatting";
import { RESET } from "../../shared/format-codes";
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
    const collection = this.collection.getCollection();
    const collectionProgress = [
      {
        category: BIOME,
        collected: Object.entries(collection[BIOME])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
      {
        category: ENTITY,
        collected: Object.entries(collection[ENTITY])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
      {
        category: ITEM,
        collected: Object.entries(collection[ITEM])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
      {
        category: EFFECT,
        collected: Object.entries(collection[EFFECT])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
      {
        category: ENCHANTMENT,
        collected: Object.entries(collection[ENCHANTMENT])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
      {
        category: UNOBTAINABLE,
        collected: Object.entries(collection[UNOBTAINABLE])
          .filter(([_what, when]) => when > this.playerSession.startTick)
          .map(([what]) => what),
      },
    ];

    const totalCollected = collectionProgress.reduce((prev, curr) => prev + curr.collected.length, 0);

    const form = new this.ddui.CustomForm(this.player, `Recently Collected (${totalCollected})`);

    for (const progress of collectionProgress) {
      if (progress.collected.length > 0) {
        form.divider();
        form.label(
          `${THEME[progress.category]}${capitalCase(progress.category)}${RESET}(${progress.collected.length}): ${progress.collected.map(formatId).join(", ")}`
        );
      }
    }

    await form.show();
  }
}
