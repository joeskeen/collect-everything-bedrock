import { container } from "tsyringe";
import { ADD_ON_COMMANDS_TOKEN } from "../system/add-on-command";
import { debugDumpCommand } from "./dump.command";
import { world, system, Player, ItemStack, Block } from "@minecraft/server";
import { uiManager } from "@minecraft/server-ui";

export function registerDebugProviders() {
  container.registerInstance(ADD_ON_COMMANDS_TOKEN, debugDumpCommand);
}

world.afterEvents.itemUse.subscribe((e) => {
  if (e.itemStack.typeId === "collecteverything:checklist") {
    console.log("success!");
    (e.source as Player).playSound("block.click");
    (e.source as Player).runCommand("collecteverything:settings");
  } else {
    dumpItem(e.itemStack);
  }
});
world.afterEvents.playerPlaceBlock.subscribe((e) => {
  dumpItem(e.block);
});
world.afterEvents.playerInventoryItemChange.subscribe((e) => {
  if (e.itemStack) {
    dumpItem(e.itemStack);
  }
});

function dumpItem(item: ItemStack | Block) {
  console.log(item.typeId, item.getTags().join(", "), item.getComponent("minecraft:color2"), item.localizationKey);
}
