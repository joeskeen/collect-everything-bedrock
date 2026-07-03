import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN } from "../../ui/ui.tokens";
import { PlayerCollectionData, THEME } from "../collection-constants";
import { PlayerCollection } from "../player-collection";
import { RegistryCollection } from "../../collections/index";
import { capitalCase } from "change-case";
import { BOLD, RESET } from "../../shared/format-codes";
import { collectionDay, timeAgo } from "../../shared/formatting";
import type { DDUI } from "../../ui/ui.tokens";

@scoped(Lifecycle.ContainerScoped)
export class DetailsModal {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(PlayerCollection) private readonly playerCollection: PlayerCollection,
    @inject(RegistryCollection) private readonly registryCollection: RegistryCollection
  ) {}

  async show(id: string): Promise<void> {
    const [category, rawId] = id.includes(";") ? id.split(";") : ["", id];
    const registry = this.registryCollection.getByKey(category);
    const name = registry ? registry.format(id) : rawId;
    const collection = this.playerCollection.getCollection(category as keyof PlayerCollectionData);
    const collectedTick = collection[rawId] ?? undefined;

    const collectedText =
      collectedTick !== undefined
        ? `${BOLD}Collected:${RESET} Day ${collectionDay(collectedTick)} (${timeAgo(collectedTick, this.system.currentTick)})`
        : `${BOLD}Collected:${RESET} Not collected`;

    const form = new this.ddui.CustomForm(this.player, "Item Details")
      .label(
        `${BOLD}Name:${RESET} ${name}\n${BOLD}Type:${RESET} ${THEME[category] ?? ""}${capitalCase(category)}${RESET}\n${BOLD}ID:${RESET} ${rawId}`
      )
      .divider()
      .label(collectedText);

    await form.show();
  }
}
