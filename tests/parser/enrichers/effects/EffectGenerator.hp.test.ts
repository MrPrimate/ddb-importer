import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

// DDB reuses the bonus/hit-points modifier for both max HP increases and for the amount an item
// heals. Dice-based ones are healing (e.g. the Periapt of Health's "2d4 + 2") and must not end up
// on system.attributes.hp.bonuses.overall, which is a deterministic formula field.

const ddb: any = {
  character: {
    classes: [],
    modifiers: { class: [], race: [], background: [], feat: [], item: [], condition: [] },
    optionalClassFeatures: [],
    options: { class: [] },
    choices: { class: [] },
  },
};

const buildGenerator = (grantedModifiers: any[], definitionOverrides: any = {}): any => {
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
        ...definitionOverrides,
      },
    },
    document: { name: "Test Item", effects: [], flags: {} },
    type: "item",
    isCompendiumItem: true,
    separateACEffects: false,
  });
};

const hpChanges = (generator: any): any[] =>
  generator.effect.system.changes.filter((c: any) => c.key.startsWith("system.attributes.hp."));

describe("EffectGenerator._addHPEffect", () => {
  it("does not create an HP bonus for a dice based hit-points modifier", () => {
    const generator = buildGenerator([
      {
        type: "bonus",
        subType: "hit-points",
        restriction: "",
        bonusTypes: [],
        fixedValue: 2,
        value: null,
        dice: { diceCount: 2, diceValue: 4, diceMultiplier: null, fixedValue: 2, diceString: "2d4 + 2" },
      },
    ]);
    generator._addHPEffect();
    expect(hpChanges(generator)).toEqual([]);
  });

  it("still creates an HP bonus for a flat hit-points modifier", () => {
    const generator = buildGenerator([
      {
        type: "bonus",
        subType: "hit-points",
        restriction: "",
        bonusTypes: [],
        fixedValue: 5,
        value: 5,
        dice: null,
      },
    ]);
    generator._addHPEffect();
    const changes = hpChanges(generator);
    expect(changes).toHaveLength(1);
    expect(changes[0].key).toBe("system.attributes.hp.bonuses.overall");
    expect(changes[0].value).toBe("5");
  });

  it("drops only the dice modifier when flat and dice modifiers are mixed", () => {
    const generator = buildGenerator([
      {
        type: "bonus",
        subType: "hit-points",
        restriction: "",
        bonusTypes: [],
        fixedValue: 5,
        value: 5,
        dice: null,
      },
      {
        type: "bonus",
        subType: "hit-points",
        restriction: "",
        bonusTypes: [],
        fixedValue: 2,
        value: null,
        dice: { diceCount: 2, diceValue: 4, diceMultiplier: null, fixedValue: 2, diceString: "2d4 + 2" },
      },
    ]);
    generator._addHPEffect();
    const changes = hpChanges(generator);
    expect(changes).toHaveLength(1);
    expect(changes[0].value).toBe("5");
  });

  it("skips consumables with a flat hit-points modifier", () => {
    const generator = buildGenerator([
      {
        type: "bonus",
        subType: "hit-points",
        restriction: "",
        bonusTypes: [],
        fixedValue: 5,
        value: 5,
        dice: null,
      },
    ], { isConsumable: true });
    generator._addHPEffect();
    expect(hpChanges(generator)).toEqual([]);
  });

  it("leaves hit-points-per-level modifiers alone", () => {
    const generator = buildGenerator([
      {
        type: "bonus",
        subType: "hit-points-per-level",
        restriction: "",
        bonusTypes: [],
        value: 1,
        dice: null,
        componentId: 999,
      },
    ]);
    generator._addHPEffect();
    const changes = hpChanges(generator);
    expect(changes).toHaveLength(1);
    expect(changes[0].key).toBe("system.attributes.hp.bonuses.level");
    expect(changes[0].value).toBe("1");
  });
});
