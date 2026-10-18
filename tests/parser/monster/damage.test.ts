// DDBMonsterDamage imports DDBMonsterFeature - mock it to avoid the full chain
vi.mock("../../../src/parser/monster/features/DDBMonsterFeature", () => ({
  default: class DDBMonsterFeature {},
}));

import { DDBMonsterDamage } from "../../../src/parser/monster/features/DDBMonsterDamage";

// =============================================================================
// DAMAGE_EXPRESSION - regex for matching damage in monster descriptions
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
// REGAIN_EXPRESSION - regex for matching healing/regain
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
// damageMatchSave - detects save-based damage from match groups
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
// _getDamageTypes - extracts damage types from match text
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

// =============================================================================
// generateDamage - produces the { damageString, damageTypes } parts array that
// DDBMonsterFeature copies into flags.monsterMunch.actionData.damageParts (the
// shape DDBEffectHelper.getMonsterFeatureDamage / over-time effects consume)
// =============================================================================
describe("DDBMonsterDamage.generateDamage (damageParts shape)", () => {
  function makeDamage(hit: string, { isAttack = false }: { isAttack?: boolean } = {}) {
    // DAMAGE_EXPRESSION is a shared static regex with the /g flag; earlier tests in
    // this file leave its lastIndex advanced, which matchAll would seed from.
    DDBMonsterDamage.DAMAGE_EXPRESSION.lastIndex = 0;
    const feature = {
      name: "Test",
      isAttack,
      templateType: "monster",
      actionData: {},
      damageModReplace: (s: string) => s,
    };
    const dmg = new DDBMonsterDamage(hit, { ddbMonsterFeature: feature as any });
    dmg.generateDamage();
    return dmg;
  }

  it("generates a { damageString, damageTypes } part for save-based over-time damage", () => {
    const dmg = makeDamage("the target keeps taking 7 (2d6) fire damage on a failed save");
    expect(dmg.damageParts).toHaveLength(1);
    expect(dmg.damageParts[0].damageString).toBe("2d6");
    expect(dmg.damageParts[0].damageTypes).toContain("fire");
    expect(dmg.damageParts[0].part).toBeDefined(); // I5eDamagePart object
  });

  it("generates a { damageString, damageTypes } part for plain hit damage", () => {
    const dmg = makeDamage("Hit: 10 (2d6 + 3) slashing damage.");
    expect(dmg.damageParts).toHaveLength(1);
    expect(dmg.damageParts[0].damageString).toBe("2d6 + 3");
    expect(dmg.damageParts[0].damageTypes).toContain("slashing");
    expect(dmg.damageParts[0].part).toBeDefined();
  });

  it("folds a damage type choice into the part before it rather than an alternative", () => {
    const dmg = makeDamage("Hit: 19 (2d10 + 8) piercing damage plus 10 (3d6) necrotic damage or (3d6) radiant damage (the son’s choice).");
    expect(dmg.damageParts.map((p) => p.damageTypes)).toEqual([["piercing"], ["necrotic", "radiant"]]);
    expect(dmg.damageParts[1].part.types).toEqual(["necrotic", "radiant"]);
    expect(dmg.versatileParts).toEqual([]);
  });

  it("keeps the condition of an or-alternative for naming its activity", () => {
    const dmg = makeDamage("Hit: 7 (2d6) piercing damage, or 3 (1d6) piercing damage if the swarm has half of its hit points or fewer. The target must make a DC 10 Constitution saving throw.");
    expect(dmg.versatileParts).toHaveLength(1);
    expect(dmg.versatileCondition).toBe("the swarm has half of its hit points or fewer");
  });

  it("splits damage dealt on later turns out of an attack's hit", () => {
    const dmg = makeDamage("Hit: 22 (3d8 + 9) piercing damage. If the target is a Large or smaller creature, it must succeed on a DC 19 Dexterity saving throw or be swallowed by the worm. A swallowed creature is blinded and restrained, and it takes 21 (6d6) acid damage at the start of each of the worm’s turns.", { isAttack: true });
    expect(dmg.damageParts.map((p) => p.damageString)).toEqual(["3d8 + 9"]);
    expect(dmg.recurringParts.map((p) => p.damageString)).toEqual(["6d6"]);
    expect(dmg.recurringParts[0].damageTypes).toEqual(["acid"]);
    expect(dmg.recurringTiming).toBe("turnStart");
    expect(dmg.recurringCondition).toMatch(/^A swallowed creature .* start of each of the worm’s turns\.$/);
  });

  it("takes every roll of a 'takes X and Y at the start of' clause, and only that clause", () => {
    const dmg = makeDamage("Hit: 10 (2d6 + 3) slashing damage. While restrained, a creature takes 7 (2d6) slashing damage and 7 (2d6) necrotic damage at the start of each of the genie’s turns.", { isAttack: true });
    expect(dmg.damageParts.map((p) => p.damageString)).toEqual(["2d6 + 3"]);
    expect(dmg.recurringParts.map((p) => p.damageTypes[0])).toEqual(["slashing", "necrotic"]);
  });

  it("keeps the hit's own roll when a later-turn roll is joined to it", () => {
    const dmg = makeDamage("Hit: 10 (4d4) acid damage and 5 (2d4) acid damage at the end of its next turn.", { isAttack: true });
    expect(dmg.damageParts.map((p) => p.damageString)).toEqual(["4d4"]);
    expect(dmg.recurringParts.map((p) => p.damageString)).toEqual(["2d4"]);
    expect(dmg.recurringTiming).toBe("turnEnd");
  });

  it("leaves a rider in its own sentence, a save's damage and non-attacks alone", () => {
    const rider = makeDamage("Hit: 2 (1d4) acid damage. At the end of each of its turns, the target must make a DC 10 Constitution saving throw.", { isAttack: true });
    expect(rider.recurringParts).toEqual([]);
    const save = makeDamage("Hit: 6 (1d8 + 2) slashing damage, and the target must succeed on a DC 16 Constitution saving throw or take 5 (2d4) slashing damage at the start of each of its turns.", { isAttack: true });
    expect(save.recurringParts).toEqual([]);
    const trait = makeDamage("While in sunlight, it takes 20 radiant damage at the start of its turn.");
    expect(trait.recurringParts).toEqual([]);
  });

  it("splits a save's later-turn roll out of its failure damage, keeping the first roll", () => {
    const dmg = makeDamage("Strength Saving Throw: DC 14, one creature. Failure: 13 (3d8) Bludgeoning damage. While trapped, the target has the Restrained condition and takes 7 (2d6) Necrotic damage at the start of each of its turns.");
    expect(dmg.damageParts.map((p) => p.damageString)).toEqual(["3d8"]);
    expect(dmg.recurringParts.map((p) => p.damageString)).toEqual(["2d6"]);
    expect(dmg.recurringTiming).toBe("turnStart");
  });

  it("splits a save's delayed roll at the end of the target's next turn", () => {
    const dmg = makeDamage("Dexterity Saving Throw: DC 14, each creature in a Sphere. Failure: 18 (4d8) Acid damage, and 9 (2d8) Acid damage at the end of the target’s next turn. Success: Half initial damage only.");
    expect(dmg.damageParts.map((p) => p.damageString)).toEqual(["4d8"]);
    expect(dmg.recurringParts.map((p) => p.damageString)).toEqual(["2d8"]);
    expect(dmg.recurringTiming).toBe("turnEnd");
  });

  it("splits a save's triggered roll with no turn boundary", () => {
    const dmg = makeDamage("Intelligence Saving Throw: DC 15, each creature nearby. Failure: 22 (4d10) Psychic damage. For 1 minute, whenever the target takes the Magic action, it takes 7 (2d6) Psychic damage. Success: Half damage only.");
    expect(dmg.damageParts.map((p) => p.damageString)).toEqual(["4d10"]);
    expect(dmg.recurringParts.map((p) => p.damageString)).toEqual(["2d6"]);
    expect(dmg.recurringTiming).toBe("special");
  });

  it("moves every roll of a joined later-turn clause, the first included", () => {
    const dmg = makeDamage("The target must succeed on a DC 18 Charisma saving throw or be swallowed. While swallowed, the creature takes 14 (4d6) acid damage and 14 (4d6) force damage at the start of each of the monster's turns.");
    expect(dmg.damageParts).toEqual([]);
    expect(dmg.recurringParts.map((p) => p.damageTypes[0])).toEqual(["acid", "force"]);
  });

  it("finds a joined later-turn clause whose boundary the expression takes into its suffix", () => {
    const text = "The target must succeed on a DC 20 Charisma saving throw or be swallowed, and it takes 14 (4d6) acid damage and 14 (4d6) force damage at the start of each of the monster's turns. If the monster takes 30 damage or more on a single turn, it must succeed on a DC 15 Constitution saving throw.";
    const matches = [...text.matchAll(new RegExp(DDBMonsterDamage.DAMAGE_EXPRESSION))] as any[];
    // the force roll's match ends in "at the start of", leaving nothing after it to test
    expect(matches[1].groups.suffix.trim()).toBe("at the start of");
    expect(DDBMonsterDamage.laterRolls(text, matches).map((m) => m.groups.type)).toEqual(["acid", "force"]);
  });

  it("keeps two rolls of one failure together", () => {
    const dmg = makeDamage("Dexterity Saving Throw: DC 16, each creature in a Cone. Failure: 14 (4d6) Necrotic damage plus 14 (4d6) Psychic damage. Success: Half damage only.");
    expect(dmg.recurringParts).toEqual([]);
  });

  it("reads rolled temporary hit points as a temphp part", () => {
    const dmg = makeDamage("The brawler gains 13 (3d8) Temporary Hit Points.");
    dmg.generateRegain();
    expect(dmg.healingParts).toHaveLength(1);
    expect(dmg.healingParts[0].part).toMatchObject({ number: 3, denomination: 8, types: ["temphp"] });
  });

  it("prefers regained hit points and ignores flat temporary hit points", () => {
    const both = makeDamage("The knight regains 10 (3d6) hit points and gains 5 (1d10) temporary hit points.");
    both.generateRegain();
    expect(both.healingParts[0].part.types).toEqual(["healing"]);
    const flat = makeDamage("Anyone under this effect gains 5 temporary hit points at the start of each of their turns.");
    flat.generateRegain();
    expect(flat.healingParts).toEqual([]);
  });

  it("records no condition for a two-handed alternative", () => {
    const dmg = makeDamage("Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage if used with two hands.");
    expect(dmg.versatileCondition).toBe("");
  });
});

