import { inject, Lifecycle, scoped } from "tsyringe";
import type { Player, System } from "@minecraft/server";
import { PLAYER_TOKEN, SYSTEM_TOKEN } from "../../shared/global-tokens";
import { DDUI_TOKEN } from "../../ui/ui.tokens";
import { COLLECTED_PREFIX, CollectedMetadata, PlayerCollectionData, THEME } from "../collection-constants";
import { PlayerCollection } from "../player-collection";
import { RegistryCollection } from "../../collections/index";
import { PlayerStorage } from "../../shared/storage";
import { BOLD, RESET } from "../../shared/format-codes";
import { capitalCase, collectionDay, timeAgo } from "../../shared/formatting";
import type { DDUI } from "../../ui/ui.tokens";

@scoped(Lifecycle.ContainerScoped)
export class DetailsModal {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(PLAYER_TOKEN) private readonly player: Player,
    @inject(DDUI_TOKEN) private readonly ddui: DDUI,
    @inject(PlayerCollection) private readonly playerCollection: PlayerCollection,
    @inject(RegistryCollection) private readonly registryCollection: RegistryCollection,
    @inject(PlayerStorage) private readonly playerStorage: PlayerStorage
  ) {}

  async show(id: string): Promise<void> {
    const [category, rawId] = id.includes(";") ? id.split(";") : ["", id];
    const registry = this.registryCollection.getByKey(category);
    const name = registry ? registry.format(id) : rawId;
    const collection = this.playerCollection.getCollection(category as keyof PlayerCollectionData);
    const collectedTick = collection[rawId] ?? undefined;

    const metadata = this.playerStorage.get<CollectedMetadata>(COLLECTED_PREFIX + id);

    let collectedText: string;
    if (collectedTick !== undefined && metadata) {
      collectedText =
        `${BOLD}First Collected:${RESET} Day ${collectionDay(metadata.collectedOnTick)} (${timeAgo(metadata.collectedOnTick, this.system.currentTick)})\n` +
        `${BOLD}Last Collected:${RESET} Day ${collectionDay(metadata.lastCollectedOnTick)} (${timeAgo(metadata.lastCollectedOnTick, this.system.currentTick)})\n` +
        `${BOLD}Times Collected:${RESET} ${metadata.collectedNTimes}`;
    } else {
      collectedText = `${BOLD}Not collected${RESET}`;
    }

    const form = new this.ddui.CustomForm(this.player, "Item Details")
      .label(
        `${BOLD}Name:${RESET} ${name}\n${BOLD}Type:${RESET} ${THEME[category] ?? ""}${capitalCase(category)}${RESET}\n${BOLD}ID:${RESET} ${rawId}`
      )
      .divider()
      .label(collectedText);

    await form.show();
  }
}
