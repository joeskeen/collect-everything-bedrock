import { inject, singleton } from "tsyringe";
import type { Player } from "@minecraft/server";
import { DDUI, DDUI_TOKEN } from "../../ui/ui.tokens";
import { Logger } from "../../shared/logging/logger";
import { DifficultyLevel, WorldSettingsService } from "../player-settings";
import { CollectionScoreboard } from "../../system/scoreboard";

@singleton()
export class AdminSettingsModal {
  constructor(
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(WorldSettingsService) private readonly worldSettings: WorldSettingsService,
    @inject(Logger) private readonly logger: Logger,
    @inject(CollectionScoreboard) private readonly collectionScoreboard: CollectionScoreboard
  ) {}

  async show(player: Player): Promise<void> {
    const currentWorldDifficulty = this.worldSettings.getWorldDifficulty();
    const currentBroadcast = this.worldSettings.getBroadcastCollectionEvents();
    const options: (DifficultyLevel | undefined)[] = [undefined, "basic", "committed", "insane"];

    const selectedIndex = new this.ddui.ObservableNumber(
      currentWorldDifficulty ? options.indexOf(currentWorldDifficulty) : 0,
      { clientWritable: true }
    );

    const broadcastToggle = new this.ddui.ObservableBoolean(currentBroadcast, {
      clientWritable: true,
    });

    const currentDisplayScoreboard = this.worldSettings.getDisplayScoreboard();
    const displayScoreboardToggle = new this.ddui.ObservableBoolean(currentDisplayScoreboard, {
      clientWritable: true,
    });

    const form = new this.ddui.CustomForm(player, "Collect Everything! Admin Settings")
      .divider()
      .header("World Difficulty")
      .dropdown("Difficulty", selectedIndex, [
        {
          label: "Let the player decide",
          value: 0,
        },
        {
          label: "Basic",
          value: 1,
          description: "one of each thing by minecraft ID string (i.e. one horse)",
        },
        {
          label: "Committed",
          value: 2,
          description: "collect each variant *type* (i.e. each horse color and each horse pattern)",
        },
        {
          label: "Insane",
          value: 3,
          description:
            "collect each variant *combination* (i.e. each horse color/pattern combination)\n(warning: this includes 2000+ tropical fish combinations!)",
        },
      ])
      .spacer()
      .spacer()
      .divider()
      .header("Chat Notifications")
      .toggle("Broadcast collection events to chat", broadcastToggle)
      .spacer()
      .header("Scoreboard")
      .toggle("Display scoreboard", displayScoreboardToggle);

    try {
      await form.show();
      const difficulty = options[selectedIndex.getData()];
      this.worldSettings.setWorldDifficulty(difficulty);
      this.worldSettings.setBroadcastCollectionEvents(broadcastToggle.getData());
      this.worldSettings.setDisplayScoreboard(displayScoreboardToggle.getData());
      this.collectionScoreboard.syncDisplay();
    } catch (e) {
      this.logger.debug(e);
    }
  }
}
