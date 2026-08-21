// Mock ACBonusEffects used by ac.ts - keep other exports from the real module
vi.mock("../../../src/parser/enrichers/effects/_module", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    ACBonusEffects: {
      generateFixedACEffect: vi.fn((_formula: string, _label: string) => ({
        name: _label,
        system: { changes: [] },
        flags: { ddbimporter: { itemId: null, entityTypeId: null, characterEffect: true } },
        disabled: false,
        origin: "AC",
      })),
      generateBonusACEffect: vi.fn((_modifiers: any[], _label: string) => ({
        name: _label,
        system: { changes: [] },
        flags: { ddbimporter: { itemId: null, entityTypeId: null, characterEffect: true } },
        disabled: false,
        origin: "AC",
      })),
    },
  };
});

import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/ac";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";

// =============================================================================
// isArmored / isUnArmored
// =============================================================================
describe("DDBCharacter.isArmored / isUnArmored", () => {
  const isArmored = DDBCharacter.prototype.isArmored;
  const isUnArmored = DDBCharacter.prototype.isUnArmored;

  it("no equipped items: isArmored=false, isUnArmored=true", () => {
    const mock = makeMockCharacter({ ddbCharacter: { inventory: [] } });
    mock.isArmored = isArmored;

    expect(isArmored.call(mock)).toBe(false);
    expect(isUnArmored.call(mock)).toBe(true);
  });

  it("equipped chain mail (armorTypeId != 4): isArmored=true", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [
          {
            equipped: true,
            definition: { armorClass: 16, armorTypeId: 7, filterType: "Armor", name: "Chain Mail" },
          },
        ],
      },
    });
    mock.isArmored = isArmored;

    expect(isArmored.call(mock)).toBe(true);
    expect(isUnArmored.call(mock)).toBe(false);
  });

  it("shield only (armorTypeId == 4): isArmored=false", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [
          {
            equipped: true,
            definition: { armorClass: 2, armorTypeId: 4, filterType: "Armor", name: "Shield" },
          },
        ],
      },
    });
    mock.isArmored = isArmored;

    expect(isArmored.call(mock)).toBe(false);
    expect(isUnArmored.call(mock)).toBe(true);
  });

  it("armor + shield: isArmored=true", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [
          {
            equipped: true,
            definition: { armorClass: 14, armorTypeId: 5, filterType: "Armor", name: "Scale Mail" },
          },
          {
            equipped: true,
            definition: { armorClass: 2, armorTypeId: 4, filterType: "Armor", name: "Shield" },
          },
        ],
      },
    });
    mock.isArmored = isArmored;

    expect(isArmored.call(mock)).toBe(true);
  });

  it("unequipped armor: isArmored=false", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [
          {
            equipped: false,
            definition: { armorClass: 16, armorTypeId: 7, filterType: "Armor", name: "Chain Mail" },
          },
        ],
      },
    });
    mock.isArmored = isArmored;

    expect(isArmored.call(mock)).toBe(false);
  });

  it("equipped item without armorClass: isArmored=false", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [
          {
            equipped: true,
            definition: { armorClass: 0, armorTypeId: 7, filterType: "Armor", name: "Broken Armor" },
          },
        ],
      },
    });
    mock.isArmored = isArmored;

    expect(isArmored.call(mock)).toBe(false);
  });
});

// =============================================================================
// _generateOverrideArmorClass
// =============================================================================
describe("DDBCharacter._generateOverrideArmorClass", () => {
  const generateOverride = DDBCharacter.prototype._generateOverrideArmorClass;

  // typeId 1 is the DDB character value used for AC overrides
  const acOverrideValue = (value: number): IDDBCharacterValue => ({
    typeId: 1,
    value,
    notes: null,
    valueId: null,
    valueTypeId: null,
    contextId: null,
    contextTypeId: null,
  });

  it("sets flat AC with override value", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, acOverrideValue(18));

    expect(mock.raw.character.system.attributes.ac.flat).toBe(18);
    expect(mock.raw.character.system.attributes.ac.calc).toBe("flat");
    expect(mock.raw.character.system.attributes.ac.formula).toBe("");
  });

  it("stores override metadata in flags", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, acOverrideValue(15));

    expect(mock.raw.character.flags.ddbimporter.baseAC).toBe(15);
    expect(mock.raw.character.flags.ddbimporter.overrideAC).toEqual({
      flat: 15,
      calc: "flat",
      formula: "",
    });
  });

  it("stores armor results", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, acOverrideValue(20));

    expect(mock.armor.results.maxValue).toBe(20);
    expect(mock.armor.results.maxType).toBe("override");
  });

  it("adds effect to character effects", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, acOverrideValue(16));

    expect(mock.raw.character.effects.length).toBe(1);
    expect(mock.raw.character.flags.ddbimporter.acEffects).toHaveLength(1);
  });
});

