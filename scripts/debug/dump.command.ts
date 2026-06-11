import { inject, Lifecycle, scoped } from "tsyringe";
import { addOnCommand, CommandHandler, commandPermissionLevels, customCommandStatuses } from "../system/add-on-command";
import type { CustomCommandOrigin, CustomCommandResult, Player, System, World } from "@minecraft/server";
import { SYSTEM_TOKEN, WORLD_TOKEN } from "../shared/global-tokens";
import { BOLD, RESET } from "../shared/format-codes";

@scoped(Lifecycle.ContainerScoped)
export class DebugDumpCommand implements CommandHandler {
  constructor(
    @inject(SYSTEM_TOKEN) private readonly system: System,
    @inject(WORLD_TOKEN) private readonly world: World
  ) {}

  handleCommand(event: CustomCommandOrigin): CustomCommandResult {
    if (event.sourceType !== "Entity" && event.sourceEntity!.typeId !== "minecraft:player") {
      return { message: "this command can only be called by a player entity", status: customCommandStatuses.Failure };
    }
    this.system.run(() => {
      const player = event.sourceEntity as Player;
      const standingOn = player.getBlockStandingOn();
      const inventory = player.getComponent("minecraft:inventory");
      const inHand = inventory?.container.getSlot(player.selectedSlotIndex).getItem();
      const components = inHand
        ?.getComponents()
        .filter((c) => c.isValid)
        .map((c) => [c.typeId, JSON.stringify(inHand.getComponent(c.typeId)?.customComponentParameters?.params)]);
      const dynamicProperties = inHand?.getDynamicPropertyIds().map((id) => [id, inHand.getDynamicProperty(id)]);
      const tags = inHand?.getTags();
      // const structures = this.world.structureManager.getWorldStructureIds();
      // const sampleStructureId = structures.find((s) => this.world.structureManager.get(s)?.isValid);
      // const sampleStructure = this.world.structureManager.get(sampleStructureId ?? "");
      // const currentStructure = this.world.structureManager.get(
      //   structures.find((s) => this.world.structureManager.get(s)?.getBlockPermutation(player.location)) ?? ""
      // );
      this.world.scoreboard.addObjective("collecteverything", "Collect Everything!");
      // this.world.scoreboard.

      const messageLines: string[] = [
        `${BOLD}__dump command${RESET}`,
        `originated from ${player.name} ${player.id}`,
        `player permission level: ${player.playerPermissionLevel}`,
        `command permission level: ${player.commandPermissionLevel}`,
        `game mode: ${player.getGameMode()}`,
        `${BOLD}block standing on${RESET}`,
        `typeId: ${standingOn?.typeId}`,
        `${BOLD}location${RESET}`,
        `dimension: ${standingOn?.dimension.id}`,
        `location: ${player.location.x}, ${player.location.y}, ${player.location.z}`,
        `rotation: ${player.getRotation().x}, ${player.getRotation().y}`,
        `biome: ${standingOn?.dimension.getBiome(player.location).id}`,
        `${BOLD}in hand${RESET}`,
        `typeId: ${inHand?.typeId}`,
        `type.id: ${inHand?.type.id}`,
        `type.localizationKey: ${inHand?.type.localizationKey}`,
        `components: \n- ${components?.map(([id, data]) => `${id} = ${data}`).join("\n- ")}`,
        `dynamic properties: \n- ${dynamicProperties?.map(([id, data]) => `${id} = ${data}`).join("\n- ")}`,
        `tags: \n- ${tags?.join("\n- ")}`,
        `nametag: ${inHand?.nameTag}`,
        `${BOLD}world${RESET}`,
        `dynamic property IDs: \n- ${this.world.getDynamicPropertyIds().join("\n- ")}`,
        // `${BOLD}structures${RESET}`,
        // ` - ${structures.sort().join("\n - ")}`,
        // `${BOLD}sample structure${RESET}`,
        // `id: ${sampleStructure?.id}`,
        // `size: ${sampleStructure?.size.x}, ${sampleStructure?.size.y}, ${sampleStructure?.size.z}`,
        // `${BOLD}current structure${RESET}`,
        // `id: ${currentStructure?.id}`,
        // `size: ${currentStructure?.size.x}, ${currentStructure?.size.y}, ${currentStructure?.size.z}`,
        // `${sampleStructure.}`
      ];
      this.world.sendMessage(messageLines.join("\n"));
    });
    return { status: customCommandStatuses.Success };
  }
}

export const debugDumpCommand = addOnCommand({
  name: "__dump",
  description: "dump information about current state",
  handlerClass: DebugDumpCommand,
  permissionLevel: commandPermissionLevels.Admin,
});
