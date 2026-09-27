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

// =============================================================================
// Damage aimed at objects, and each save's own damage in text naming several
// =============================================================================
describe("DDBDescriptions object damage and per-save damage", () => {
  it("ignores damage dealt to structures or objects", () => {
    const { parts } = DDBDescriptions.parseDamageParts(
      "<p>The blast deals 50 fire damage to all structures in the area. Each creature must make a DC 14 Dexterity saving throw, taking 9 (2d8) fire damage on a failed save.</p>",
    );
    expect(parts.map((part) => `${part.number}d${part.denomination}`)).toEqual(["2d8"]);
  });

  it("reads each save's damage from its own sentences, bounded by the paragraph", () => {
    const html = [
      "<p>Each creature must succeed on a DC 14 Wisdom saving throw or be frightened. A creature near the rubble must make a DC 14 Dexterity saving throw, taking 7 (2d6) bludgeoning damage on a failed save.</p>",
      "<p><strong>Next Effect.</strong> Stones fall for 9 (2d8) damage. Each creature must succeed on a DC 14 Strength saving throw or be knocked prone.</p>",
    ].join("");
    const texts = DDBDescriptions.saveDamageTexts(html);
    const damage = (key: string) => DDBDescriptions.saveOwnDamageParts(texts.get(key) ?? "")
      .map((part) => `${part.number}d${part.denomination}`);
    expect(damage("|14|wis")).toEqual([]);
    expect(damage("|14|dex")).toEqual(["2d6"]);
    // the next paragraph's damage comes before its own save and belongs to neither
    expect(damage("|14|str")).toEqual([]);
  });

  it("falls back to a save's start-of-turn damage when it deals nothing on the failed save", () => {
    const text = "DC 15 Dexterity saving throw or be swallowed. A swallowed creature takes 10 (3d6) acid damage at the start of each of the monster's turns.";
    expect(DDBDescriptions.saveOwnDamageParts(text).map((part) => `${part.number}d${part.denomination}`)).toEqual(["3d6"]);
  });
});

describe("DDBDescriptions.saveScopes", () => {
  it("splits each save's sentence from the lead-in since the previous save", () => {
    const scopes = DDBDescriptions.saveScopes(
      "<p>A cloud fills a 20-foot-radius sphere. It spreads around corners. Each creature in it must make a DC 15 Constitution saving throw. "
      + "The ceiling collapses above one creature. The creature must succeed on a DC 15 Dexterity saving throw or be buried.</p>",
    );
    expect(scopes.get("|15|con")).toEqual({
      sentence: "Each creature in it must make a DC 15 Constitution saving throw.",
      lead: ["A cloud fills a 20-foot-radius sphere.", "It spreads around corners."],
    });
    expect(scopes.get("|15|dex")).toEqual({
      sentence: "The creature must succeed on a DC 15 Dexterity saving throw or be buried.",
      lead: ["The ceiling collapses above one creature."],
    });
  });
});
