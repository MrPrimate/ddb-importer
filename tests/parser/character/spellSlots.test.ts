import DDBCharacter from "../../../src/parser/DDBCharacter";
import "../../../src/parser/character/spellCasting";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";

const WIZARD_SLOTS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  [4, 3, 2, 0, 0, 0, 0, 0, 0],
];

function wizardClass(level: number) {
  return {
    id: 1,
    level,
    definition: {
      name: "Wizard",
      canCastSpells: true,
      spellRules: {
        multiClassSpellSlotDivisor: 1,
        levelCantripsKnownMaxes: [0, 3, 3, 3, 4, 4, 4],
        levelSpellSlots: WIZARD_SLOTS,
      },
    },
  };
}

function warlockClass(level: number) {
  return {
    id: 2,
    level,
    definition: {
      name: "Warlock",
      canCastSpells: true,
      spellRules: {
        multiClassSpellSlotDivisor: 1,
        levelCantripsKnownMaxes: [0, 2, 2, 2, 3, 3, 3],
        levelSpellSlots: [[0, 0, 0, 0, 0], [1, 0, 0, 0, 0], [2, 0, 0, 0, 0], [0, 2, 0, 0, 0], [0, 2, 0, 0, 0], [0, 0, 2, 0, 0]],
      },
    },
  };
}

// =============================================================================
// _generateSpellSlots
// =============================================================================
describe("DDBCharacter._generateSpellSlots", () => {
  const generateSlots = DDBCharacter.prototype._generateSpellSlots;

  it("subtracts used slots from the class maximum", () => {
    const mock = makeMockCharacter({
      spellSlots: {},
      getCasterInfo: DDBCharacter.prototype.getCasterInfo,
      ddbCharacter: {
        classes: [wizardClass(5)],
        spellSlots: [{ level: 1, used: 1, available: 4 }, { level: 3, used: 2, available: 2 }],
        pactMagic: [],
      },
    });

    generateSlots.call(mock);

    expect(mock.raw.character.system.spells.spell1).toEqual({ value: 3, max: 4 });
    expect(mock.raw.character.system.spells.spell2).toEqual({ value: 3, max: 3 });
    expect(mock.raw.character.system.spells.spell3).toEqual({ value: 0, max: 2 });
  });

  it("clamps a stale DDB used count above the maximum to zero remaining", () => {
    const mock = makeMockCharacter({
      spellSlots: {},
      getCasterInfo: DDBCharacter.prototype.getCasterInfo,
      ddbCharacter: {
        classes: [wizardClass(5)],
        spellSlots: [{ level: 3, used: 298, available: 0 }],
        pactMagic: [],
      },
    });

    generateSlots.call(mock);

    expect(mock.raw.character.system.spells.spell3).toEqual({ value: 0, max: 2 });
    expect(mock.raw.character.system.spells.spell1).toEqual({ value: 4, max: 4 });
  });

  it("clamps pact slots the same way", () => {
    const mock = makeMockCharacter({
      spellSlots: {},
      getCasterInfo: DDBCharacter.prototype.getCasterInfo,
      ddbCharacter: {
        classes: [warlockClass(3)],
        spellSlots: [],
        pactMagic: [{ level: 2, used: 5, available: 0 }],
      },
    });

    generateSlots.call(mock);

    expect(mock.raw.character.system.spells.pact).toEqual({ value: 0, max: "2" });
  });
});
