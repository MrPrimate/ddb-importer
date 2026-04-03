vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));
// DDBMonsterDamage imports DDBMonsterFeature — mock it to avoid the full chain
vi.mock("../../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class DDBMonsterFeature {},
}));

import { DDBMonsterDamage } from "../../../src/parser/monster/features/DDBMonsterDamage";

// =============================================================================
// DAMAGE_EXPRESSION — regex for matching damage in monster descriptions
// =============================================================================
describe("DDBMonsterDamage.DAMAGE_EXPRESSION", () => {
  function firstMatch(text: string) {
    // Reset lastIndex since the regex has the 'g' flag
    DDBMonsterDamage.DAMAGE_EXPRESSION.lastIndex = 0;
    return DDBMonsterDamage.DAMAGE_EXPRESSION.exec(text);
  }

  function allMatches(text: string) {
    DDBMonsterDamage.DAMAGE_EXPRESSION.lastIndex = 0;
    return [...text.matchAll(DDBMonsterDamage.DAMAGE_EXPRESSION)];
  }

  it("matches standard melee: '10 (2d6 + 3) slashing damage'", () => {
    const match = firstMatch("Hit: 10 (2d6 + 3) slashing damage.");
    expect(match).not.toBeNull();
    expect(match!.groups!.dice).toBe("2d6 + 3");
    expect(match!.groups!.type).toBe("slashing");
  });

  it("matches ranged: '5 (1d6 + 2) piercing damage'", () => {
    const match = firstMatch("Hit: 5 (1d6 + 2) piercing damage.");
    expect(match).not.toBeNull();
    expect(match!.groups!.dice).toBe("1d6 + 2");
    expect(match!.groups!.type).toBe("piercing");
  });

  it("captures versatile suffix 'two hands'", () => {
    const match = firstMatch("10 (2d6 + 3) bludgeoning damage if used with two hands");
    expect(match).not.toBeNull();
    expect(match!.groups!.suffix).toContain("two hands");
  });

  it("captures 'saving throw or take' prefix", () => {
    const match = firstMatch("saving throw or take 14 (4d6) fire damage");
    expect(match).not.toBeNull();
    expect(match!.groups!.prefix).toContain("saving throw or take");
    expect(match!.groups!.type).toBe("fire");
  });

  it("captures PB in dice expression", () => {
    const match = firstMatch("7 (1d8 + 3 + PB) slashing damage");
    expect(match).not.toBeNull();
    expect(match!.groups!.dice).toContain("PB");
  });

  it("finds multiple damage matches in one string", () => {
    const matches = allMatches("7 (2d6) fire damage plus 3 (1d6) cold damage");
    expect(matches.length).toBeGreaterThanOrEqual(2);
    const types = matches.map((m) => m.groups!.type);
    expect(types).toContain("fire");
    expect(types).toContain("cold");
  });

  it("matches flat damage without dice: 'plus 3 bludgeoning damage'", () => {
    // Regex requires a prefix (word + space) before the damage number
    const match = firstMatch("plus 3 bludgeoning damage");
    expect(match).not.toBeNull();
    expect(match!.groups!.diceminor).toBe("3");
    expect(match!.groups!.type).toBe("bludgeoning");
  });

  it("matches 'fire or cold' compound damage type", () => {
    const match = firstMatch("10 (3d6) fire or cold damage");
    expect(match).not.toBeNull();
    expect(match!.groups!.type).toContain("fire");
  });
});

// =============================================================================
// REGAIN_EXPRESSION — regex for matching healing/regain
// =============================================================================
describe("DDBMonsterDamage.REGAIN_EXPRESSION", () => {
  it("matches 'regains 10 (2d8 + 1) hit points'", () => {
    const match = "The creature regains 10 (2d8 + 1) hit points".match(DDBMonsterDamage.REGAIN_EXPRESSION);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("regains");
    expect(match![2]).toBe("10");
    expect(match![3]).toBe("2d8 + 1");
  });

  it("matches flat 'regains 5 hit points'", () => {
    const match = "regains 5 hit points at the start".match(DDBMonsterDamage.REGAIN_EXPRESSION);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("regains");
    expect(match![2]).toBe("5");
    expect(match![3]).toBeUndefined();
  });

  it("matches dice-only 'regain (2d6) hit points'", () => {
    // Parenthesized form prevents the greedy [0-9]+ group from consuming the dice count
    const match = "regain (2d6) hit points".match(DDBMonsterDamage.REGAIN_EXPRESSION);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("regain");
    expect(match![2]).toBeUndefined();
    expect(match![3]).toBe("2d6");
  });

  it("does not match non-healing text", () => {
    const match = "deals 10 fire damage".match(DDBMonsterDamage.REGAIN_EXPRESSION);
    expect(match).toBeNull();
  });
});

// =============================================================================
// damageMatchSave — detects save-based damage from match groups
// =============================================================================
describe("DDBMonsterDamage.damageMatchSave", () => {
  it("returns truthy when prefix includes 'saving throw'", () => {
    const dmg = { groups: { prefix: "saving throw or take ", suffix: "" } };
    expect(DDBMonsterDamage.damageMatchSave(dmg)).toBeTruthy();
  });

  it("returns truthy when suffix is 'on a failed save'", () => {
    const dmg = { groups: { prefix: "takes ", suffix: "on a failed save" } };
    expect(DDBMonsterDamage.damageMatchSave(dmg)).toBeTruthy();
  });

  it("returns null when prefix is 'and' even with save suffix", () => {
    const dmg = { groups: { prefix: "and ", suffix: "on a failed save" } };
    expect(DDBMonsterDamage.damageMatchSave(dmg)).toBeNull();
  });

  it("returns null when neither save indicator present", () => {
    const dmg = { groups: { prefix: "takes ", suffix: " two hands" } };
    expect(DDBMonsterDamage.damageMatchSave(dmg)).toBeNull();
  });
});

// =============================================================================
// _getDamageTypes — extracts damage types from match text
// =============================================================================
describe("DDBMonsterDamage._getDamageTypes", () => {
  it("extracts single damage type", () => {
    expect(DDBMonsterDamage._getDamageTypes("", "fire")).toEqual(["fire"]);
  });

  it("splits 'fire or cold'", () => {
    const types = DDBMonsterDamage._getDamageTypes("", "fire or cold");
    expect(types).toContain("fire");
    expect(types).toContain("cold");
    expect(types).toHaveLength(2);
  });

  it("extracts from 'damage of a type chosen by' fallback", () => {
    const text = "damage of a type chosen by the caster: acid, cold, fire, lightning, or thunder.";
    const types = DDBMonsterDamage._getDamageTypes(text, "");
    expect(types).toContain("acid");
    expect(types).toContain("cold");
    expect(types).toContain("fire");
    expect(types).toContain("lightning");
    expect(types).toContain("thunder");
    expect(types).toHaveLength(5);
  });

  it("returns empty array for unknown type", () => {
    expect(DDBMonsterDamage._getDamageTypes("", "unknowntype")).toEqual([]);
  });
});
