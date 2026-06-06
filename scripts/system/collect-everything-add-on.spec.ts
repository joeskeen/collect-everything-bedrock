import { describe, it, expect, vitest } from "vitest";
import { CollectEverythingAddOn } from "./collect-everything-add-on";
import { PlayerManager } from "./player-manager";
import { Kinda } from "kinda-type";
import { CommandManager } from "./command-manager";

// TODO: this is just a stub for now to get the testing infrastructure set up
describe("CollectEverythingAddOn", () => {
  it("should be defined", () => {
    const fakePlayerManager = { run: vitest.fn() } as Kinda<PlayerManager> as PlayerManager;
    const fakeCommandManager = { run: vitest.fn() } as Kinda<CommandManager> as CommandManager;
    const addOn = new CollectEverythingAddOn(fakePlayerManager, fakeCommandManager);
    expect(addOn).toBeDefined();
  });
});
