import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, CustomCommandResult, CustomCommandOrigin, System } from "@minecraft/server";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DifficultyLevel, PlayerSettingsService } from "../player-settings";
import { DDUI, DDUI_TOKEN } from "../../ui/ui.tokens";

export type SettingsFormResponses = [number];

@scoped(Lifecycle.ContainerScoped)
export class PlayerSettingsCommand implements CommandHandler {
  constructor(
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerSettingsService) private readonly playerSettings: PlayerSettingsService,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI
  ) {}

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    this.system.run(() => {
      const currentSettings = this.playerSettings.get();
      const options: DifficultyLevel[] = ["basic", "committed", "insane"];

      const difficulty = new this.ddui.ObservableNumber(options.indexOf(currentSettings.difficulty), {
        clientWritable: true,
      });

      new this.ddui.CustomForm(this.player, "Collect Everything! Settings")
        .divider()
        .dropdown(
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
        )
        .divider()
        .show()
        .then((x) => {
          const difficultyLevel = difficulty.getData();
          this.playerSettings.change({
            difficulty: options[difficultyLevel],
          });
        })
        .catch((e) => {
          console.error(e);
        });
    });

    return { status: customCommandStatuses.Success };
  }
}

export const playerSettingsCommand = addOnCommand({
  name: "settings",
  description: "configure collection preferences",
  handlerClass: PlayerSettingsCommand,
});