// =============================================================================
// _generateArmorClass - override path
// =============================================================================
describe("DDBCharacter._generateArmorClass (override path)", () => {
  const generateAC = DDBCharacter.prototype._generateArmorClass;

  it("uses override when characterValues has typeId=1", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 1, value: 22 },
        ],
        inventory: [],
        feats: [],
        classes: [],
      },
    });
    mock.armor = {};
    mock.isArmored = DDBCharacter.prototype.isArmored;
    mock.isUnArmored = DDBCharacter.prototype.isUnArmored;
    mock._generateOverrideArmorClass = DDBCharacter.prototype._generateOverrideArmorClass;

    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.flat).toBe(22);
    expect(mock.raw.character.system.attributes.ac.calc).toBe("flat");
    expect(mock.armor.results.maxValue).toBe(22);
  });
});

// =============================================================================
// _generateArmorClass - unarmored default path
// =============================================================================
describe("DDBCharacter._generateArmorClass (unarmored default)", () => {
  const generateAC = DDBCharacter.prototype._generateArmorClass;

  function makeACMock(overrides: any = {}) {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [],
        feats: [],
        classes: [],
        characterValues: [],
        ...overrides,
      },
    });
    mock.armor = {};
    mock.isArmored = DDBCharacter.prototype.isArmored;
    mock.isUnArmored = DDBCharacter.prototype.isUnArmored;
    mock._generateOverrideArmorClass = DDBCharacter.prototype._generateOverrideArmorClass;
    return mock;
  }

  it("unarmored with 10 DEX: base AC defaults applied", () => {
    const mock = makeACMock();
    generateAC.call(mock);

    // AC calculation produces "default" calc for no special class features
    expect(mock.raw.character.system.attributes.ac.calc).toBe("default");
    expect(mock.raw.character.flags.ddbimporter.baseAC).toBeDefined();
  });

  it("unarmored with 14 DEX: higher base AC", () => {
    const mock = makeACMock();
    mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.dex.value = 14;

    generateAC.call(mock);

    // With 14 DEX (mod +2), unarmored base is 10 + 2 = 12
    expect(mock.raw.character.flags.ddbimporter.baseAC).toBe(12);
  });

  it("stores autoAC in flags", () => {
    const mock = makeACMock();
    generateAC.call(mock);

    expect(mock.raw.character.flags.ddbimporter.autoAC).toBeDefined();
    expect(mock.raw.character.flags.ddbimporter.autoAC.calc).toBe("default");
  });

  it("stores overrideAC as flat in flags", () => {
    const mock = makeACMock();
    generateAC.call(mock);

    expect(mock.raw.character.flags.ddbimporter.overrideAC).toBeDefined();
    expect(mock.raw.character.flags.ddbimporter.overrideAC.calc).toBe("flat");
  });

  it("equipped non-armor gear does not make character armored", () => {
    const mock = makeACMock({
      inventory: [
        {
          equipped: true,
          definition: {
            armorClass: 0,
            armorTypeId: 0,
            filterType: "Wondrous item",
            name: "Ring of Protection",
            grantedModifiers: [],
            canAttune: true,
            canEquip: true,
            isConsumable: false,
          },
          isAttuned: true,
        },
      ],
    });

    generateAC.call(mock);

    // Not armored, so should use default/unarmored calc
    expect(mock.raw.character.system.attributes.ac.calc).toBe("default");
  });
});

