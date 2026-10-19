vi.mock("../../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class DDBMonsterFeature {},
}));

import DDBMonsterFeatureFactory from "../../../src/parser/monster/features/DDBMonsterFeatureFactory";

// =============================================================================
// replaceRollable - removes [rollable]...[/rollable] tags, keeps content
// =============================================================================
describe("DDBMonsterFeatureFactory.replaceRollable", () => {
  it("removes rollable tags keeping content before semicolon", () => {
    const input = "[rollable]2d6;{\"diceNotation\":\"2d6\",\"diceValue\":7}[/rollable] fire damage";
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe("2d6 fire damage");
  });

  it("greedy match: multiple rollable tags collapse to first content", () => {
    // The regex is greedy (.*), so it matches from first ; to last [/rollable]
    const input = "[rollable]1d8;meta1[/rollable] plus [rollable]2d6;meta2[/rollable] damage";
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe("1d8 damage");
  });

  it("returns unchanged text with no rollable tags", () => {
    const input = "Melee Weapon Attack: +5 to hit, reach 5 ft.";
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe(input);
  });

  it("handles complex dice expression before semicolon", () => {
    const input = "[rollable]3d8 + 5;{\"diceNotation\":\"3d8+5\",\"total\":18}[/rollable] bludgeoning damage";
    expect(DDBMonsterFeatureFactory.replaceRollable(input)).toBe("3d8 + 5 bludgeoning damage");
  });

  it("returns empty string for empty input", () => {
    expect(DDBMonsterFeatureFactory.replaceRollable("")).toBe("");
  });
});

// =============================================================================
// namePassMatch - detects dice ranges and spell frequency prefixes
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

  it("matches a bare list number '1:' or '1' (a table row title)", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("1:")).toBe(true);
    expect(DDBMonsterFeatureFactory.namePassMatch("10")).toBe(true);
  });

  it("does not match a numbered entry with a title", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("1: Charm Ray")).toBe(false);
  });

  it("does not match normal feature name", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("Multiattack")).toBe(false);
  });

  it("does not match name with parenthetical recharge", () => {
    expect(DDBMonsterFeatureFactory.namePassMatch("Fire Breath (Recharge 5-6)")).toBe(false);
  });
});

// =============================================================================
// splitName - extracts action name from concatenated formats
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

// =============================================================================
// legendaryActionCount / hasLairBonus - legendary counts and the lair bonus
// =============================================================================
describe("DDBMonsterFeatureFactory.legendaryActionCount", () => {
  it.each([
    ["a 2014 count", "The dragon can take 3 legendary actions, choosing from the options below.", 3],
    ["a 2014 spelled count", "The hag can take three legendary actions, choosing from the options below.", 3],
    ["a 2014 count other than 3", "The dragon can take 2 legendary actions, choosing from the options below.", 2],
    ["a 2024 count", "Legendary Action Uses: 1. Immediately after another creature's turn, the monster can expend a use.", 1],
    ["a 2024 count with a lair count", "Legendary Action Uses: 3 (4 in Lair). Immediately after another creature's turn, the monster can expend a use.", 3],
    ["a 2024 count with a domain count", "Legendary Action Uses: 2 (3 in Domain). Immediately after another creature's turn, the monster can expend a use.", 2],
  ])("reads %s", (_label, text, count) => {
    expect(DDBMonsterFeatureFactory.legendaryActionCount(text)).toBe(count);
  });

  it("reads nothing from an option", () => {
    expect(DDBMonsterFeatureFactory.legendaryActionCount("Tail Swipe. The dragon makes one Tail attack.")).toBeNull();
  });
});

describe("DDBMonsterFeatureFactory.hasLairBonus", () => {
  it.each([
    ["a lair resistance", "Legendary Resistance (3/Day, or 4/Day in Lair). If the dragon fails a saving throw, it can choose to succeed instead."],
    ["a domain resistance", "Legendary Resistance (3/Day, or 4/Day in Domain). If the darklord fails a saving throw, she can choose to succeed instead."],
    ["a lair action count", "Legendary Action Uses: 3 (4 in Lair). Immediately after another creature's turn, the dragon can expend a use."],
  ])("reads %s", (_label, text) => {
    expect(DDBMonsterFeatureFactory.hasLairBonus(text)).toBe(true);
  });

  it.each([
    ["a plain resistance", "Legendary Resistance (3/Day). If the lich fails a saving throw, it can choose to succeed instead."],
    ["a plain action count", "Legendary Action Uses: 3. Immediately after another creature's turn, the lich can expend a use."],
    ["an option naming its lair", "Lair Pulse. While in its lair, the dragon regains 10 Hit Points."],
  ])("reads nothing from %s", (_label, text) => {
    expect(DDBMonsterFeatureFactory.hasLairBonus(text)).toBe(false);
  });
});
