import { container } from "tsyringe";
import { ADD_ON_COMMANDS_TOKEN } from "../system/add-on-command";
import { debugDumpCommand } from "./dump.command";
import { Player, system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

export function registerDebugProviders() {
  container.registerInstance(ADD_ON_COMMANDS_TOKEN, debugDumpCommand);
}

// system.

// system.run(() => {
//   const ui = new ActionFormData().title("Form").body("").button("button1").button("button2").button("button3");

//   const customUi = new ActionFormData()
//     .title("Custom form")
//     .body("")
//     .button("button1")
//     .button("button2")
//     .button("button3");

//   const message = new MessageFormData().title("test").body("hello").button1("x?").button2("null");

//   const modalForm = new ModalFormData()
//     .title("modal form example")
//     .toggle("toggle?")
//     .toggle("toggle? (yes)", { defaultValue: true, tooltip: "please do not change this" })
//     .dropdown("choose", ["option 1", "option 2", "option 3"])
//     .dropdown("choose?", ["option 1", "option 2", "option 3"], {
//       defaultValueIndex: 2,
//       tooltip: "I already chose for you",
//     })
//     .textField("freeform", "")
//     .textField("opinionated", "", { defaultValue: "this is cool", tooltip: "yeah it is" });

//   world.afterEvents.itemUse.subscribe((event) => {
//     const { source, itemStack } = event;
//     switch (itemStack.typeId) {
//       case "minecraft:compass":
//         ui.show(source);
//         break;
//       case "minecraft:clock":
//         customUi.show(source);
//         break;
//       case "minecraft:nether_star":
//         message.show(source);
//         break;
//       case "minecraft:echo_shard":
//         modalForm.show(source).then((x) => source.sendMessage(JSON.stringify(x.formValues)));
//         break;
//     }
//   });
// });
