import { describe, it, expect } from "vitest";
import { CollectEverythingAddOn } from "./collect-everything-add-on";
import { fakeWorld } from "./testing/fake-world";
import { fakeSystem } from "./testing/fake-system";

// TODO: this is just a stub for now to get the testing infrastructure set up
describe("CollectEverythingAddOn", () => {
  it("should be defined", () => {
    const addOn = new CollectEverythingAddOn(fakeWorld(), fakeSystem());
    expect(addOn).toBeDefined();
  });
});
