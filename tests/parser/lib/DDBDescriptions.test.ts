// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBDescriptions from "../../../src/parser/lib/DDBDescriptions";

// =============================================================================
// startOrEnd
// =============================================================================
describe("DDBDescriptions.startOrEnd", () => {
  it("detects 'start'", () => {
    expect(DDBDescriptions.startOrEnd("at the start of each of its turns")).toBe("start");
  });

  it("detects 'end'", () => {
    expect(DDBDescriptions.startOrEnd("at the end of each of its turns")).toBe("end");
  });

  it("returns undefined for non-matching text", () => {
    expect(DDBDescriptions.startOrEnd("no matching text here")).toBeUndefined();
  });

  it("is case insensitive", () => {
    expect(DDBDescriptions.startOrEnd("At The Start Of Each turn")).toBe("Start");
  });
});

// =============================================================================
// getDuration
// =============================================================================
describe("DDBDescriptions.getDuration", () => {
  it("parses 'for 1 minute'", () => {
    const result = DDBDescriptions.getDuration("for 1 minute");
    expect(result.type).toBe("minute");
    expect(result.seconds).toBe(60);
    expect(result.minutes).toBe(1);
    expect(result.value).toBe("1");
    expect(result.units).toBe("minute");
  });

  it("parses 'for 10 minute'", () => {
    const result = DDBDescriptions.getDuration("for 10 minute");
    expect(result.seconds).toBe(600);
    expect(result.minutes).toBe(10);
  });

  it("parses 'for 8 hour'", () => {
    const result = DDBDescriptions.getDuration("for 8 hour");
    expect(result.type).toBe("hour");
    expect(result.seconds).toBe(28800);
    expect(result.hours).toBe(8);
  });

  it("parses 'for 1 hour'", () => {
    const result = DDBDescriptions.getDuration("for 1 hour");
    expect(result.seconds).toBe(3600);
  });

  it("parses 'for 3 round'", () => {
    const result = DDBDescriptions.getDuration("for 3 round");
    expect(result.type).toBe("round");
    expect(result.seconds).toBe(18);
    expect(result.rounds).toBe(3);
  });

  it("parses 'for 1 day'", () => {
    const result = DDBDescriptions.getDuration("for 1 day");
    expect(result.type).toBe("day");
    expect(result.seconds).toBe(86400);
    expect(result.days).toBe(1);
  });

  it("parses 'for 1 year'", () => {
    const result = DDBDescriptions.getDuration("for 1 year");
    expect(result.type).toBe("year");
    expect(result.years).toBe(1);
  });

  it("parses 'for 1 month'", () => {
    const result = DDBDescriptions.getDuration("for 1 month");
    expect(result.type).toBe("month");
    expect(result.months).toBe(1);
  });

  it("parses 'until the end of its next turn' as special", () => {
    const result = DDBDescriptions.getDuration("until the end of its next turn");
    expect(result.type).toBe("special");
    expect(result.units).toBe("spec");
    expect(result.seconds).toBe(6);
    expect(result.rounds).toBe(1);
    expect(result.dae).toContain("turnEnd");
  });

  it("parses 'until the start of your next turn' as special source", () => {
    const result = DDBDescriptions.getDuration("until the start of your next turn");
    expect(result.type).toBe("special");
    expect(result.dae).toContain("turnStartSource");
  });

  it("parses 'until the end of your next turn' as special source", () => {
    const result = DDBDescriptions.getDuration("until the end of your next turn");
    expect(result.type).toBe("special");
    expect(result.dae).toContain("turnEndSource");
  });

  it("parses 'until the end of the target's next turn'", () => {
    const result = DDBDescriptions.getDuration("until the end of the target's next turn");
    expect(result.type).toBe("special");
    expect(result.dae).toContain("turnEnd");
  });

  it("parses 'until the start of its next turn'", () => {
    const result = DDBDescriptions.getDuration("until the start of its next turn");
    expect(result.type).toBe("special");
    expect(result.dae).toContain("turnStart");
  });

  it("returns default 60 seconds when returnDefault=true and no match", () => {
    const result = DDBDescriptions.getDuration("no duration here", true, false);
    expect(result.seconds).toBe(60);
    expect(result.type).toBe("second");
  });

  it("returns null seconds when returnDefault=false and no match", () => {
    const result = DDBDescriptions.getDuration("no duration here", false, false);
    expect(result.seconds).toBeNull();
    expect(result.type).toBeNull();
  });
});

