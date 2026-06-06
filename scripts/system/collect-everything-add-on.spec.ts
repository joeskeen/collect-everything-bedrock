import { describe, it, expect, vitest } from "vitest";
import { CollectEverythingAddOn } from "./collect-everything-add-on";
import { fakeWorld } from "../testing/fake-world";
import { fakeSystem } from "../testing/fake-system";
import { PlayerManager } from "./player-manager";
import { Kinda } from "kinda-type";

// TODO: this is just a stub for now to get the testing infrastructure set up
describe("CollectEverythingAddOn", () => {
  it("should be defined", () => {
    const fakePlayerManager = {
      run: vitest.fn(),
    } as Kinda<PlayerManager> as PlayerManager;
    const addOn = new CollectEverythingAddOn(fakeWorld(), fakeSystem(), fakePlayerManager);
    expect(addOn).toBeDefined();
  });
});
