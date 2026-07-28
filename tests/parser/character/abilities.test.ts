import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/abilities";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";

// =============================================================================
// _getCustomSaveProficiency
// =============================================================================
describe("DDBCharacter._getCustomSaveProficiency", () => {
  const getCustomSaveProficiency = DDBCharacter.prototype._getCustomSaveProficiency;
  const strAbility: DDBAbilityLookup = { id: 1, value: "str", long: "strength" };

  it("returns undefined when no custom proficiency exists", () => {
    const mock = makeMockCharacter();
    expect(getCustomSaveProficiency.call(mock, strAbility)).toBeUndefined();
  });

  it("returns 0 when custom proficiency value is 1 (toggle off)", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 41, valueId: 1, value: 1 },
        ],
      },
    });
    expect(getCustomSaveProficiency.call(mock, strAbility)).toBe(0);
  });

  it("returns 1 when custom proficiency value is 3 (toggle on)", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 41, valueId: 1, value: 3 },
        ],
      },
    });
    expect(getCustomSaveProficiency.call(mock, strAbility)).toBe(1);
  });

  it("returns undefined when typeId doesn't match", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 99, valueId: 1, value: 3 },
        ],
      },
    });
    expect(getCustomSaveProficiency.call(mock, strAbility)).toBeUndefined();
  });

  it("returns undefined when valueId doesn't match ability id", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 41, valueId: 999, value: 3 },
        ],
      },
    });
    expect(getCustomSaveProficiency.call(mock, strAbility)).toBeUndefined();
  });
});

// =============================================================================
// _getCustomSaveBonus
// =============================================================================
describe("DDBCharacter._getCustomSaveBonus", () => {
  const getCustomSaveBonus = DDBCharacter.prototype._getCustomSaveBonus;
  const dexAbility: DDBAbilityLookup = { id: 2, value: "dex", long: "dexterity" };

  it("returns 0 when no custom values exist", () => {
    const mock = makeMockCharacter();
    expect(getCustomSaveBonus.call(mock, dexAbility)).toBe(0);
  });

  it("returns bonus for typeId 40", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 40, valueId: 2, value: 3 },
        ],
      },
    });
    expect(getCustomSaveBonus.call(mock, dexAbility)).toBe(3);
  });

  it("returns bonus for typeId 39", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 39, valueId: 2, value: 2 },
        ],
      },
    });
    expect(getCustomSaveBonus.call(mock, dexAbility)).toBe(2);
  });

  it("sums multiple bonuses", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 40, valueId: 2, value: 1 },
          { typeId: 39, valueId: 2, value: 2 },
        ],
      },
    });
    expect(getCustomSaveBonus.call(mock, dexAbility)).toBe(3);
  });

  it("ignores values for other abilities", () => {
    const mock = makeMockCharacter({
      ddbCharacter: {
        characterValues: [
          { typeId: 40, valueId: 1, value: 5 }, // STR, not DEX
        ],
      },
    });
    expect(getCustomSaveBonus.call(mock, dexAbility)).toBe(0);
  });
});

