// Mock the deep dependency chain pulled in by CharacterSpellFactory; isCantripBoost itself only
// needs DDBModifiers and DDBDataUtils, both of which stay real.
vi.mock("../../../src/parser/spells/DDBSpell", () => ({ default: class {} }));
vi.mock("../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin", () => ({ default: class {} }));

import { isCantripBoost } from "../../../src/parser/spells/CharacterSpellFactory";

// ids and entity type ids taken from real cleric payloads
const CLASS_FEATURE_TYPE_ID = 12168134;
const OPTION_TYPE_ID = 258900837;

function setAC5eInstalled(installed: boolean): void {
  (CONFIG as any).DDBI.EFFECT_CONFIG.MODULES.installedModules = {
    hasCore: false,
    hasMonster: false,
    midiQolInstalled: false,
    daeInstalled: false,
    atlInstalled: false,
    tokenMagicInstalled: false,
    auraeffectsInstalled: false,
    autoAnimationsInstalled: false,
    chrisInstalled: false,
    vision5eInstalled: false,
    ac5eInstalled: installed,
  };
}

function makeMod(
  { componentId, componentTypeId, subType = "cleric-cantrip-damage", restriction = "" }:
  { componentId: number; componentTypeId: number; subType?: string; restriction?: string | null },
): any {
  return {
    id: componentId,
    type: "bonus",
    subType,
    restriction,
    componentId,
    componentTypeId,
    isGranted: true,
    availableToMulticlass: true,
  };
}

/**
 * getChosenClassModifiers walks character.modifiers.class and filters on the character's chosen
 * class features and options, so the feature that owns each modifier has to exist on the class.
 */
function makeDDB({ className = "Cleric", classFeatures = [], options = [], modifiers = [] }: {
  className?: string;
  classFeatures?: any[];
  options?: any[];
  modifiers?: any[];
}): any {
  return {
    character: {
      classes: [
        {
          id: 1,
          definition: { id: 1, name: className, classFeatures: [] },
          classFeatures,
          level: 20,
          isStartingClass: true,
        },
      ],
      options: { class: options, race: [], feat: [] },
      choices: { class: [], race: [], feat: [] },
      modifiers: { class: modifiers, race: [], background: [], item: [], feat: [], condition: [] },
      optionalClassFeatures: [],
      characterValues: [],
    },
    classOptions: [],
  };
}

function classFeature(id: number, name: string): any {
  return { definition: { id, name, entityTypeId: CLASS_FEATURE_TYPE_ID, requiredLevel: 8 } };
}

// 2024: Potent Spellcasting is a chosen option of Blessed Strikes / Elemental Fury
function chosenOption(id: number, name: string, parentId: number): any {
  return {
    componentId: parentId,
    componentTypeId: CLASS_FEATURE_TYPE_ID,
    definition: { id, name, entityTypeId: OPTION_TYPE_ID },
  };
}

describe("CharacterSpellFactory.isCantripBoost", () => {
  beforeEach(() => {
    setAC5eInstalled(false);
  });

  it("is false when the class has no cantrip damage modifier", () => {
    const ddb = makeDDB({ classFeatures: [classFeature(140, "Divine Strike")] });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("is true for a 2014 Cleric Potent Spellcasting without AC5e", () => {
    const ddb = makeDDB({
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({ componentId: 140, componentTypeId: CLASS_FEATURE_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(true);
  });

  it("is false for a 2014 Cleric Potent Spellcasting with AC5e installed", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({ componentId: 140, componentTypeId: CLASS_FEATURE_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("is false for a 2024 Cleric Blessed Strikes option with AC5e installed", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(10292211, "Blessed Strikes")],
      options: [chosenOption(4496847, "Potent Spellcasting", 10292211)],
      modifiers: [makeMod({ componentId: 4496847, componentTypeId: OPTION_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("is false for a 2024 Druid Elemental Fury option with AC5e installed", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      className: "Druid",
      classFeatures: [classFeature(10292999, "Elemental Fury")],
      options: [chosenOption(4496900, "Potent Spellcasting", 10292999)],
      modifiers: [makeMod({
        componentId: 4496900,
        componentTypeId: OPTION_TYPE_ID,
        subType: "druid-cantrip-damage",
      })],
    });
    expect(isCantripBoost(ddb, "Druid")).toBe(false);
  });

  it("is true for a 2024 Druid Elemental Fury option without AC5e", () => {
    const ddb = makeDDB({
      className: "Druid",
      classFeatures: [classFeature(10292999, "Elemental Fury")],
      options: [chosenOption(4496900, "Potent Spellcasting", 10292999)],
      modifiers: [makeMod({
        componentId: 4496900,
        componentTypeId: OPTION_TYPE_ID,
        subType: "druid-cantrip-damage",
      })],
    });
    expect(isCantripBoost(ddb, "Druid")).toBe(true);
  });

  it("is true with AC5e for a cantrip boost from a feature AC5e does not handle", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(8470353, "Empowered Cantrips")],
      modifiers: [makeMod({ componentId: 8470353, componentTypeId: CLASS_FEATURE_TYPE_ID })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(true);
  });

  it("is true with AC5e when only some boosts come from an AC5e handled feature", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [
        classFeature(140, "Potent Spellcasting"),
        classFeature(8470353, "Empowered Cantrips"),
      ],
      modifiers: [
        makeMod({ componentId: 140, componentTypeId: CLASS_FEATURE_TYPE_ID }),
        makeMod({ componentId: 8470353, componentTypeId: CLASS_FEATURE_TYPE_ID }),
      ],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(true);
  });

  it("ignores a restricted modifier, such as Improved Blessed Strikes", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({
        componentId: 140,
        componentTypeId: CLASS_FEATURE_TYPE_ID,
        restriction: "Grant Wisdom × 2 Temporary HP to you or another creature within 60 ft. of you.",
      })],
    });
    expect(isCantripBoost(ddb, "Cleric")).toBe(false);
  });

  it("does not suppress the boost for a class with no AC5e handled feature", () => {
    setAC5eInstalled(true);
    const ddb = makeDDB({
      className: "Warlock",
      classFeatures: [classFeature(140, "Potent Spellcasting")],
      modifiers: [makeMod({
        componentId: 140,
        componentTypeId: CLASS_FEATURE_TYPE_ID,
        subType: "warlock-cantrip-damage",
      })],
    });
    expect(isCantripBoost(ddb, "Warlock")).toBe(true);
  });
});
