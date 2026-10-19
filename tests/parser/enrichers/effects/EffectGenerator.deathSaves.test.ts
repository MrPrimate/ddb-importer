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

const buildGenerator = (grantedModifiers: any[], type = "feature"): any => {
  return new (EffectGenerator as any)({
    ddb,
    character: { flags: {}, system: {} },
    ddbItem: {
      definition: { name: "Test Feature", grantedModifiers, isConsumable: false, canEquip: true, canAttune: false },
    },
    document: { name: "Test Feature", effects: [], flags: {} },
    type,
    isCompendiumItem: true,
  });
};

const modifier = (type: string, subType: string, restriction = "", value: number | null = null, extra: Record<string, any> = {}): any => ({
  type,
  subType,
  restriction,
  bonusTypes: [],
  fixedValue: value,
  value,
  dice: null,
  modifierTypeId: null,
  statId: null,
  ...extra,
});

describe("EffectGenerator death saving throws", () => {
  const deathMode = (value: string) => ({ key: "system.attributes.death.roll.mode", mode: 2, value, priority: 20 });

  it("turns an unrestricted death save advantage into the death roll mode", () => {
    // Durable, Tenacious, Deathwalker's Ward
    const generator = buildGenerator([modifier("advantage", "death-saving-throws")]);
    generator.generateGenericEffects();
    expect(generator.effect.changes).toEqual([deathMode("1")]);
  });

  it("adds a death save disadvantage as a counted source", () => {
    // Touch of Death's Pull of the Grave
    const generator = buildGenerator([modifier("disadvantage", "death-saving-throws")]);
    generator.generateGenericEffects();
    expect(generator.effect.changes).toEqual([deathMode("-1")]);
  });

  it("drops a restricted death save modifier", () => {
    const generator = buildGenerator([modifier("advantage", "death-saving-throws", "while you have a soul trinket")]);
    generator.generateGenericEffects();
    expect(generator.effect.changes).toEqual([]);
  });

  it("leaves the change to an enricher effect that sets the same key", () => {
    const generator = new (EffectGenerator as any)({
      ddb,
      character: { flags: {}, system: {} },
      ddbItem: { definition: { name: "Durable", grantedModifiers: [modifier("advantage", "death-saving-throws")] } },
      document: { name: "Durable", effects: [], flags: {} },
      type: "feat",
      isCompendiumItem: true,
      replacedChangeKeys: ["system.attributes.death.roll.mode"],
    });
    generator.generateGenericEffects();
    expect(generator.effect.changes).toEqual([]);
    expect(generator.document.effects).toEqual([]);
  });

  it("names a replaced key only when an enricher hint sets it", () => {
    expect(EffectGenerator.enricherReplacedKeys([
      { name: "Defy Death", changes: [deathMode("1") as any] },
    ])).toEqual(["system.attributes.death.roll.mode"]);
    expect(EffectGenerator.enricherReplacedKeys([
      { name: "Other", changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "1", priority: 20 } as any] },
    ])).toEqual([]);
    expect(EffectGenerator.enricherReplacedKeys(undefined)).toEqual([]);
  });
});
