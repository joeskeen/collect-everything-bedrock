import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player } from "@minecraft/server";
import { PLAYER_TOKEN } from "../../shared/global-tokens";
import { DifficultyLevel, PlayerSettingsService } from "../player-settings";
import { DDUI, DDUI_TOKEN } from "../../ui/ui.tokens";

export type SettingsFormResponses = [number];

@scoped(Lifecycle.ContainerScoped)
export class SettingsModal {
  constructor(
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerSettingsService) private readonly playerSettings: PlayerSettingsService,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI
  ) {}

  async show(): Promise<void> {
    const currentSettings = this.playerSettings.get();
    const options: DifficultyLevel[] = ["basic", "committed", "insane"];

    const difficulty = new this.ddui.ObservableNumber(options.indexOf(currentSettings.difficulty), {
      clientWritable: true,
    });

    const form = new this.ddui.CustomForm(this.player, "Collect Everything! Settings").dropdown(
      "Difficulty",
      difficulty,
      [
        {
          label: `Basic`,
          value: 0,
          description: `one of each thing by minecraft ID string (i.e. one horse)`,
        },
        {
          label: `Committed`,
          value: 1,
          description: `collect each variant *type* (i.e. each horse color and each horse pattern)`,
        },
        {
          label: `Insane`,
          value: 2,
          description: `collect each variant *combination* (i.e. each horse color/pattern combination)
              (warning: this includes 2000+ tropical fish combinations!)`,
        },
      ],
      { description: "Changes the collection goals." } as any
    );

    try {
      await form.show();
      const difficultyLevel = difficulty.getData();
      this.playerSettings.change({
        ...this.playerSettings.get(),
        difficulty: options[difficultyLevel],
      });
    } catch (e) {
      console.error(e);
    }
  }
}
