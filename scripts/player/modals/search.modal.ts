import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player } from "@minecraft/server";
import { PLAYER_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN, DDUI } from "../../ui/ui.tokens";

@scoped(Lifecycle.ContainerScoped)
export class SearchModal {
  constructor(
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI
  ) {}

  async show(currentSearch: string): Promise<string> {
    const searchText = new this.ddui.ObservableString(currentSearch || "", { clientWritable: true });
    let result: string | undefined = currentSearch;
    const form = new this.ddui.CustomForm(this.player, "Search Collection")
      .textField("Search for...", searchText, {
        description: "Enter keywords...",
      })
      .button("Search", () => {
        result = searchText.getData().trim();
        form.close();
      })
      .divider()
      .spacer();
    await form.show();
    return result;
  }
}
