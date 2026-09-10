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

const buildGenerator = (grantedModifiers: any[], type = "feature", documentType?: string): any => {
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
    document: { name: "Test Feature", type: documentType, effects: [], flags: {} },
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
  const UNARMED_CONDITION = { k: "roll.attack.classification", o: "in", v: ["unarmed", "natural"] };

  // real callers pass "feat" (DDBFeatureMixin._addEffects) while the generator's own union and
  // these builders say "feature"; the gate must accept both or one side silently gets nothing
  it.each(["feat", "feature"])("emits a %s document's unarmed attack bonus as a classification-gated rule", (type) => {
    // Improved Predatory Strikes (Order of the Lycan). The bonus used to be baked into martial
    // arts activities by DDBAction.getBonusDamage, which never reached the enricher-built
    // Predatory Strike activities; the feature's own transfer effect now owns it
    const generator = buildGenerator([modifier("bonus", "unarmed-attacks", 1)], type);
    generator._addWeaponAttackBonuses();

    expect(generator.effect.system.changes).toHaveLength(1);
    const [change] = generator.effect.system.changes;
    expect(change).toMatchObject({ key: "attack", value: "1", type: "dnd5e.bonus", priority: 20 });
    expect(JSON.parse(change.conditions)).toEqual(UNARMED_CONDITION);
  });

  it("combines the incremental stages into one rule rather than competing changes", () => {
    // the three Improved Predatory Strikes options each grant +1
    const generator = buildGenerator([
      modifier("bonus", "unarmed-attacks", 1),
      modifier("bonus", "unarmed-attacks", 1),
      modifier("bonus", "unarmed-attacks", 1),
    ], "feat");
    generator._addWeaponAttackBonuses();

    expect(generator.effect.system.changes).toHaveLength(1);
    expect(generator.effect.system.changes[0].value).toBe("1 + 1 + 1");
  });

  it("leaves a restricted modifier to a reviewed condition instead of widening the gate", () => {
    const generator = buildGenerator([
      { ...modifier("bonus", "unarmed-attacks", 2), restriction: "while raging" },
    ], "feat");
    generator._addWeaponAttackBonuses();
    expect(generator.effect.system.changes).toEqual([]);
  });

  it.each(["item", "equipment", "infusion", "spell"])("does not emit an attack rule for a %s, whose own enricher owns the choice", (type) => {
    // per item that is either a conditioned rule (Wraps of Dyamak, Demon Padded Armor) or an
    // enchantment (Wraps of Unarmed Power, Eldritch Claw Tattoo); either way a generic rule
    // emitted here would be a second copy
    const generator = buildGenerator([modifier("bonus", "unarmed-attacks", 1)], type);
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

describe("EffectGenerator weapon-specific damage bonuses", () => {
  // Bracers of Archery: DDB puts the weapon slug in the damage modifier subtype. These used to fall
  // through to the unconditional melee AND ranged bonuses, so the +2 landed on every weapon roll.
  it("emits one rule per weapon gated on the rolled item's base item", () => {
    const generator = buildGenerator([
      modifier("damage", "longbow", 2),
      modifier("damage", "shortbow", 2),
    ]);
    generator._addGlobalDamageBonus();

    const changes = generator.effect.system.changes;
    expect(changes.map((c: any) => c.key)).toEqual(["damage", "damage"]);
    expect(changes.map((c: any) => JSON.parse(c.conditions))).toEqual([
      { k: "roll.item.type.baseItem", o: "exact", v: "longbow" },
      { k: "roll.item.type.baseItem", o: "exact", v: "shortbow" },
    ]);
    expect(changes.map((c: any) => c.value)).toEqual(["2", "2"]);
  });

  it("resolves hyphenated DDB weapon slugs to the dnd5e id", () => {
    expect(EffectGenerator.weaponBaseItemForSubType("hand-crossbow")).toBe("handcrossbow");
    expect(EffectGenerator.weaponBaseItemForSubType("light-hammer")).toBe("lighthammer");
    expect(EffectGenerator.weaponBaseItemForSubType("additional")).toBeNull();
    expect(EffectGenerator.weaponBaseItemForSubType(null)).toBeNull();
  });

  it("keeps weapon-scoped damage modifiers on equipment but not on a weapon", () => {
    // items normally drop damage modifiers because a weapon bakes them into its damage parts
    const bracers = buildGenerator([modifier("damage", "longbow", 2), modifier("damage", "additional", 1)], "item", "equipment");
    bracers._addGlobalDamageBonus();
    expect(bracers.effect.system.changes.map((c: any) => [c.key, JSON.parse(c.conditions).v])).toEqual([["damage", "longbow"]]);

    const bow = buildGenerator([modifier("damage", "longbow", 2)], "item", "weapon");
    bow._addGlobalDamageBonus();
    expect(bow.effect.system.changes).toEqual([]);
  });

  it("keeps a weapon-specific bonus out of the unconditional bonuses", () => {
    const generator = buildGenerator([
      modifier("damage", "longbow", 2),
      modifier("damage", "additional", 1),
    ]);
    generator._addGlobalDamageBonus();

    const changes = generator.effect.system.changes;
    expect(changes.map((c: any) => c.key)).toEqual([
      "damage",
      "system.rolls.damage.mwak.bonus",
      "system.rolls.damage.rwak.bonus",
    ]);
    expect(changes[1].value).toBe("1");
    expect(changes[2].value).toBe("1");
  });
});
