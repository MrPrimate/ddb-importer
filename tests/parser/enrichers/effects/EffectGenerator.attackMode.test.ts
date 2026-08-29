import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// DDB carries a few attack-shape gates in the modifier subtype rather than in a restriction
// string, so they survive restriction filtering and used to be flattened onto every melee or
// every weapon roll: Dueling's +2 reached two-handed swings, and an unarmed damage bonus reached
// weapon attacks. `system.rolls.damage.<type>.bonus` cannot express either gate, so these emit a
// dnd5e 6.0 rule change whose condition the system tests against the attack actually rolled.

const ddb: any = {
  character: {
    classes: [],
    modifiers: { class: [], race: [], background: [], feat: [], item: [], condition: [] },
    optionalClassFeatures: [],
    options: { class: [] },
    choices: { class: [] },
  },
};

const buildGenerator = (grantedModifiers: any[], type = "feature"): any => {
  return new (EffectGenerator as any)({
    ddb,
    character: { flags: {}, system: {} },
    ddbItem: {
      definition: {
        name: "Test Feature",
        grantedModifiers,
        isConsumable: false,
        canEquip: true,
        canAttune: false,
      },
    },
    document: { name: "Test Feature", effects: [], flags: {} },
    type,
    isCompendiumItem: true,
    separateACEffects: false,
  });
};

const modifier = (type: string, subType: string, value: number): any => ({
  type,
  subType,
  restriction: "",
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
  modifierTypeId: null,
});

describe("EffectGenerator attack mode gated damage", () => {
  it("emits Dueling as a damage rule gated on the one-handed attack mode", () => {
    const generator = buildGenerator([modifier("damage", "one-handed-melee-attacks", 2)]);
    generator._addGlobalDamageBonus();

    expect(generator.effect.system.changes).toHaveLength(1);
    const [change] = generator.effect.system.changes;
    expect(change).toMatchObject({ key: "damage", value: "2", type: "dnd5e.bonus", priority: 22 });
    expect(JSON.parse(change.conditions)).toEqual({ k: "roll.attack.mode", v: "oneHanded" });
  });

  it("emits a feature's unarmed damage bonus gated on the attack classification", () => {
    // Bestial Aspect Level 4 is the live case; this used to land on every melee and ranged roll
    const generator = buildGenerator([modifier("damage", "unarmed-attacks", 1)]);
    generator._addGlobalDamageBonus();

    expect(generator.effect.system.changes).toHaveLength(1);
    // "natural" covers DDB's attackSubtype 2 claws, bites and talons, which the rules count as
    // unarmed strikes for this kind of bonus
    expect(JSON.parse(generator.effect.system.changes[0].conditions)).toEqual({
      k: "roll.attack.classification", o: "in", v: ["unarmed", "natural"],
    });
  });

  it("keeps a gated subtype out of the unconditional melee and ranged bonuses", () => {
    const generator = buildGenerator([
      modifier("damage", "one-handed-melee-attacks", 2),
      modifier("damage", "additional", 1),
    ]);
    generator._addGlobalDamageBonus();

    const keys = generator.effect.system.changes.map((c: any) => c.key);
    expect(keys).toEqual([
      "damage",
      "system.rolls.damage.mwak.bonus",
      "system.rolls.damage.rwak.bonus",
    ]);
    // only the gated one carries a condition; the untyped bonus still applies to everything
    expect(generator.effect.system.changes[1].conditions).toBeUndefined();
    expect(generator.effect.system.changes[1].value).toBe("1");
  });

  it("emits nothing when no modifier uses a gated subtype", () => {
    const generator = buildGenerator([modifier("bonus", "hit-points", 5)]);
    generator._addGlobalDamageBonus();
    expect(generator.effect.system.changes).toEqual([]);
  });
});

describe("EffectGenerator unarmed attack bonuses", () => {
  it("does not emit an attack rule for a feature, which DDBAction bakes into the activity", () => {
    // Improved Predatory Strikes grants this and its Predatory Strike actions are martial arts,
    // so DDBAction.getBonusDamage already puts the bonus on the attack; emitting would double it
    const generator = buildGenerator([modifier("bonus", "unarmed-attacks", 1)], "feature");
    generator._addWeaponAttackBonuses();
    expect(generator.effect.system.changes).toEqual([]);
  });

  it("does not emit an attack rule for an item, whose own enricher owns the choice", () => {
    // per item that is either a conditioned rule (Wraps of Dyamak, Demon Padded Armor) or an
    // enchantment (Wraps of Unarmed Power, Eldritch Claw Tattoo); either way a generic rule
    // emitted here would be a second copy
    const generator = buildGenerator([modifier("bonus", "unarmed-attacks", 1)], "item");
    generator._addWeaponAttackBonuses();
    expect(generator.effect.system.changes).toEqual([]);
  });

  it("leaves the flat melee and ranged attack bonuses alone", () => {
    const generator = buildGenerator([modifier("bonus", "melee-attacks", 2)]);
    generator._addWeaponAttackBonuses();

    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.rolls.attack.mwak.bonus", value: "2", type: "add" }),
    ]);
  });
});

describe("EffectGenerator item damage modifiers", () => {
  it("still strips every damage modifier an item carries", () => {
    // an item's damage modifiers describe the item's own damage, which DDBItem owns, and the
    // unarmed magic items express their bonus as an enchantment instead
    const generator = buildGenerator([modifier("damage", "unarmed-attacks", 1)], "item");
    generator._addGlobalDamageBonus();
    expect(generator.effect.system.changes).toEqual([]);
  });
});