// =============================================================================
// _generateArmorClass - armor type branches
// Characterization pins for the dnd5e 6.0 AC rework: these assert the CURRENT
// 5.x-shaped output ({flat, calc, formula} + maxValue selection) so the rework
// diff is visible and intentional.
// =============================================================================
describe("DDBCharacter._generateArmorClass (armor type branches)", () => {
  const generateAC = DDBCharacter.prototype._generateArmorClass;

  function armorItem({ name, type, armorClass, armorTypeId, grantedModifiers = [], canAttune = false, isAttuned = false }: {
    name: string; type: string; armorClass: number; armorTypeId: number;
    grantedModifiers?: any[]; canAttune?: boolean; isAttuned?: boolean;
  }) {
    return {
      id: 1000 + armorTypeId,
      entityTypeId: 1,
      equipped: true,
      isAttuned,
      definition: { name, type, armorClass, armorTypeId, filterType: "Armor", grantedModifiers, canAttune },
    };
  }

  function makeACMock(ddbOverrides: any = {}, { dex = 10, abilities = {} }: { dex?: number; abilities?: Record<string, number> } = {}) {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [],
        feats: [],
        classes: [],
        characterValues: [],
        ...ddbOverrides,
      },
    });
    mock.armor = {};
    mock.isArmored = DDBCharacter.prototype.isArmored;
    mock.isUnArmored = DDBCharacter.prototype.isUnArmored;
    mock._generateOverrideArmorClass = DDBCharacter.prototype._generateOverrideArmorClass;
    const effectAbilities = mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities;
    effectAbilities.dex.value = dex;
    for (const [ability, value] of Object.entries(abilities)) {
      effectAbilities[ability].value = value;
    }
    return mock;
  }

  it("light armor adds full dex: leather 11 + dex 14 = 13", () => {
    const mock = makeACMock({ inventory: [armorItem({ name: "Leather", type: "Light Armor", armorClass: 11, armorTypeId: 1 })] }, { dex: 14 });
    generateAC.call(mock);

    expect(mock.armor.results.maxValue).toBe(13);
    expect(mock.armor.results.maxType).toBe("Light");
    expect(mock.raw.character.system.attributes.ac.calc).toBe("default");
    expect(mock.raw.character.system.attributes.ac.flat).toBe(null);
    expect(mock.raw.character.flags.ddbimporter.overrideAC.flat).toBe(13);
  });

  it("medium armor caps dex at 2: scale mail 14 + dex 18 = 16", () => {
    const mock = makeACMock({ inventory: [armorItem({ name: "Scale Mail", type: "Medium Armor", armorClass: 14, armorTypeId: 2 })] }, { dex: 18 });
    generateAC.call(mock);

    expect(mock.armor.results.maxValue).toBe(16);
    expect(mock.armor.results.maxType).toBe("Medium");
  });

  it("heavy armor ignores dex: chain mail 16 with dex 14 = 16", () => {
    const mock = makeACMock({ inventory: [armorItem({ name: "Chain Mail", type: "Heavy Armor", armorClass: 16, armorTypeId: 3 })] }, { dex: 14 });
    generateAC.call(mock);

    expect(mock.armor.results.maxValue).toBe(16);
    expect(mock.armor.results.maxType).toBe("Heavy");
  });

  it("shield stacks with armor: chain mail 16 + shield 2 = 18", () => {
    const mock = makeACMock({
      inventory: [
        armorItem({ name: "Chain Mail", type: "Heavy Armor", armorClass: 16, armorTypeId: 3 }),
        armorItem({ name: "Shield", type: "Shield", armorClass: 2, armorTypeId: 4 }),
      ],
    });
    generateAC.call(mock);

    expect(mock.armor.results.maxValue).toBe(18);
    expect(mock.armor.results.maxData.shieldMod).toBe(2);
  });

  it("magical armor bonus modifier adds to armor AC: +1 chain mail = 17", () => {
    const mock = makeACMock({
      inventory: [armorItem({
        name: "Chain Mail, +1",
        type: "Heavy Armor",
        armorClass: 16,
        armorTypeId: 3,
        grantedModifiers: [{ type: "bonus", subType: "armor-class", value: 1, isGranted: true }],
      })],
    });
    generateAC.call(mock);

    expect(mock.armor.results.maxValue).toBe(17);
  });
});

