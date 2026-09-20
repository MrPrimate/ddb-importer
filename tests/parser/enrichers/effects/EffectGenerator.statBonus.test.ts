import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// Item ability score bonuses stop at a ceiling. With DAE that is a min() override. DDB has no field
// for the ceiling: an item's own limit is in the modifier's restriction text, otherwise the actor's
// score maximum applies. A penalty can carry a floor the same way.

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

const modifier = (subType: string, value: number, restriction = ""): any => ({
  type: "bonus",
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  statId: null,
  dice: null,
  duration: null,
  modifierTypeId: 1,
});

describe("EffectGenerator ability score bonuses with DAE", () => {
  beforeEach(() => {
    (globalThis as any).game.modules = new Map([["dae", { active: true }]]);
  });

  afterEach(() => {
    (globalThis as any).game.modules = new Map();
  });

  it("limits an unrestricted bonus to the actor's score maximum", () => {
    const generator = buildGenerator([modifier("strength-score", 2)]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.changes).toEqual([
      expect.objectContaining({
        key: "system.abilities.str.value",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "min(@abilities.str.max, @abilities.str.value + 2)",
        priority: 5,
      }),
    ]);
  });

  it.each([
    ["to a maximum of 24", "min(24, @abilities.str.value + 2)"],
    ["Your Strength increases by 2, to a maximum of 30.", "min(30, @abilities.str.value + 2)"],
    ["Can exceed 20, but not 30", "min(30, @abilities.str.value + 2)"],
    ["While the stone orbits your head", "min(@abilities.str.max, @abilities.str.value + 2)"],
    ["+2 to maximum score", "min(@abilities.str.max, @abilities.str.value + 2)"],
  ])("reads the item's own ceiling from the restriction text: %s", (restriction, value) => {
    const generator = buildGenerator([modifier("strength-score", 2, restriction)]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.changes).toEqual([expect.objectContaining({ value })]);
  });

  it("stops a penalty at a written floor", () => {
    const generator = buildGenerator([modifier("intelligence-score", -4, "Curse. (minimum of 7)")]);
    generator._addStatBonusEffect("intelligence-score");
    expect(generator.effect.changes).toEqual([
      expect.objectContaining({
        key: "system.abilities.int.value",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: "max(7, @abilities.int.value + -4)",
      }),
    ]);
  });

  it("leaves a penalty with no floor as a plain signed add", () => {
    const generator = buildGenerator([modifier("strength-score", -2)]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.str.value", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -2 }),
    ]);
  });
});

describe("EffectGenerator ability score bonuses without DAE", () => {
  beforeEach(() => {
    (globalThis as any).game.modules = new Map();
  });

  it("falls back to a signed add", () => {
    const generator = buildGenerator([modifier("strength-score", 2, "to a maximum of 24")]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.str.value", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+2" }),
    ]);
  });
});
