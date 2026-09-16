import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// DDB sends some speed bonuses with a null value, describing the speed in the restriction text
// or leaving it to the item's own rules. Parsing the null used to emit a NaN speed change.

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
    separateACEffects: false,
  });
};

const speedModifier = (subType: string, value: number | null, restriction = "", duration: any = null): any => ({
  type: "bonus",
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
  duration,
  modifierTypeId: 1,
});

describe("EffectGenerator speed bonuses", () => {
  it("keeps numeric speed bonuses as flat additions", () => {
    const generator = buildGenerator([speedModifier("speed-walking", 10)]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.walk", value: "10", type: "add" }),
    ]);
  });

  it("skips a null speed bonus with no restriction instead of emitting NaN", () => {
    const generator = buildGenerator([speedModifier("speed", null)]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toHaveLength(0);
  });

  it("leaves timed null speed bonuses to the enricher", () => {
    const generator = buildGenerator([
      speedModifier("speed-flying", null, "Equal to your walking speed", { durationInterval: 10, durationUnit: "Minute" }),
    ]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toHaveLength(0);
  });

  it("sets a speed equal to walking speed from the restriction", () => {
    const generator = buildGenerator([speedModifier("speed-swimming", null, "You have a Swim Speed equal to your Speed.")]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({
        key: "system.attributes.movement.speeds.swim",
        value: "@attributes.movement.speeds.walk",
        type: "upgrade",
      }),
    ]);
  });

  it("sets a speed from a distance in the restriction", () => {
    const generator = buildGenerator([speedModifier("speed-flying", null, "20ft. fly speed")]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.speeds.fly", value: "20", type: "upgrade" }),
    ]);
  });

  it("emits a single movement multiplier for a doubled speed repeated across speed types", () => {
    const generator = buildGenerator([
      speedModifier("speed", null, "Speed Doubled"),
      speedModifier("speed-flying", null, "Speed Doubled"),
      speedModifier("speed-swimming", null, "Speed Doubled"),
    ]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.multiplier", value: "2", type: "multiply" }),
    ]);
  });

  it("emits a halving multiplier for a halved speed", () => {
    const generator = buildGenerator([speedModifier("speed-climbing", null, "Speed Halved")]);
    generator._addBonusSpeeds();

    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.attributes.movement.multiplier", value: "0.5", type: "multiply" }),
    ]);
  });
});
