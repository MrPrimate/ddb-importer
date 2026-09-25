// @vitest-environment jsdom
import DDBDescriptions from "../../../src/parser/lib/DDBDescriptions";

// =============================================================================
// parseDamageParts - lifted verbatim out of DDBItem so a per-section scan and
// the whole-description scan stay one implementation.
// =============================================================================
describe("DDBDescriptions.parseDamageParts", () => {
  it("reads a save's damage as the main part", () => {
    const { parts, otherParts } = DDBDescriptions.parseDamageParts(
      "<p>make a DC 15 Constitution saving throw, taking 22 (4d10) cold damage on a failed save.</p>",
    );

    expect(otherParts).toHaveLength(0);
    expect(parts).toHaveLength(1);
    expect(parts[0].number).toBe(4);
    expect(parts[0].denomination).toBe(10);
    expect(parts[0].types).toEqual(["cold"]);
  });

  it("splits an ongoing start-of-turn tick into otherParts", () => {
    const { parts, otherParts } = DDBDescriptions.parseDamageParts(
      "taking 22 (4d10) acid damage on a failed save. A creature takes 11 (2d10) acid damage at the start of each of its turns.",
    );

    expect(parts).toHaveLength(1);
    expect(otherParts).toHaveLength(1);
    expect(otherParts[0].number).toBe(2);
  });

  it("returns nothing for text with no damage", () => {
    expect(DDBDescriptions.parseDamageParts("A perfectly ordinary hat.")).toEqual({ parts: [], otherParts: [] });
  });
});
