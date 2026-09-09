import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/abilities";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster._generateAbilities", () => {
  const generateAbilities = DDBMonster.prototype._generateAbilities;

  it("all stats 10: all values 10, all proficient 0", () => {
    const mock = makeMockMonster();
    generateAbilities.call(mock);

    expect(mock.npc.system.abilities.str.value).toBe(10);
    expect(mock.npc.system.abilities.str.proficient).toBe(0);
    expect(mock.npc.system.abilities.dex.value).toBe(10);
    expect(mock.npc.system.abilities.con.value).toBe(10);
    expect(mock.npc.system.abilities.int.value).toBe(10);
    expect(mock.npc.system.abilities.wis.value).toBe(10);
    expect(mock.npc.system.abilities.cha.value).toBe(10);
  });

  // Giant Wolf Spider: STR 12, DEX 16, CON 13, INT 3, WIS 12, CHA 4; CR 1/4 (prof +2)
  it("Giant Wolf Spider abilities", () => {
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 12 },
          { statId: 2, value: 16 },
          { statId: 3, value: 13 },
          { statId: 4, value: 3 },
          { statId: 5, value: 12 },
          { statId: 6, value: 4 },
        ],
        challengeRatingId: 3, // CR 1/4, prof +2
        savingThrows: [],
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.abilities.str.value).toBe(12);
    expect(mock.npc.system.abilities.dex.value).toBe(16);
    expect(mock.npc.system.abilities.con.value).toBe(13);
    expect(mock.npc.system.abilities.int.value).toBe(3);
    expect(mock.npc.system.abilities.wis.value).toBe(12);
    expect(mock.npc.system.abilities.cha.value).toBe(4);
  });

  it("saving throw proficiency is detected", () => {
    const mock = makeMockMonster({
      source: {
        savingThrows: [
          { statId: 5, bonusModifier: null }, // WIS save
        ],
        challengeRatingId: 3,
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.abilities.wis.proficient).toBe(1);
    expect(mock.npc.system.abilities.str.proficient).toBe(0);
  });

  it("no initiative bonus when initiativeBonus is null", () => {
    const mock = makeMockMonster({
      source: { initiativeBonus: null, extraInitiative: null },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.attributes.init.roll.bonus).toBe("");
  });

  it("multiple saving throws all proficient", () => {
    const mock = makeMockMonster({
      source: {
        savingThrows: [
          { statId: 3, bonusModifier: null }, // CON
          { statId: 5, bonusModifier: null }, // WIS
          { statId: 6, bonusModifier: null }, // CHA
        ],
        challengeRatingId: 3,
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.abilities.con.proficient).toBe(1);
    expect(mock.npc.system.abilities.wis.proficient).toBe(1);
    expect(mock.npc.system.abilities.cha.proficient).toBe(1);
    expect(mock.npc.system.abilities.str.proficient).toBe(0);
    expect(mock.npc.system.abilities.dex.proficient).toBe(0);
    expect(mock.npc.system.abilities.int.proficient).toBe(0);
  });
});
