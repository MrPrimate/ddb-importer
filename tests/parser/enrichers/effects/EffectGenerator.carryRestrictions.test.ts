import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";
import { installActivityConfigStubs } from "../../../_fixtures/ddb/stubs";


beforeAll(() => {
  installActivityConfigStubs();
});

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
      definition: { name: "Test Weapon", grantedModifiers, isConsumable: false, canEquip: true, canAttune: true },
    },
    document: { name: "Test Weapon", effects: [], flags: {} },
    type: "item",
    isCompendiumItem: true,
  });
};

const modifier = (type: string, subType: string, restriction = "", value: number | null = null): any => ({
  type,
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
  modifierTypeId: null,
  statId: null,
});

describe("EffectGenerator carry-only restrictions", () => {
  it.each([
    "While the weapon is on your person",
    "While the sword is on your person",
    "While holding the staff",
  ])("keeps a saving throw bonus restricted to '%s'", (restriction) => {
    const generator = buildGenerator([modifier("bonus", "saving-throws", restriction, 1)]);
    generator._addGlobalSavingBonusEffect();
    expect(generator.effect.changes.map((change: any) => change.key)).toContain("system.bonuses.abilities.save");
  });

  it("keeps an AC bonus restricted to carrying the weapon", () => {
    const generator = buildGenerator([modifier("bonus", "armor-class", "While the weapon is on your person", 1)]);
    generator._addACBonusChanges("armor-class");
    expect(generator.effect.changes.map((change: any) => change.key)).toContain("system.attributes.ac.bonus");
  });

  it("still drops a bonus with a situational restriction", () => {
    const generator = buildGenerator([modifier("bonus", "saving-throws", "Against spells", 1)]);
    generator._addGlobalSavingBonusEffect();
    expect(generator.effect.changes).toEqual([]);
  });
});