// =============================================================================
// dcParser
// =============================================================================
describe("DDBDescriptions.dcParser", () => {
  it("parses 'DC 18 Strength saving throw or be knocked prone'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 18 Strength saving throw or be knocked prone" });
    expect(result.match).not.toBeNull();
    expect(result.save.dc.formula).toBe("18");
    expect(result.save.ability).toEqual(["str"]);
  });

  it("parses 'DC 14 Constitution saving throw or become poisoned for 1 minute'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 14 Constitution saving throw or become poisoned for 1 minute." });
    expect(result.save.dc.formula).toBe("14");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 12 Constitution saving throw or be poisoned for 1 minute'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 12 Constitution saving throw or be poisoned for 1 minute" });
    expect(result.save.dc.formula).toBe("12");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 15 Wisdom saving throw or be frightened until the end of its next turn'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 15 Wisdom saving throw or be frightened until the end of its next turn." });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["wis"]);
  });

  it("parses 'DC 15 Charisma saving throw or be charmed'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 15 Charisma saving throw or be charmed" });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["cha"]);
  });

  it("parses 'DC 12 Charisma saving throw or become cursed'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 12 Charisma saving throw or become cursed" });
    expect(result.save.dc.formula).toBe("12");
    expect(result.save.ability).toEqual(["cha"]);
  });

  it("parses 'DC 10 Intelligence saving throw or it can't take a reaction'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 10 Intelligence saving throw or it can't take a reaction until the end of its next turn" });
    expect(result.save.dc.formula).toBe("10");
    expect(result.save.ability).toEqual(["int"]);
  });

  it("parses 'DC 15 Constitution saving throw or die'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 15 Constitution saving throw or die." });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 15 Constitution saving throw or gain 1 level of exhaustion'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 15 Constitution saving throw or gain 1 level of exhaustion" });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 20 Constitution saving throw or be paralyzed for 1 minute'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 20 Constitution saving throw or be paralyzed for 1 minute" });
    expect(result.save.dc.formula).toBe("20");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 17 Strength saving throw or be thrown up to 30 feet away'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 17 Strength saving throw or be thrown up to 30 feet away in a straight line" });
    expect(result.save.dc.formula).toBe("17");
    expect(result.save.ability).toEqual(["str"]);
  });

  it("parses 'DC 13 Constitution saving throw or lose the ability to use reactions'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 13 Constitution saving throw or lose the ability to use reactions until the start of the weird's" });
    expect(result.save.dc.formula).toBe("13");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 20 Strength saving throw or be pulled up to 25 feet toward the balor'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 20 Strength saving throw or be pulled up to 25 feet toward the balor." });
    expect(result.save.dc.formula).toBe("20");
    expect(result.save.ability).toEqual(["str"]);
  });

  it("parses 'DC 15 Constitution saving throw or have disadvantage on its attack rolls'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 15 Constitution saving throw or have disadvantage on its attack rolls until the end of its next turn" });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 11 Constitution saving throw or be poisoned until the end of the target's next turn'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 11 Constitution saving throw or be poisoned until the end of the target's next turn." });
    expect(result.save.dc.formula).toBe("11");
    expect(result.save.ability).toEqual(["con"]);
  });

  it("parses 'DC 14 Wisdom saving throw or be frightened of the quori for 1 minute'", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 14 Wisdom saving throw or be frightened of the quori for 1 minute." });
    expect(result.save.dc.formula).toBe("14");
    expect(result.save.ability).toEqual(["wis"]);
  });

  it("parses new 2024 [[/save]] format", () => {
    const result = DDBDescriptions.dcParser({ text: "[[/save Strength 15 format=long]] or be knocked prone" });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["str"]);
  });

  it("parses damage+condition combo (rawDamageConditionSearch)", () => {
    const result = DDBDescriptions.dcParser({
      text: "DC 15 Constitution saving throw or take 10 (3d6) necrotic damage and be frightened for 1 minute",
    });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["con"]);
    expect(result.damageAndSave).toBe(true);
    expect(result.damage.type).toBe("necrotic");
    expect(result.damage.value).toBe("3d6");
  });

  it("parses new-format 'Wisdom saving throw: DC 15'", () => {
    const result = DDBDescriptions.dcParser({
      text: "Wisdom saving throw: DC 15. Failure: The target has the frightened for 1 minute",
    });
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["wis"]);
  });

  it("parses 'the target has the X condition' format", () => {
    const result = DDBDescriptions.dcParser({ text: "the target has the poisoned condition" });
    expect(result.match).not.toBeNull();
  });

  it("parses spellcasting DC reference", () => {
    const result = DDBDescriptions.dcParser({ text: "a Wisdom saving throw against your spell save DC" });
    expect(result.save.ability).toEqual(["wis"]);
    expect(result.save.dc.calculation).toBe("spellcasting");
  });

  it("returns null match for non-matching text", () => {
    const result = DDBDescriptions.dcParser({ text: "The creature takes 2d6 fire damage." });
    expect(result.match).toBeNull();
    expect(result.save.dc.formula).toBe("");
    expect(result.save.ability).toEqual([]);
  });

  it("returns empty damage for non-damage saves", () => {
    const result = DDBDescriptions.dcParser({ text: "DC 15 Wisdom saving throw or be frightened" });
    expect(result.damageAndSave).toBe(false);
    expect(result.damage.type).toBeNull();
    expect(result.damage.value).toBeNull();
  });
});

