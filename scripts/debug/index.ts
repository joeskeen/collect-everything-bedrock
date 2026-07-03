import { container } from "tsyringe";
import { ADD_ON_COMMANDS_TOKEN } from "../system/add-on-command";
import { debugSettingsCommand } from "../system/debug-commands/debug-settings.command";
// import { world, Player, ItemStack, Block, system } from "@minecraft/server";
// import { EntityRegistry } from "../collections/entity/entity.registry";
// import { EffectRegistry } from "../collections/effect/effect.registry";

export function registerDebugProviders() {
  container.registerInstance(ADD_ON_COMMANDS_TOKEN, debugSettingsCommand);
}

// system.run(() => {
//   system.afterEvents.scriptEventReceive.subscribe((e) => {
//     console.log(
//       "script event received",
//       JSON.stringify({
//         id: e.id,
//         initiator: e.initiator?.id,
//         message: e.message,
//         sourceBlock: e.sourceBlock?.typeId,
//         sourceEntity: e.sourceEntity?.id,
//         sourceType: e.sourceType,
//       })
//     );
//   });
//   system.runTimeout(() => system.sendScriptEvent("collecteverything:test", "does this work?"), 100);
//   world.afterEvents.itemUse.subscribe((e) => {
//     if (e.itemStack.typeId === "collecteverything:checklist") {
//       // console.log("success!");
//       (e.source as Player).playSound("block.click");
//       (e.source as Player).runCommand("collecteverything:browse");
//     } else {
//       // dumpItem(e.itemStack);
//     }
//   });
//   world.afterEvents.playerPlaceBlock.subscribe((e) => {
//     // dumpItem(e.block);
//   });
//   world.afterEvents.playerInventoryItemChange.subscribe((e) => {
//     if (e.itemStack) {
//       // dumpItem(e.itemStack);
//     }
//   });
//   world.afterEvents.playerInteractWithEntity.subscribe((e) => {
//     // console.log("interacted");
//     // world.sendMessage(
//     //   `[${e.target.typeId}]\n${e.target
//     //     .getComponents()
//     //     .map((c) => `${c.typeId.replace("minecraft:", "c.")}:${(e.target.getComponent(c.typeId) as any)?.value ?? ""}`)
//     //     .join("\n")}\n
//     //     p.climate_variant: ${e.target.getProperty("minecraft:climate_variant")}
//     //     p.oxidation_level: ${e.target.getProperty("minecraft:oxidation_level")}
//     //     p.is_waxed: ${e.target.getProperty("minecraft:is_waxed")}
//     //     p.variant: ${e.target.getProperty("minecraft:variant")}
//     //     `
//     // );
//   });
// });

// function dumpItem(item: ItemStack | Block) {
//   console.log(item.typeId, item.getTags().join(", "), item.getComponent("minecraft:color2"), item.localizationKey);
// }

// system.run(() => {
//   // console.log(container.resolve(EffectRegistry).allEffects().sort().join("\n"));
// });