// =============================================================================
// _getAbilities
// =============================================================================
describe("DDBCharacter._getAbilities", () => {
  const getAbilities = DDBCharacter.prototype._getAbilities;

  function makeMockForAbilities(overrides: any = {}) {
    const mock = makeMockCharacter(overrides);
    // _getAbilities calls _filterAbilityMods and _getCustomSaveProficiency,
    // so we need the prototype methods available
    mock._filterAbilityMods = DDBCharacter.prototype._filterAbilityMods;
    mock._getCustomSaveProficiency = DDBCharacter.prototype._getCustomSaveProficiency;
    return mock;
  }

  it("all stats 10: all values 10", () => {
    const mock = makeMockForAbilities();
    const result = getAbilities.call(mock);

    expect(result.str.value).toBe(10);
    expect(result.dex.value).toBe(10);
    expect(result.con.value).toBe(10);
    expect(result.int.value).toBe(10);
    expect(result.wis.value).toBe(10);
    expect(result.cha.value).toBe(10);
  });

  it("base stat 16 STR: value 16", () => {
    const stats = [
      { id: 1, value: 16 },
      { id: 2, value: 10 },
      { id: 3, value: 10 },
      { id: 4, value: 10 },
      { id: 5, value: 10 },
      { id: 6, value: 10 },
    ];
    const mock = makeMockForAbilities({ ddbCharacter: { stats } });
    const result = getAbilities.call(mock);

    expect(result.str.value).toBe(16);
  });

  it("override stat takes precedence", () => {
    const overrideStats = [
      { id: 1, value: 20 },
      { id: 2, value: 0 },
      { id: 3, value: 0 },
      { id: 4, value: 0 },
      { id: 5, value: 0 },
      { id: 6, value: 0 },
    ];
    const mock = makeMockForAbilities({ ddbCharacter: { overrideStats } });
    const result = getAbilities.call(mock);

    expect(result.str.value).toBe(20);
  });

  it("bonus stat adds on top of calculated value", () => {
    const bonusStats = [
      { id: 1, value: 2 },
      { id: 2, value: 0 },
      { id: 3, value: 0 },
      { id: 4, value: 0 },
      { id: 5, value: 0 },
      { id: 6, value: 0 },
    ];
    const mock = makeMockForAbilities({ ddbCharacter: { bonusStats } });
    const result = getAbilities.call(mock);

    // base 10 + bonus 2 = 12
    expect(result.str.value).toBe(12);
  });

  it("all abilities default to proficient = 0", () => {
    const mock = makeMockForAbilities();
    const result = getAbilities.call(mock);

    expect(result.str.proficient).toBe(0);
    expect(result.dex.proficient).toBe(0);
    expect(result.con.proficient).toBe(0);
    expect(result.int.proficient).toBe(0);
    expect(result.wis.proficient).toBe(0);
    expect(result.cha.proficient).toBe(0);
  });

  it("custom save proficiency overrides default", () => {
    const mock = makeMockForAbilities({
      ddbCharacter: {
        characterValues: [
          { typeId: 41, valueId: 1, value: 3 }, // STR save proficiency on
        ],
      },
    });
    const result = getAbilities.call(mock);

    expect(result.str.proficient).toBe(1);
    expect(result.dex.proficient).toBe(0); // others unaffected
  });

});

// =============================================================================
// _generateAbilitiesOverrides
// =============================================================================
describe("DDBCharacter._generateAbilitiesOverrides", () => {
  const generateOverrides = DDBCharacter.prototype._generateAbilitiesOverrides;

  it("populates overrides from override stats", () => {
    const overrideStats = [
      { id: 1, value: 20 },
      { id: 2, value: 0 },
      { id: 3, value: 18 },
      { id: 4, value: 0 },
      { id: 5, value: 0 },
      { id: 6, value: 0 },
    ];
    const mock = makeMockCharacter({ ddbCharacter: { overrideStats } });
    generateOverrides.call(mock);

    expect(mock.abilities.overrides.str).toBe(20);
    expect(mock.abilities.overrides.dex).toBe(0);
    expect(mock.abilities.overrides.con).toBe(18);
    expect(mock.raw.character.flags.ddbimporter.dndbeyond.abilityOverrides).toBe(mock.abilities.overrides);
  });

  it("populates overrides when the abilities object has no overrides record yet", () => {
    // the constructed DDBCharacter shape: core/withEffects are assigned wholesale
    // later in the parse, overrides must not rely on being pre-initialised
    const mock = makeMockCharacter({
      ddbCharacter: { overrideStats: [{ id: 4, value: 19 }] },
      abilities: { overrides: undefined, core: undefined, withEffects: undefined },
    });
    generateOverrides.call(mock);

    expect(mock.abilities.overrides).toEqual({ str: 0, dex: 0, con: 0, int: 19, wis: 0, cha: 0 });
    expect(mock.raw.character.flags.ddbimporter.dndbeyond.abilityOverrides).toBe(mock.abilities.overrides);
  });

  it("all zeros when no overrides", () => {
    const mock = makeMockCharacter();
    generateOverrides.call(mock);

    expect(mock.abilities.overrides.str).toBe(0);
    expect(mock.abilities.overrides.dex).toBe(0);
    expect(mock.abilities.overrides.con).toBe(0);
    expect(mock.abilities.overrides.int).toBe(0);
    expect(mock.abilities.overrides.wis).toBe(0);
    expect(mock.abilities.overrides.cha).toBe(0);
  });
});
