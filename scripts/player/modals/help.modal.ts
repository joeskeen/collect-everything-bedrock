import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN } from "../../ui/ui.tokens";
import { PlayerSettingsService } from "../player-settings";
import type { DDUI } from "../../ui/ui.tokens";

@scoped(Lifecycle.ContainerScoped)
export class HelpModal {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(PlayerSettingsService) private readonly playerSettings: PlayerSettingsService
  ) {}

  async show(): Promise<void> {
    const settings = this.playerSettings.get();

    const form = new this.ddui.CustomForm(this.player, "Collect Everything! Help")
      .label("Tracks your progress across multiple categories.")
      .divider()
      .label(
        `CATEGORIES:
• Items - picked up or equipped
• Entities - mobs killed, tamed, leashed, or named
• Biomes - discovered while exploring
• Enchantments - on equipped items
• Effects - currently active potions
• Unobtainables - special blocks broken`
      )
      .divider()
      .label(`CURRENT DIFFICULTY: ${settings.difficulty}\n${this.getDifficultyDescription(settings.difficulty)}`)
      .divider().label(`QUICK TIPS:
• Use the Checklist item to open the browser
• Try /collecteverything:stats for a quick overview
• Use /collecteverything:session to see what you've collected
• Change difficulty in Settings to track more or less variants`);

    await form.show();
  }

  private getDifficultyDescription(difficulty: string): string {
    switch (difficulty) {
      case "basic":
        return "One of each entity type";
      case "committed":
        return "Each variant tracked separately";
      case "insane":
        return "Every variant combination";
      default:
        return difficulty;
    }
  }
}
