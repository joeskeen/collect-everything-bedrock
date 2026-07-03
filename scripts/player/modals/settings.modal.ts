import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player } from "@minecraft/server";
import { PLAYER_TOKEN } from "../../shared/global-tokens";
import { DifficultyLevel, PlayerSettingsService, WorldSettingsService } from "../player-settings";
import { DDUI, DDUI_TOKEN } from "../../ui/ui.tokens";
import { Logger } from "../../shared/logging/logger";
import { DARK_RED, RESET } from "../../shared/format-codes";

export type SettingsFormResponses = [number];

@scoped(Lifecycle.ContainerScoped)
export class SettingsModal {
  constructor(
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(PlayerSettingsService) private readonly playerSettings: PlayerSettingsService,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(Logger) private readonly logger: Logger,
    @inject(WorldSettingsService) private readonly worldSettings: WorldSettingsService
  ) {}

  async show(): Promise<void> {
    const currentSettings = this.playerSettings.get();
    const options: DifficultyLevel[] = ["basic", "committed", "insane"];
    const worldDifficulty = this.worldSettings.getWorldDifficulty();

    const difficulty = new this.ddui.ObservableNumber(options.indexOf(currentSettings.difficulty), {
      clientWritable: true,
    });

    const form = new this.ddui.CustomForm(this.player, "Collect Everything! Settings").divider();

    if (worldDifficulty) {
      form.spacer();
      form.header("Difficulty");
      form.spacer();
      const labels: Record<DifficultyLevel, string> = {
        basic: `Basic: one of each thing by minecraft ID string (i.e. one horse)`,
        committed: `Committed: collect each variant *type* (i.e. each horse color and each horse pattern)`,
        insane: `Insane: collect each variant *combination* (i.e. each horse color/pattern combination)\n(warning: this includes 2000+ tropical fish combinations!)`,
      };
      form.label(labels[worldDifficulty]);
      form.spacer();
      form.label(`${DARK_RED}This setting is controlled by the server administrator${RESET}`);
    } else {
      form.dropdown(
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
    }

    form.spacer().spacer().divider();

    try {
      await form.show();
      if (!worldDifficulty) {
        const difficultyLevel = difficulty.getData();
        this.playerSettings.change({
          ...this.playerSettings.get(),
          difficulty: options[difficultyLevel],
        });
      }
    } catch (e) {
      this.logger.debug(e);
    }
  }
}
