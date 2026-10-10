import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// dnd5e 5.2 does not read "ALL" in the damage immunity set, so an all-damage immunity adds every
// damage type instead.

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
    ddbItem: {
      definition: {
        name: "Test Item",
        grantedModifiers,
        isConsumable: false,
        canEquip: true,
        canAttune: false,
      },
    },
    document: { name: "Test Item", type: "equipment", effects: [], flags: {} },
    type: "item",
    isCompendiumItem: true,
  });
};

const immunity = (subType: string): any => ({
  type: "immunity",
  subType,
  restriction: "",
  bonusTypes: [],
  fixedValue: null,
  value: null,
  statId: null,
  dice: null,
  duration: null,
  modifierTypeId: 2,
});

describe("EffectGenerator all-damage immunity on dnd5e 5.2", () => {
  it("adds every damage type rather than an ALL entry", () => {
    const generator = buildGenerator([immunity("all")]);
    generator._addDamageConditions();
    const values = generator.effect.changes
      .filter((change: any) => change.key === "system.traits.di.value")
      .map((change: any) => change.value);
    expect(values).toEqual(expect.arrayContaining(Object.keys(CONFIG.DND5E.damageTypes)));
    expect(values).not.toContain("all");
    expect(values).not.toContain("ALL");
  });
});
