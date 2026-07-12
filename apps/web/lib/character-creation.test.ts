import { describe, expect, it } from "vitest";
import {
  getAttributeBudget,
  getAttributeCap,
  getAvailablePaths,
  getNexOptions,
  normalizeAttributes,
} from "./character-creation";

describe("character creation helpers", () => {
  it("keeps the terminal 99% NEX option while using the catalog step", () => {
    expect(getNexOptions({ min: 5, max: 99, step: 5 })).toEqual([
      5, 10, 15, 20, 25, 30, 35, 40, 45, 50,
      55, 60, 65, 70, 75, 80, 85, 90, 95, 99,
    ]);
    expect(getNexOptions({ min: 5, max: 99, step: 5 })).not.toContain(100);
  });

  it("does not show a path before the API catalog says it is available", () => {
    const paths = [{ slug: "especialista", name: "Especialista", minNex: 10 }];

    expect(getAvailablePaths(paths, 5)).toEqual([]);
    expect(getAvailablePaths(paths, 10)).toEqual(paths);
  });

  it.each([
    [5, 9, 3],
    [19, 9, 3],
    [20, 10, 4],
    [49, 10, 4],
    [50, 11, 5],
    [79, 11, 5],
    [80, 12, 5],
    [94, 12, 5],
    [95, 13, 5],
    [99, 13, 5],
  ])("uses the base 1.3 NEX limits at %i%%", (nex, budget, cap) => {
    expect(getAttributeBudget(nex)).toBe(budget);
    expect(getAttributeCap(nex)).toBe(cap);
  });

  it("normalizes attributes after lowering NEX", () => {
    expect(normalizeAttributes({ agility: 5, strength: 4, intellect: 4, presence: 0, vigor: 0 }, 5)).toEqual({
      agility: 3,
      strength: 3,
      intellect: 3,
      presence: 0,
      vigor: 0,
    });
  });
});