// =============================================================================
// _generateArmorClass - natural armor and unarmored defense
// =============================================================================
describe("DDBCharacter._generateArmorClass (natural and unarmored defense)", () => {
  const generateAC = DDBCharacter.prototype._generateArmorClass;

  function makeACMock(ddbOverrides: any = {}, { abilities = {} }: { abilities?: Record<string, number> } = {}) {
    const mock = makeMockCharacter({
      ddbCharacter: {
        inventory: [],
        feats: [],
        classes: [],
        characterValues: [],
        ...ddbOverrides,
      },
    });
    mock.armor = {};
    mock.isArmored = DDBCharacter.prototype.isArmored;
    mock.isUnArmored = DDBCharacter.prototype.isUnArmored;
    mock._generateOverrideArmorClass = DDBCharacter.prototype._generateOverrideArmorClass;
    const effectAbilities = mock.raw.character.flags.ddbimporter.dndbeyond.effectAbilities;
    for (const [ability, value] of Object.entries(abilities)) {
      effectAbilities[ability].value = value;
    }
    return mock;
  }

  // a class fixture with one feature; the modifier's componentId must match the
  // feature definition id for getChosenClassModifiers to pick it up
  function classWithFeature({ className, featureName, featureId, subclass = null }: {
    className: string; featureName: string; featureId: number; subclass?: string | null;
  }) {
    return {
      level: 3,
      isStartingClass: true,
      definition: { id: 50, name: className },
      classFeatures: [{ definition: { id: featureId, name: featureName, requiredLevel: 1 } }],
      subclassDefinition: subclass
        ? { id: 60, name: subclass, classFeatures: [{ id: featureId + 1, name: featureName, requiredLevel: 1 }] }
        : null,
    };
  }

  it("Tortle minimum-base-armor 17: natural calc with flat 17", () => {
    const mock = makeACMock({
      race: { fullName: "Tortle" },
      modifiers: {
        class: [], background: [], item: [], feat: [], condition: [],
        race: [{ type: "set", subType: "minimum-base-armor", value: 17, isGranted: true }],
      },
    });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("natural");
    expect(mock.raw.character.system.attributes.ac.flat).toBe(17);
    expect(mock.armor.results.maxType).toBe("Natural");
  });

  it("Lizardfolk unarmored-armor-class set +3: natural 13", () => {
    const mock = makeACMock({
      race: { fullName: "Lizardfolk" },
      modifiers: {
        class: [], background: [], item: [], feat: [], condition: [],
        race: [{ type: "set", subType: "unarmored-armor-class", statId: null, value: 3, isGranted: true }],
      },
    });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("natural");
    expect(mock.raw.character.system.attributes.ac.flat).toBe(13);
  });

  // NOTE: the class "set unarmored-armor-class" modifier is stripped by
  // getChosenClassModifiers (EXCLUDED.ac in dictionary/effects/excluded.ts), so
  // the COMPUTED maxValue/baseAC never includes class Unarmored Defense - the
  // real in-Foundry AC comes from the calc name, which dnd5e evaluates itself.
  // The 6.0 rework keeps this split: calcs[] carry UD, computed values are
  // validation-only and under-report UD characters.
  it("Barbarian Unarmored Defense: unarmoredBarb calc; computed baseAC stays 10 + dex", () => {
    const mock = makeACMock({
      classes: [classWithFeature({ className: "Barbarian", featureName: "Unarmored Defense", featureId: 101 })],
      modifiers: {
        race: [], background: [], item: [], feat: [], condition: [],
        class: [{
          type: "set", subType: "unarmored-armor-class", statId: 3, value: null,
          isGranted: true, componentId: 101, availableToMulticlass: false,
        }],
      },
    }, { abilities: { dex: 14, con: 16 } });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("unarmoredBarb");
    expect(mock.raw.character.flags.ddbimporter.baseAC).toBe(12);
    expect(mock.armor.results.maxType).toBe("Unarmored");
  });

  it("Monk Unarmored Defense: unarmoredMonk calc; computed baseAC stays 10 + dex", () => {
    const mock = makeACMock({
      classes: [classWithFeature({ className: "Monk", featureName: "Unarmored Defense", featureId: 102 })],
      modifiers: {
        race: [], background: [], item: [], feat: [], condition: [],
        class: [{
          type: "set", subType: "unarmored-armor-class", statId: 5, value: null,
          isGranted: true, componentId: 102, availableToMulticlass: false,
        }],
      },
    }, { abilities: { dex: 14, wis: 16 } });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("unarmoredMonk");
    expect(mock.raw.character.flags.ddbimporter.baseAC).toBe(12);
  });

  it("Draconic Bloodline sorcerer: draconic calc", () => {
    const mock = makeACMock({
      classes: [classWithFeature({
        className: "Sorcerer", featureName: "Draconic Resilience", featureId: 201, subclass: "Draconic Bloodline",
      })],
    });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("draconic");
  });

  it("Draconic Sorcery (2024) sorcerer: unarmoredBard calc", () => {
    const mock = makeACMock({
      classes: [classWithFeature({
        className: "Sorcerer", featureName: "Draconic Resilience", featureId: 202, subclass: "Draconic Sorcery",
      })],
    });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("unarmoredBard");
  });

  it("College of Dance bard: unarmoredBard calc", () => {
    const mock = makeACMock({
      classes: [classWithFeature({
        className: "Bard", featureName: "Unarmored Defense", featureId: 203, subclass: "College of Dance",
      })],
    });
    generateAC.call(mock);

    expect(mock.raw.character.system.attributes.ac.calc).toBe("unarmoredBard");
  });

  it("race-sourced unarmored defense DOES enter the computed max (raw race modifiers bypass the effect exclusion)", () => {
    // same modifier shape as the Barbarian test, but on modifiers.race - the
    // unarmoredSources list feeds race/feat modifiers in unfiltered
    const mock = makeACMock({
      modifiers: {
        class: [], background: [], item: [], feat: [], condition: [],
        race: [{ type: "set", subType: "unarmored-armor-class", statId: 3, value: null, isGranted: true }],
      },
    }, { abilities: { dex: 14, con: 20 } });
    generateAC.call(mock);

    // 10 + 2 (dex) + 5 (con) = 17
    expect(mock.armor.results.maxValue).toBe(17);
    expect(mock.armor.results.maxType).toBe("Unarmored Defense");
  });
});
