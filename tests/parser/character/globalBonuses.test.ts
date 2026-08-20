import "../../../src/parser/character/globalBonuses";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";
import DDBCharacter from "../../../src/parser/DDBCharacter";

// the generators call sibling prototype methods (getBonusSpellAttacks ->
// getGlobalBonusAttackModifiers) via `this`, so the mock needs the real
// prototype rather than a single extracted method
function bonusMock(ddbCharacter: Record<string, any>): any {
  const mock = makeMockCharacter({ ddbCharacter });
  Object.setPrototypeOf(mock, DDBCharacter.prototype);
  return mock;
}

function raceModifiers(race: Record<string, any>[]): Record<string, any> {
  return {
    modifiers: {
      race,
      class: [], background: [], item: [], feat: [], condition: [],
    },
  };
}

describe("DDBCharacter.getGlobalBonusAttackModifiers (synthetic)", () => {
  // the fixed lookup tables used by the _generate* methods are all routed to
  // ActiveEffects (see below), so the summing machinery is exercised here with
  // a custom lookup table over subTypes absent from the excluded-effects
  // dictionary (the doc comment's own "magic" example)
  it("sums integer modifiers and filters restricted ones", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "magic", value: 2, isGranted: true, restriction: "" },
      { type: "bonus", subType: "magic", value: 3, isGranted: true, restriction: "" },
      { type: "bonus", subType: "magic", value: 7, isGranted: true, restriction: "while raging" },
    ]));
    const result = mock.getGlobalBonusAttackModifiers([
      { fvttType: "attack", ddbSubType: "magic" },
    ]);
    expect(result).toEqual({ attack: "5", damage: "" });
  });

  it("keys results to the lookup fvttType", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "atk-thing", value: 1, isGranted: true, restriction: "" },
      { type: "bonus", subType: "dmg-thing", value: 4, isGranted: true, restriction: "" },
    ]));
    const result = mock.getGlobalBonusAttackModifiers([
      { fvttType: "attack", ddbSubType: "atk-thing" },
      { fvttType: "damage", ddbSubType: "dmg-thing" },
    ]);
    expect(result).toEqual({ attack: "1", damage: "4" });
  });

  it("emits a bare dice modifier with no leading operator", () => {
    // the first dice result was once prefixed with " + " (a dangling operator
    // and an invalid roll formula); terms now only get the separator when
    // joining an existing dice string
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "magic", dice: { diceString: "1d4" }, value: null, isGranted: true, restriction: "" },
    ]));
    const result = mock.getGlobalBonusAttackModifiers([
      { fvttType: "attack", ddbSubType: "magic" },
    ]);
    expect(result.attack).toBe("1d4");
  });

  it("joins multiple dice modifiers with ' + '", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "magic", dice: { diceString: "1d4" }, value: null, isGranted: true, restriction: "" },
      { type: "bonus", subType: "magic-dice", dice: { diceString: "1d6" }, value: null, isGranted: true, restriction: "" },
    ]));
    const result = mock.getGlobalBonusAttackModifiers([
      { fvttType: "attack", ddbSubType: "magic" },
      { fvttType: "attack", ddbSubType: "magic-dice" },
    ]);
    expect(result.attack).toBe("1d4 + 1d6");
  });

  it("appends the integer sum after a dice string on the same key", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "magic", value: 5, isGranted: true, restriction: "" },
      { type: "bonus", subType: "magic-dice", dice: { diceString: "1d4" }, value: null, isGranted: true, restriction: "" },
    ]));
    const result = mock.getGlobalBonusAttackModifiers([
      { fvttType: "attack", ddbSubType: "magic-dice" },
      { fvttType: "attack", ddbSubType: "magic" },
    ]);
    expect(result.attack).toBe("1d4 + 5");
  });

  it("returns empty bonuses when no DDB source data is present", () => {
    const mock = bonusMock({});
    mock.source = null;
    const result = mock.getGlobalBonusAttackModifiers([
      { fvttType: "attack", ddbSubType: "magic" },
    ]);
    expect(result).toEqual({ attack: "", damage: "" });
  });
});

describe("DDBCharacter global bonus generators (synthetic)", () => {
  // every subType in the shipped lookup tables sits in
  // config/dictionary/effects/excluded.ts (EXCLUDED.common), so
  // filterBaseModifiers drops the modifiers here and they are emitted later as
  // ActiveEffects on the granting document instead - the flat system.bonuses
  // stay empty by design
  it("_generateBonusSpellAttacks leaves rsak/msak empty for an excluded-effect spell-attacks bonus", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "spell-attacks", value: 2, isGranted: true, restriction: "" },
    ]));
    mock._generateBonusSpellAttacks();
    expect(mock.raw.character.system.bonuses.rsak).toEqual({ attack: "", damage: "" });
    expect(mock.raw.character.system.bonuses.msak).toEqual({ attack: "", damage: "" });
  });

  it("_generateBonusWeaponAttacks leaves mwak/rwak empty for an excluded-effect weapon-attacks bonus", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "weapon-attacks", value: 1, isGranted: true, restriction: "" },
      { type: "bonus", subType: "melee-attacks", value: 1, isGranted: true, restriction: "" },
    ]));
    mock._generateBonusWeaponAttacks();
    expect(mock.raw.character.system.bonuses.mwak).toEqual({ attack: "", damage: "" });
    expect(mock.raw.character.system.bonuses.rwak).toEqual({ attack: "", damage: "" });
  });

  it("_generateBonusAbilities writes empty check/save/skill bonuses (saving-throws is effect-routed)", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "saving-throws", value: 1, isGranted: true, restriction: "" },
      { type: "bonus", subType: "ability-checks", value: 2, isGranted: true, restriction: "" },
      { type: "bonus", subType: "skill-checks", value: 3, isGranted: true, restriction: "" },
    ]));
    mock._generateBonusAbilities();
    expect(mock.raw.character.system.bonuses.abilities).toEqual({ check: "", save: "", skill: "" });
  });

  it("_generateBonusSpellDC writes an empty dc bonus (spell-save-dc is effect-routed)", () => {
    const mock = bonusMock(raceModifiers([
      { type: "bonus", subType: "spell-save-dc", value: 1, isGranted: true, restriction: "" },
    ]));
    mock._generateBonusSpellDC();
    expect(mock.raw.character.system.bonuses.spell).toEqual({ dc: "" });
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter global bonuses (audit fixtures)", () => {
  it("produces empty flat global bonuses for a real level 20 capture", async () => {
    const mock = await loadFixtureCharacter("classes/barbarian", "Path-of-the-Ancestral-Guardian", { generateAbilities: false });
    mock._generateBonusSpellAttacks();
    mock._generateBonusWeaponAttacks();
    mock._generateBonusAbilities();
    mock._generateBonusSpellDC();
    const bonuses = mock.raw.character.system.bonuses;
    expect(bonuses.rsak).toEqual({ attack: "", damage: "" });
    expect(bonuses.msak).toEqual({ attack: "", damage: "" });
    expect(bonuses.mwak).toEqual({ attack: "", damage: "" });
    expect(bonuses.rwak).toEqual({ attack: "", damage: "" });
    expect(bonuses.abilities).toEqual({ check: "", save: "", skill: "" });
    expect(bonuses.spell).toEqual({ dc: "" });
  });
});
