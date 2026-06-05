import { describe, it, expect } from "vitest";
import { do_something } from "./main";

describe("main", () => {
  describe("do_something", () => {
    it("should do something", () => {
      expect(do_something()).toBe(true);
    });
  });
});