describe("DDBMonsterDamage damage modes beside save damage", () => {
  function makeAttack(hit: string) {
    DDBMonsterDamage.DAMAGE_EXPRESSION.lastIndex = 0;
    const feature = { name: "Test", isAttack: true, templateType: "monster", actionData: {}, damageModReplace: (s: string) => s };
    const dmg = new DDBMonsterDamage(hit, { ddbMonsterFeature: feature as any });
    dmg.generateDamage();
    return dmg;
  }

  it("keeps a failed-save roll on the save, off the hit and its modes", () => {
    const dmg = makeAttack("Hit: 7 (1d8 + 3) piercing damage plus 3 (1d6) fire damage if the target is Prone. The target must make a DC 12 Constitution saving throw. On a failed save, it takes 7 (2d6) poison damage.");
    expect(dmg.damageParts.map((part) => part.damageString)).toEqual(["1d8 + 3"]);
    expect(dmg.saveParts).toMatchObject([{ number: 2, denomination: 6, types: ["poison"] }]);
    expect(dmg.damageModes.map((mode) => mode.damageParts.map((part) => part.damageString))).toEqual([["1d8 + 3", "1d6"]]);
  });

  it("reads \"saving throw or take\" as save damage, though the match starts at its prefix", () => {
    const dmg = makeAttack("Hit: 7 (1d8 + 3) piercing damage, or 12 (2d8 + 3) piercing damage if the target is Prone, and the target must succeed on a DC 13 Constitution saving throw or take 10 (3d6) poison damage.");
    expect(dmg.damageParts.map((part) => part.damageString)).toEqual(["1d8 + 3"]);
    expect(dmg.damageModes.map((mode) => mode.damageParts.map((part) => part.damageString))).toEqual([["2d8 + 3"]]);
    expect(dmg.saveParts).toMatchObject([{ number: 3, denomination: 6, types: ["poison"] }]);
  });
});