// =============================================================================
// featureBasics
// =============================================================================
describe("DDBDescriptions.featureBasics", () => {
  it("detects melee weapon attack", () => {
    const result = DDBDescriptions.featureBasics({ text: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target." });
    expect(result.properties.isAttack).toBe(true);
    expect(result.properties.meleeAttack).toBe(true);
    expect(result.properties.weaponAttack).toBe(true);
    expect(result.properties.spellAttack).toBe(false);
    expect(result.properties.toHit).toBe(5);
  });

  it("detects ranged spell attack", () => {
    const result = DDBDescriptions.featureBasics({ text: "Ranged Spell Attack: +7 to hit, range 120 ft., one target." });
    expect(result.properties.isAttack).toBe(true);
    expect(result.properties.rangedAttack).toBe(true);
    expect(result.properties.spellAttack).toBe(true);
    expect(result.properties.weaponAttack).toBe(false);
    expect(result.properties.toHit).toBe(7);
  });

  it("detects melee or ranged weapon attack", () => {
    const result = DDBDescriptions.featureBasics({ text: "Melee or Ranged Weapon Attack: +6 to hit" });
    expect(result.properties.isAttack).toBe(true);
    expect(result.properties.meleeAttack).toBe(true);
    expect(result.properties.rangedAttack).toBe(true);
    expect(result.properties.toHit).toBe(6);
  });

  it("detects negative to-hit bonus", () => {
    const result = DDBDescriptions.featureBasics({ text: "Melee Weapon Attack: -1 to hit" });
    expect(result.properties.toHit).toBe(-1);
  });

  it("detects summon attack with spell attack modifier", () => {
    const result = DDBDescriptions.featureBasics({ text: "Melee Weapon Attack: Bonus equals your spell attack modifier" });
    expect(result.properties.isAttack).toBe(true);
    expect(result.properties.isSummonAttack).toBe(true);
    expect(result.properties.yourSpellAttackModToHit).toBe(true);
  });

  it("detects PB to attack", () => {
    const result = DDBDescriptions.featureBasics({ text: "Melee Weapon Attack: +4 plus PB to hit" });
    expect(result.properties.pbToAttack).toBe(true);
  });

  it("detects saving throw with DC", () => {
    const result = DDBDescriptions.featureBasics({ text: "Each creature must make a DC 15 Wisdom saving throw or be frightened." });
    expect(result.properties.isSavingThrow).toBe(true);
    expect(result.properties.isSave).toBe(true);
    expect(result.save.dc.formula).toBe("15");
    expect(result.save.ability).toEqual(["wis"]);
  });

  it("detects spell save DC", () => {
    const result = DDBDescriptions.featureBasics({ text: "The target must make a Dexterity saving throw against your spell save DC." });
    expect(result.properties.isSpellSave).toBe(true);
    expect(result.properties.isSave).toBe(true);
    expect(result.save.dc.calculation).toBe("spellcasting");
    expect(result.save.ability).toEqual(["dex"]);
  });

  it("detects summon save DC", () => {
    const result = DDBDescriptions.featureBasics({ text: "Strength Saving Throw: DC equals your spell save DC" });
    expect(result.properties.isSummonSave).toBe(true);
    expect(result.properties.isSave).toBe(true);
    expect(result.save.ability).toEqual(["str"]);
  });

  it("detects half damage on save", () => {
    const result = DDBDescriptions.featureBasics({ text: "DC 14 Dexterity saving throw, taking 8d6 fire damage on a failed save, or half as much damage on a successful one." });
    expect(result.properties.halfDamage).toBe(true);
    expect(result.save.half).toBe(true);
  });

  it("detects 'Success: Half damage' format", () => {
    const result = DDBDescriptions.featureBasics({ text: "Dexterity saving throw: DC 15. Success: Half damage." });
    expect(result.properties.halfDamage).toBe(true);
  });

  it("detects healing action", () => {
    const result = DDBDescriptions.featureBasics({ text: "The target regains 10 (2d6 + 3) hit points." });
    expect(result.properties.healingAction).toBe(true);
  });

  it("detects healing with 'regain'", () => {
    const result = DDBDescriptions.featureBasics({ text: "You regain 5 hit points at the start of each turn." });
    expect(result.properties.healingAction).toBe(true);
  });

  it("returns correct midiProperties for attack", () => {
    const result = DDBDescriptions.featureBasics({ text: "Melee Weapon Attack: +5 to hit" });
    expect(result.midiProperties).toHaveProperty("otherSaveDamage", "halfdam");
  });

  it("returns correct midiProperties for non-attack", () => {
    const result = DDBDescriptions.featureBasics({ text: "The target must make a DC 12 Constitution saving throw." });
    expect(result.midiProperties).toHaveProperty("saveDamage", "halfdam");
  });

  it("returns no attack/save for plain description", () => {
    const result = DDBDescriptions.featureBasics({ text: "This creature has advantage on saving throws against being frightened." });
    expect(result.properties.isAttack).toBe(false);
    expect(result.properties.isSave).toBe(false);
    expect(result.properties.healingAction).toBe(false);
  });
});

// =============================================================================
// splitStringByComma
// =============================================================================
describe("DDBDescriptions.splitStringByComma", () => {
  it("splits simple comma-separated values", () => {
    expect(DDBDescriptions.splitStringByComma("fire, cold, lightning")).toEqual(["fire", "cold", "lightning"]);
  });

  it("does not split commas inside parentheses", () => {
    const result = DDBDescriptions.splitStringByComma("charm person (level 5 version), hold person");
    expect(result).toEqual(["charm person (level 5 version)", "hold person"]);
  });

  it("strips asterisks and trailing periods", () => {
    expect(DDBDescriptions.splitStringByComma("*fireball*, *ice storm*.")).toEqual(["fireball", "ice storm"]);
  });

  it("trims whitespace", () => {
    expect(DDBDescriptions.splitStringByComma("  fire ,  cold ")).toEqual(["fire", "cold"]);
  });

  it("handles single item", () => {
    expect(DDBDescriptions.splitStringByComma("fireball")).toEqual(["fireball"]);
  });
});
