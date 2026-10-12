import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// DDB sends some senses with a null value and the range only in the restriction text
// ("Within the Range of Aura of Protection"). Parsing the null used to emit a "NaN" upgrade.

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
    document: { name: "Test Item", effects: [], flags: {} },
    type: "item",
    isCompendiumItem: true,
  });
};

const senseModifier = (type: string, subType: string, value: number | null, restriction = ""): any => ({
  type,
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
});

const senseChanges = (generator: any): any[] =>
  generator.effect.system.changes.filter((c: any) => c.key.startsWith("system.attributes.senses.ranges."));

describe("EffectGenerator._addSenseBonus", () => {
  it("creates no sense change for a set-base sense without a value", () => {
    const generator = buildGenerator([
      senseModifier("set-base", "blindsight", null, "Within the Range of Aura of Protection"),
    ]);
    generator._addSenseBonus();
    expect(senseChanges(generator)).toEqual([]);
  });

  it("upgrades to the largest valued set-base sense and ignores one without a value", () => {
    const generator = buildGenerator([
      senseModifier("set-base", "darkvision", null),
      senseModifier("set-base", "darkvision", 60),
      senseModifier("set-base", "darkvision", 120),
    ]);
    generator._addSenseBonus();
    const changes = senseChanges(generator);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: "system.attributes.senses.ranges.darkvision", type: "upgrade", value: "120" });
  });

  it("adds valued sense bonuses and ignores one without a value", () => {
    const generator = buildGenerator([
      senseModifier("sense", "darkvision", 30),
      senseModifier("sense", "darkvision", null),
    ]);
    generator._addSenseBonus();
    const changes = senseChanges(generator);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ key: "system.attributes.senses.ranges.darkvision", type: "add", value: "30" });
  });
});
