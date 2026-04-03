vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));
vi.mock("../../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class DDBMonsterFeature {},
}));

import DDBMonsterFeatureFactory from "../../../src/parser/monster/features/DDBMonsterFeatureFactory";

// =============================================================================
// replaceRollable — removes [rollable]...[/rollable] tags, keeps content
// =============================================================================
describe("DDBMonsterFeatureFactory.replaceRollable", () => {
  it("removes rollable tags keeping content before semicolon", () => {
    const input = '[rollable]2d6;{"diceNotation":"2d6","diceValue":7}[/rollable] fire damage';
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe("2d6 fire damage");
  });

  it("greedy match: multiple rollable tags collapse to first content", () => {
    // The regex is greedy (.*), so it matches from first ; to last [/rollable]
    const input = '[rollable]1d8;meta1[/rollable] plus [rollable]2d6;meta2[/rollable] damage';
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe("1d8 damage");
  });

  it("returns unchanged text with no rollable tags", () => {
    const input = "Melee Weapon Attack: +5 to hit, reach 5 ft.";
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe(input);
  });

  it("handles complex dice expression before semicolon", () => {
    const input = '[rollable]3d8 + 5;{"diceNotation":"3d8+5","total":18}[/rollable] bludgeoning damage';
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe("3d8 + 5 bludgeoning damage");
  });

  it("returns empty string for empty input", () => {
    expect(DDBMonsterFeatureFactory.replaceRollable("")).toBe("");
  });
});

// =============================================================================
// namePassMatch — detects dice ranges and spell frequency prefixes
// =============================================================================
describe("DDBMonsterFeatureFactory.namePassMatch", () => {
  it("matches en-dash dice range '1–2'", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("1–2")).toBe(true);
  });

  it("matches minus sign dice range '3−5' (U+2212)", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("3\u22125")).toBe(true);
  });

  it("matches 'At will:' prefix", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("At will: dancing lights")).toBe(true);
  });

  it("matches '3/Day' prefix (case insensitive)", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("3/Day each")).toBe(true);
  });

  it("does not match normal feature name", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("Multiattack")).toBe(false);
  });

  it("does not match name with parenthetical recharge", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("Fire Breath (Recharge 5-6)")).toBe(false);
  });
});

// =============================================================================
// splitName — extracts action name from concatenated formats
// =============================================================================
describe("DDBMonsterFeatureFactory.splitName", () => {
  it("returns name unchanged when no semicolons", () => {
    expect(DDBMonsterFeatureFactory.splitName("Multiattack", "Multiattack. The dragon makes three attacks."))
      .toBe("Multiattack");
  });

  it("returns last segment after semicolon", () => {
    expect(DDBMonsterFeatureFactory.splitName("Legendary Resistance; 3/Day", ""))
      .toBe("3/Day");
  });

  it("keeps full name when first segment has open paren without close", () => {
    expect(DDBMonsterFeatureFactory.splitName("Bite (costs 2 actions; Recharge 5-6)", ""))
      .toBe("Bite (costs 2 actions; Recharge 5-6)");
  });

  it("returns nodeText first sentence for 'Spell;' prefix", () => {
    expect(DDBMonsterFeatureFactory.splitName("Spell; Shield", "Shield. The creature casts Shield."))
      .toBe("Shield");
  });

  it("returns trimmed name for 'Psionics;' prefix", () => {
    expect(DDBMonsterFeatureFactory.splitName("Psionics; Mind Blast", ""))
      .toBe("Psionics; Mind Blast");
  });

  it("returns trimmed name for 'Mythic Trait;' prefix", () => {
    expect(DDBMonsterFeatureFactory.splitName("Mythic Trait; Phoenix Rebirth", ""))
      .toBe("Mythic Trait; Phoenix Rebirth");
  });
});
