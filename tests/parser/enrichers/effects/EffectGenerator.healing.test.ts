import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// DDB's "Spell Group - Healing" bonus (Disciple of Life) is "2 + the spell's level". The
// rule value is injected into the heal roll as the @ruleBonus part and dnd5e resolves the
// nested @item.level recursively (#7354), so the level term rides on the rule itself.

const ddb: any = {
  character: {
    classes: [],
    modifiers: { class: [], race: [], background: [], feat: [], item: [], condition: [] },
    optionalClassFeatures: [],
    options: { class: [] },
    choices: { class: [] },
  },
};

const buildGenerator = (grantedModifiers: any[]): any => {
  return new (EffectGenerator as any)({
    ddb,
    character: { flags: {}, system: {} },
    ddbItem: { definition: { name: "Disciple of Life", grantedModifiers } },
    document: { name: "Disciple of Life", effects: [], flags: {} },
    type: "feat",
    isCompendiumItem: true,
    separateACEffects: false,
  });
};

const healingRules = (generator: any): any[] =>
  generator.effect.system.changes.filter((c: any) => c.key === "healing");

describe("EffectGenerator spell-group-healing rule", () => {
  it("emits the flat bonus plus the cast level, gated on levelled spells", () => {
    const generator = buildGenerator([
      { type: "bonus", subType: "spell-group-healing", restriction: "", value: 2, statId: null, dice: null },
    ]);
    generator._addSpellAttackBonuses();
    const rules = healingRules(generator);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ key: "healing", type: "dnd5e.bonus", value: "2 + @item.level", priority: 18 });
    // a cantrip reports item.level 0 and a potion or feature has no item.level at all, so this
    // one clause is both the RAW "spell of 1st level or higher" and the guard against an
    // unresolvable @item.level on non-spell healing
    expect(JSON.parse(rules[0].conditions)).toEqual({ k: "item.level", o: "gte", v: 1 });
  });

  it("emits nothing without the modifier", () => {
    const generator = buildGenerator([]);
    generator._addSpellAttackBonuses();
    expect(healingRules(generator)).toEqual([]);
  });
});
