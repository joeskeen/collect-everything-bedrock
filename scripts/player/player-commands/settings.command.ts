import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, customCommandStatuses } from "../../system/add-on-command";
import type { Player, CustomCommandResult, CustomCommandOrigin, System } from "@minecraft/server";
import { CREATE_FORM_TOKEN, CreateFormFn, PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { BOLD, ITALIC, MATERIAL_COPPER, MATERIAL_GOLD, MATERIAL_IRON, RED, RESET } from "../../shared/format-codes";
import { DifficultyLevel, PlayerSettingsService } from "../player-settings";
import { capitalCase } from "change-case";

export type SettingsFormResponses = [number];

@scoped(Lifecycle.ContainerScoped)
export class PlayerSettingsCommand implements CommandHandler {
  constructor(
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(CREATE_FORM_TOKEN) private readonly createForm: CreateFormFn,
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PlayerSettingsService) private readonly playerSettings: PlayerSettingsService
  ) {}

  handleCommand(event: CustomCommandOrigin, args: any[]): CustomCommandResult {
    this.system.run(() => {
      const currentSettings = this.playerSettings.get();
      const options: DifficultyLevel[] = ["basic", "committed", "insane"];
      const form = this.createForm()
        .title("Collect Everything! Personal Settings")
        .dropdown(
          "Collection Difficulty",
          options.map((o) => capitalCase(o)),
          {
            defaultValueIndex: options.indexOf(currentSettings.difficulty),
            tooltip: `Changes the collection goals.
${BOLD}${MATERIAL_COPPER}Basic${RESET}: one of each thing by minecraft ID string ${ITALIC}(i.e. one horse)${RESET}
${BOLD}${MATERIAL_IRON}Committed${RESET}: collect each variant type ${ITALIC}(i.e. each horse color and each horse pattern)${RESET}
${BOLD}${MATERIAL_GOLD}Insane${RESET}: collect each variant combination ${ITALIC}(i.e. each horse color/pattern combination)${RESET}
${RED}${ITALIC}(${BOLD}warning${RESET}${RED}: this includes 2000+ tropical fish combinations!)${RESET}`,
          }
        );
      form.show(this.player).then((response) => {
        if (response.canceled) {
          return;
        }
        const [difficultyLevel] = response.formValues as SettingsFormResponses;
        this.playerSettings.change({
          difficulty: options[difficultyLevel],
        });
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
