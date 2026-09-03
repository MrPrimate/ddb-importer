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
// parseStatusCondition
// =============================================================================
describe("DDBDescriptions.parseStatusCondition", () => {
  it("leaves duration.value null (not NaN) when the condition has no duration phrase", () => {
    const result = DDBDescriptions.parseStatusCondition({ text: "DC 15 Strength saving throw or be knocked prone" });
    expect(result.success).toBe(true);
    expect(Number.isNaN(result.duration.value)).toBe(false);
    expect(result.duration.value).toBeNull();
  });

  it("parses a numeric duration.value when a duration phrase is present", () => {
    const result = DDBDescriptions.parseStatusCondition({ text: "DC 14 Constitution saving throw or be poisoned for 1 minute" });
    expect(result.success).toBe(true);
    expect(result.duration.value).toBe(1);
    expect(result.duration.units).toBe("minutes");
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

  // The primary save is whichever the text states FIRST, not whichever printing's word order
  // the parser happens to try first. See DDBDescriptions.firstMatch.
  describe("picks the save its text states first", () => {
    it("takes the 2024 wording when the 2014 wording is a trailing clause", () => {
      // Behir (2024) Swallow: the DC 14 Con throw is the BEHIR's, to regurgitate its meal
      const result = DDBDescriptions.featureBasics({ text: "Swallow. Dexterity Saving Throw: DC 18, one Large or "
        + "smaller creature Grappled by the behir. Failure: 17 (5d6) Piercing damage. If the behir takes 30 damage or "
        + "more on a single turn from the swallowed creature, the behir must succeed on a DC 14 Constitution saving "
        + "throw at the end of that turn or regurgitate the creature." });
      expect(result.save.ability).toEqual(["dex"]);
      expect(result.save.dc.formula).toBe("18");
    });

    it("takes the 2014 wording when it comes first", () => {
      const result = DDBDescriptions.featureBasics({ text: "Each creature must make a DC 15 Wisdom saving throw. A "
        + "creature that fails repeats the roll at the end of its turns. Constitution Saving Throw: DC 12 to end the "
        + "effect early." });
      expect(result.save.ability).toEqual(["wis"]);
      expect(result.save.dc.formula).toBe("15");
    });

    it("prefers a save over a later escape check", () => {
      // Florivore Dig In: the Strength check is the escape DC, not the feature's save
      const result = DDBDescriptions.featureBasics({ text: "Dig In. Constitution Saving Throw: DC 15, one creature "
        + "within 5 feet. Failure: 3 (1d6) Piercing damage, and the target has the Grappled condition (escape DC 15 "
        + "Strength check)." });
      expect(result.save.ability).toEqual(["con"]);
      expect(result.save.dc.formula).toBe("15");
    });

    // Deliberate non-change: featureBasics reads "check" and "saving throw" with one regex, so a
    // feature whose only DC is an escape check still builds a save. Seventy monster features rely
    // on this; unpicking it means moving off these regexes entirely.
    it("still treats a lone escape check as a save", () => {
      const result = DDBDescriptions.featureBasics({ text: "The target is restrained. A creature can free itself by "
        + "succeeding on a DC 12 Strength check." });
      expect(result.properties.isSave).toBe(true);
      expect(result.save.ability).toEqual(["str"]);
      expect(result.save.dc.formula).toBe("12");
    });
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

describe("nextTurnExpiry", () => {
  // dnd5e 6.0 anchors a turn edge on the effect's SOURCE or its TARGET; getting
  // that backwards is a significant failure mode

  it("anchors generic referents on the target", () => {
    for (const whos of ["its", "the target's", "the creature's", "that creature's", "their"]) {
      expect(DDBDescriptions.nextTurnExpiry(`is blinded until the end of ${whos} next turn.`))
        .toMatchObject({ expiry: "targetEnd", dae: "turnEnd" });
    }
  });

  it("anchors the caster's own wording on the source", () => {
    expect(DDBDescriptions.nextTurnExpiry("lasts until the start of your next turn."))
      .toMatchObject({ expiry: "sourceStart", dae: "turnStartSource" });
    expect(DDBDescriptions.nextTurnExpiry("until the end of the caster's next turn"))
      .toMatchObject({ expiry: "sourceEnd", dae: "turnEndSource" });
  });

  it("treats a noun naming the acting creature as the source", () => {
    // a summon or class actor acts; the target is referred to generically
    expect(DDBDescriptions.nextTurnExpiry("until the start of the aberration's next turn"))
      .toMatchObject({ expiry: "sourceStart" });
    expect(DDBDescriptions.nextTurnExpiry("until the end of the ranger's next turn"))
      .toMatchObject({ expiry: "sourceEnd" });
  });

  it("reduces adjective-qualified generic referents to their head noun", () => {
    for (const whos of ["the chosen creature's", "the hit creature's", "the frightened creature's"]) {
      expect(DDBDescriptions.nextTurnExpiry(`until the end of ${whos} next turn`))
        .toMatchObject({ expiry: "targetEnd" });
    }
  });

  it("accepts 'beginning' as a synonym for 'start'", () => {
    expect(DDBDescriptions.nextTurnExpiry("until the beginning of its next turn"))
      .toMatchObject({ expiry: "targetStart" });
    expect(DDBDescriptions.nextTurnExpiry("until the beginning of your next turn"))
      .toMatchObject({ expiry: "sourceStart" });
  });

  it("survives a clause split by a newline or non-breaking space", () => {
    expect(DDBDescriptions.nextTurnExpiry("until the end of\nits next turn")).toMatchObject({ expiry: "targetEnd" });
    expect(DDBDescriptions.nextTurnExpiry("until the end of its next turn")).toMatchObject({ expiry: "targetEnd" });
  });

  it("treats an unrecognised possessive as the acting creature", () => {
    // monster names are unbounded ("the demilich's next turn"); rules text names
    // the actor specifically and the affected creature generically
    expect(DDBDescriptions.nextTurnExpiry("Blinded until the end of the demilich's next turn"))
      .toMatchObject({ expiry: "sourceEnd" });
  });

  it("returns null rather than guessing a non-possessive unknown referent", () => {
    expect(DDBDescriptions.nextTurnExpiry("until the end of some nonsense next turn")).toBeNull();
    expect(DDBDescriptions.nextTurnExpiry("for 1 minute")).toBeNull();
  });

  it("feeds getDuration's native expiry alongside the legacy DAE token", () => {
    const duration = DDBDescriptions.getDuration("blinded until the end of its next turn.", false);
    expect(duration.expiry).toBe("targetEnd");
    expect(duration.dae).toEqual(["turnEnd"]);
  });
});

// =============================================================================
// parseSaves - every save in a body of rules text, not just the first. The
// single-save parsers stop at the first match, which is why a multi-mode item's
// other properties never reach an activity.
// =============================================================================
describe("DDBDescriptions.parseSaves", () => {
  it("reads every explicit-DC save in source order", () => {
    const text = "Each creature must make a DC 15 Dexterity saving throw."
      + " Others must succeed on a DC 19 Charisma save.";

    expect(DDBDescriptions.parseSaves(text).map((save) => [save.ability, save.dc.formula]))
      .toEqual([[["dex"], "15"], [["cha"], "19"]]);
  });

  it("reads the 2024 word order", () => {
    const text = "Constitution Saving Throw: DC 15, each creature in the area.";

    expect(DDBDescriptions.parseSaves(text)).toEqual([
      { ability: ["con"], dc: { calculation: "", formula: "15" }, index: 0, half: false },
    ]);
  });

  it("keeps both halves of an either/or in the ability list", () => {
    expect(DDBDescriptions.parseSaves("must make a DC 16 Strength or Dexterity saving throw")[0].ability)
      .toEqual(["str", "dex"]);
  });

  it("reads the spell save DC phrasing as a calculation", () => {
    expect(DDBDescriptions.parseSaves("must succeed on an Intelligence saving throw against your spell save DC"))
      .toEqual([
        { ability: ["int"], dc: { calculation: "spellcasting", formula: "" }, index: 19, half: false },
      ]);
  });

  it("does not read one sentence twice when patterns overlap", () => {
    const text = "must succeed on a DC 15 Dexterity saving throw against your spell save DC";

    expect(DDBDescriptions.parseSaves(text)).toHaveLength(1);
    expect(DDBDescriptions.parseSaves(text)[0].dc).toEqual({ calculation: "", formula: "15" });
  });

  it("marks a half-on-save damage rider", () => {
    const text = "make a DC 15 Dexterity saving throw, taking 8d6 cold damage on a failed save,"
      + " or half as much damage on a successful one.";

    expect(DDBDescriptions.parseSaves(text)[0].half).toBe(true);
  });

  it("never emits an ability outside the six", () => {
    expect(DDBDescriptions.parseSaves("must succeed on a death saving throw")).toEqual([]);
    expect(DDBDescriptions.parseSaves("must make a DC 13 saving throw of your choice")).toEqual([]);
  });

  it("returns nothing for text naming no save", () => {
    expect(DDBDescriptions.parseSaves("A perfectly ordinary hat.")).toEqual([]);
    expect(DDBDescriptions.parseSaves("")).toEqual([]);
  });
});

// =============================================================================
// stripTables / saveKey
// =============================================================================
describe("DDBDescriptions.stripTables", () => {
  it("removes a random table, whose saves are rows rather than item properties", () => {
    const description = "<p>Roll on the table.</p>"
      + "<table><tr><td>1</td><td>DC 15 Constitution saving throw</td></tr>"
      + "<tr><td>2</td><td>DC 20 Dexterity saving throw</td></tr></table>";

    expect(DDBDescriptions.parseSaves(DDBDescriptions.stripTables(description))).toEqual([]);
  });

  it("leaves prose outside the table alone", () => {
    const description = "<p>A DC 11 Constitution saving throw.</p><table><tr><td>DC 15 Dexterity save</td></tr></table>";

    expect(DDBDescriptions.parseSaves(DDBDescriptions.stripTables(description)).map((save) => save.dc.formula))
      .toEqual(["11"]);
  });
});

describe("DDBDescriptions.saveKey", () => {
  it("treats the same roll against the same DC as one property", () => {
    const [first, second] = DDBDescriptions.parseSaves(
      "make a DC 15 Constitution saving throw. It repeats the DC 15 Constitution save each turn.",
    );
    expect(DDBDescriptions.saveKey(first)).toBe(DDBDescriptions.saveKey(second));
  });

  it("separates the same ability at a different DC", () => {
    const [first, second] = DDBDescriptions.parseSaves(
      "a DC 13 Wisdom saving throw. Later, a DC 18 Wisdom saving throw.",
    );
    expect(DDBDescriptions.saveKey(first)).not.toBe(DDBDescriptions.saveKey(second));
  });

  it("ignores the order the abilities were written in", () => {
    expect(DDBDescriptions.saveKey({ ability: ["dex", "str"], dc: { calculation: "", formula: "15" } }))
      .toBe(DDBDescriptions.saveKey({ ability: ["str", "dex"], dc: { calculation: "", formula: "15" } }));
  });
});

// =============================================================================
// parseChecks - every explicit-DC ability check in a body of rules text, classified by
// whether it releases something the item did. See docs/build/multi-roll-items.md.
// =============================================================================
describe("DDBDescriptions.parseChecks", () => {
  it("reads the DC, ability and skill of a skill check", () => {
    const [check] = DDBDescriptions.parseChecks(
      "To escape, the target must take an action to make a DC 15 Strength (Athletics) check, freeing the Restrained creature on a success.",
    );
    expect(check.dc).toEqual({ calculation: "", formula: "15" });
    expect(check.abilities).toEqual(["str"]);
    expect(check.associated).toEqual(["ath"]);
  });

  it("leaves associated empty for a bare ability check", () => {
    const [check] = DDBDescriptions.parseChecks("A creature can use its action to make a DC 13 Strength check, freeing itself on a success.");
    expect(check.abilities).toEqual(["str"]);
    expect(check.associated).toEqual([]);
  });

  it("reads both halves of an either/or check with skills", () => {
    const [check] = DDBDescriptions.parseChecks(
      "A target Restrained by the rope can take an action to make its choice of a DC 15 Strength (Athletics) or Dexterity (Acrobatics) check.",
    );
    expect(check.abilities).toEqual(["str", "dex"]);
    expect(check.associated).toEqual(["ath", "acr"]);
  });

  it("reads an either/or check without skills and drops the choice qualifier", () => {
    const [check] = DDBDescriptions.parseChecks(
      "A grappled creature can use its action to make a DC 13 Strength or Dexterity check (its choice), freeing itself on a success.",
    );
    expect(check.abilities).toEqual(["str", "dex"]);
    expect(check.associated).toEqual([]);
  });

  it("reads two skills named in one parenthesis", () => {
    const [check] = DDBDescriptions.parseChecks("If a character succeeds on a DC 20 Intelligence (Arcana or History) check, the character recalls lore.");
    expect(check.associated).toEqual(["arc", "his"]);
  });

  it("maps tool names, in parentheses or after 'using', with either apostrophe", () => {
    expect(DDBDescriptions.parseChecks("spends 1 hour to make a DC 16 Dexterity (smith’s or tinker’s tools) check.")[0].associated)
      .toEqual(["smith", "tinker"]);
    expect(DDBDescriptions.parseChecks("succeeding on a DC 30 Dexterity check using thieves' tools.")[0].associated)
      .toEqual(["thief"]);
  });

  describe("release checks", () => {
    const releases: [string, string][] = [
      ["freeing", "A creature can use its action to make a DC 13 Strength check, freeing itself or another creature within its reach on a success."],
      ["to escape", "To escape, the target or a creature within 5 feet of it must take an action to make a DC 10 Strength (Athletics) check, freeing the Restrained creature on a success."],
      ["bursting", "Bursting free of the Barrel requires a successful DC 20 Strength (Athletics) check as an action."],
      ["breaking them", "Breaking them requires a successful DC 20 Strength check."],
      ["ending the restrained condition", "The creature can use its action to make a DC 16 Strength check, ending the restrained condition on a success."],
      ["ending the effect of wounds", "The wounded creature can use an action to make a DC 15 Wisdom (Medicine) check, ending the effect of such wounds on it on a success."],
      ["pulling off", "A creature can use its action to make a DC 14 Strength check, pulling the scarf off itself or another creature within its reach on a success."],
      ["break the restraint", "As an action, a creature Restrained by an arrow can make a DC 20 Strength (Athletics) check to try to break the restraint."],
      ["to free it", "The target or a creature within reach of it can take an action to make a DC 15 Strength (Athletics) check to free it."],
      ["dislodging", "A creature can use its action to make a DC 15 Strength check, dislodging the spear on a success."],
      ["extinguish", "A creature can end this damage by using its action to make a DC 10 Dexterity check to extinguish the flames."],
      ["doing so with a successful", "As an action, a restrained creature can attempt to free itself from the ice, doing so with a successful DC 20 Strength (Athletics) check."],
    ];
    for (const [label, text] of releases) {
      it(`recognises "${label}"`, () => {
        expect(DDBDescriptions.parseChecks(text)[0].release).toBe(true);
      });
    }

    it("reads the outcome from the sentence that follows a bare check", () => {
      const [check] = DDBDescriptions.parseChecks(
        "The restrained target can use its action to make a DC 15 Strength check. On a success, it is no longer restrained. The scarf is silk.",
      );
      expect(check.release).toBe(true);
      expect(check.sentence).toBe("The restrained target can use its action to make a DC 15 Strength check. On a success, it is no longer restrained.");
    });

    it("does not read a following section label as the outcome", () => {
      const [check] = DDBDescriptions.parseChecks(
        "<p>A creature must make a DC 15 Strength check.</p><p><strong>Flight of the Couatls.</strong> The bow frees the target on a success.</p>",
      );
      expect(check.sentence).toBe("A creature must make a DC 15 Strength check.");
      expect(check.release).toBe(false);
    });
  });

  describe("checks that are not a release", () => {
    const scenery: [string, string][] = [
      ["an attack-or-check alternative", "either by making a successful attack roll against AC 24 or a successful DC 24 Dexterity (Acrobatics) check, freeing the stone."],
      ["holding a lid shut", "a creature outside the vase can make a DC 25 Strength check, preventing you from leaving on a success."],
      ["lock-picking", "A creature proficient with thieves' tools can pick this lock with a successful DC 15 Dexterity check."],
      ["a repair at a rest", "The penalty can be removed by casting the Mending spell on the object or by succeeding on a DC 10 Dexterity check using Smith’s Tools as part of a Short Rest or Long Rest."],
      ["noticing", "A creature notices the caltrops with a successful DC 20 Wisdom (Perception) check."],
      ["prying a book open", "A DC 25 Strength check is required to close it, pry it open, or tear out a page against its will."],
      ["identifying an illusion", "Someone who uses an action to visually inspect the creature identifies it as illusory with a successful DC 15 Intelligence (Investigation) check."],
    ];
    for (const [label, text] of scenery) {
      it(`stays silent on ${label}`, () => {
        const [check] = DDBDescriptions.parseChecks(text);
        expect(check).toBeDefined();
        expect(check.release).toBe(false);
      });
    }
  });

  describe("activation", () => {
    it("reads an action, a bonus action and a reaction", () => {
      expect(DDBDescriptions.parseChecks("As an action, make a DC 10 Strength check to escape.")[0].activation).toBe("action");
      expect(DDBDescriptions.parseChecks("As a bonus action, make a DC 10 Strength check to escape.")[0].activation).toBe("bonus");
      expect(DDBDescriptions.parseChecks("can use its reaction to make a DC 10 Strength check to escape.")[0].activation).toBe("reaction");
      expect(DDBDescriptions.parseChecks("take the Utilize action to make a DC 30 Strength (Athletics) check to escape.")[0].activation).toBe("action");
    });

    it("defaults an escape to an action and anything else to special", () => {
      expect(DDBDescriptions.parseChecks("Bursting free requires a successful DC 20 Strength check.")[0].activation).toBe("action");
      expect(DDBDescriptions.parseChecks("A controlled creature can make a DC 17 Charisma check each day at dawn. On a success, it is no longer affected.")[0].activation).toBe("special");
    });
  });

  it("ignores checks that are rows of a table once the caller strips it", () => {
    const text = "<p>Roll on the table.</p><table><tr><td>It takes a successful DC 20 Strength check to free yourself.</td></tr></table>";
    expect(DDBDescriptions.parseChecks(DDBDescriptions.stripTables(text))).toEqual([]);
  });

  it("returns checks in source order", () => {
    const text = "Escaping requires a successful DC 20 Dexterity (Sleight of Hand) check as an action. Bursting them requires a successful DC 25 Strength (Athletics) check as an action.";
    expect(DDBDescriptions.parseChecks(text).map((check) => check.dc.formula)).toEqual(["20", "25"]);
  });

  it("returns nothing for text without a check", () => {
    expect(DDBDescriptions.parseChecks("must succeed on a DC 15 Strength saving throw")).toEqual([]);
    expect(DDBDescriptions.parseChecks("")).toEqual([]);
  });
});

describe("DDBDescriptions.checkKey", () => {
  it("treats the same roll at the same DC as one property", () => {
    const [first, second] = DDBDescriptions.parseChecks(
      "make a DC 15 Strength (Athletics) check to escape. Later it can repeat the DC 15 Strength (Athletics) check to escape.",
    );
    expect(DDBDescriptions.checkKey(first)).toBe(DDBDescriptions.checkKey(second));
  });

  it("separates the same DC asked of a different skill", () => {
    const [first, second] = DDBDescriptions.parseChecks(
      "make a DC 20 Dexterity (Sleight of Hand) check to escape. Or make a DC 20 Strength (Athletics) check to escape.",
    );
    expect(DDBDescriptions.checkKey(first)).not.toBe(DDBDescriptions.checkKey(second));
  });
});
