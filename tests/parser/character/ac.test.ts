// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

// Mock ACBonusEffects used by ac.ts — keep other exports from the real module
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

  it("sets flat AC with override value", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, { value: 18 });

    expect(mock.raw.character.system.attributes.ac.flat).toBe(18);
    expect(mock.raw.character.system.attributes.ac.calc).toBe("flat");
    expect(mock.raw.character.system.attributes.ac.formula).toBe("");
  });

  it("stores override metadata in flags", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, { value: 15 });

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
    generateOverride.call(mock, { value: 20 });

    expect(mock.armor.results.maxValue).toBe(20);
    expect(mock.armor.results.maxType).toBe("override");
  });

  it("adds effect to character effects", () => {
    const mock = makeMockCharacter();
    mock.armor = {};
    generateOverride.call(mock, { value: 16 });

    expect(mock.raw.character.effects.length).toBe(1);
    expect(mock.raw.character.flags.ddbimporter.acEffects).toHaveLength(1);
  });
});

// =============================================================================
// _generateArmorClass — override path
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
// _generateArmorClass — unarmored default path
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
