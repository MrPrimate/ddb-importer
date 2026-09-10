import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// Potent Spellcasting: DDB's "<class>-cantrip-damage" bonus with a stat becomes a native damage rule
// gated on a cantrip granted by that class, replacing the old parse-time "+ @mod" bake on every
// cantrip of the class and the AC5e-only effect arm.

const ddb: any = {
  character: {
    classes: [],
    modifiers: { class: [], race: [], background: [], feat: [], item: [], condition: [] },
    optionalClassFeatures: [],
    options: { class: [] },
    choices: { class: [] },
  },
};

const buildGenerator = (grantedModifiers: any[], type = "feat"): any => {
  return new (EffectGenerator as any)({
    ddb,
    character: { flags: {}, system: {} },
    ddbItem: { definition: { name: "Potent Spellcasting", grantedModifiers } },
    document: { name: "Potent Spellcasting", effects: [], flags: {} },
    type,
    isCompendiumItem: true,
    separateACEffects: false,
  });
};

const damageRules = (generator: any): any[] =>
  generator.effect.system.changes.filter((c: any) => c.key === "damage");

const wisdomBoost = (overrides: any = {}) => ({
  type: "bonus", subType: "cleric-cantrip-damage", restriction: "", value: null, statId: 5, ...overrides,
});

describe("EffectGenerator._addCantripDamageBonus", () => {
  it("emits the ability modifier as a damage rule gated on a cantrip of the granting class", () => {
    const generator = buildGenerator([wisdomBoost()]);
    generator._addCantripDamageBonus();
    const rules = damageRules(generator);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ key: "damage", type: "dnd5e.bonus", value: "@abilities.wis.mod", priority: 20 });
    expect(JSON.parse(rules[0].conditions)).toEqual([
      { k: "roll.item.level", o: "exact", v: 0 },
      { k: "roll.item.classIdentifier", o: "exact", v: "cleric" },
    ]);
  });

  it("keys the class and the ability from the modifier", () => {
    const generator = buildGenerator([wisdomBoost({ subType: "artificer-cantrip-damage", statId: 4 })]);
    generator._addCantripDamageBonus();
    const [rule] = damageRules(generator);
    expect(rule.value).toBe("@abilities.int.mod");
    expect(JSON.parse(rule.conditions)[1]).toEqual({ k: "roll.item.classIdentifier", o: "exact", v: "artificer" });
  });

  it("ignores a restricted modifier (the 2024 temp-HP rider) and one with no stat", () => {
    const generator = buildGenerator([
      wisdomBoost({ restriction: "Grant Wisdom × 2 Temporary HP to you or another creature within 60 ft. of you." }),
      wisdomBoost({ statId: null, value: 2 }),
    ]);
    generator._addCantripDamageBonus();
    expect(damageRules(generator)).toEqual([]);
  });

  it("is feature-only", () => {
    const generator = buildGenerator([wisdomBoost()], "item");
    generator._addCantripDamageBonus();
    expect(damageRules(generator)).toEqual([]);
  });
});
