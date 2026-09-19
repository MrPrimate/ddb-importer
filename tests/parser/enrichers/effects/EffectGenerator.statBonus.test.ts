import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// Item ability score bonuses stop at a ceiling. With DAE that is a min() override; natively dnd5e 6
// clamps an add written as "delta<=limit". DDB has no field for the ceiling: an item's own limit is
// in the modifier's restriction text, otherwise it is the standard maximum plus what the same item
// adds to the score maximum. `@abilities.x.max` is null until derived data, so it cannot be the limit.

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

const modifier = (subType: string, value: number, statId: number | null = null, restriction = ""): any => ({
  type: "bonus",
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  statId,
  dice: null,
  duration: null,
  modifierTypeId: 1,
});

describe("EffectGenerator ability score bonuses without DAE", () => {
  beforeEach(() => {
    (globalThis as any).game.modules = new Map();
  });

  it("clamps a positive bonus at the standard maximum", () => {
    const generator = buildGenerator([modifier("strength-score", 2)]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.str.value", type: "add", value: "2<=20", priority: 5 }),
    ]);
  });

  it("raises the ceiling by the maximum increase the same item grants", () => {
    const generator = buildGenerator([
      modifier("strength-score", 2),
      modifier("ability-score-maximum", 2, 1),
      modifier("ability-score-maximum", 2, 2),
    ]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.str.value", value: "2<=22" }),
    ]);
  });

  it("leaves a penalty as a plain signed add", () => {
    const generator = buildGenerator([modifier("strength-score", -2)]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.str.value", type: "add", value: "-2" }),
    ]);
  });

  it.each([
    ["to a maximum of 24", "2<=24"],
    ["Your Strength increases by 2, to a maximum of 30.", "2<=30"],
    ["Can exceed 20, but not 30", "2<=30"],
    ["Maximum of 20", "2<=20"],
    ["While the stone orbits your head", "2<=20"],
    ["+2 to maximum score", "2<=20"],
  ])("reads the item's own ceiling from the restriction text: %s", (restriction, value) => {
    const generator = buildGenerator([modifier("strength-score", 2, null, restriction)]);
    generator._addStatBonusEffect("strength-score");
    expect(generator.effect.system.changes).toEqual([expect.objectContaining({ type: "add", value })]);
  });

  it("prefers a written ceiling over the maximum increase on the same item", () => {
    const generator = buildGenerator([
      modifier("constitution-score", 2, null, "to a maximum of 22"),
      modifier("ability-score-maximum", 2, 3),
    ]);
    generator._addStatBonusEffect("constitution-score");
    expect(generator.effect.system.changes).toEqual([expect.objectContaining({ value: "2<=22" })]);
  });

  it("stops a penalty at a written floor", () => {
    const generator = buildGenerator([modifier("intelligence-score", -4, null, "Curse. (minimum of 7)")]);
    generator._addStatBonusEffect("intelligence-score");
    expect(generator.effect.system.changes).toEqual([
      expect.objectContaining({ key: "system.abilities.int.value", type: "subtract", value: "4>=7" }),
    ]);
  });
});
