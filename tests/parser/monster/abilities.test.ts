vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

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

  it("saving throw bonus modifier is stored", () => {
    const mock = makeMockMonster({
      source: {
        savingThrows: [
          { statId: 3, bonusModifier: 2 }, // CON save with +2 bonus
        ],
        challengeRatingId: 3,
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.abilities.con.proficient).toBe(1);
    expect(mock.npc.system.abilities.con.bonuses.save).toBe("2");
  });

  it("DC is calculated as mod + proficiency + 8", () => {
    // STR 16 (mod +3), CR 1/4 (prof +2) → DC = 3 + 2 + 8 = 13
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 16 },
          { statId: 2, value: 10 },
          { statId: 3, value: 10 },
          { statId: 4, value: 10 },
          { statId: 5, value: 10 },
          { statId: 6, value: 10 },
        ],
        challengeRatingId: 3,
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.abilities.str.dc).toBe(13);
  });

  it("stores abilities on this.abilities with mod", () => {
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 14 },
          { statId: 2, value: 10 },
          { statId: 3, value: 10 },
          { statId: 4, value: 10 },
          { statId: 5, value: 10 },
          { statId: 6, value: 10 },
        ],
        challengeRatingId: 3,
      },
    });
    generateAbilities.call(mock);

    expect(mock.abilities.str.mod).toBe(2);
    expect(mock.abilities.dex.mod).toBe(0);
  });

  it("initiative bonus from source.initiativeBonus", () => {
    // DEX 14 (mod +2), initiativeBonus 4 → initBonus = 4 - 2 = 2 = prof
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 10 },
          { statId: 2, value: 14 },
          { statId: 3, value: 10 },
          { statId: 4, value: 10 },
          { statId: 5, value: 10 },
          { statId: 6, value: 10 },
        ],
        challengeRatingId: 3, // prof +2
        initiativeBonus: 4,
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.attributes.init.bonus).toBe("@prof");
  });

  it("no initiative bonus when initiativeBonus is null", () => {
    const mock = makeMockMonster({
      source: { initiativeBonus: null, extraInitiative: null },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.attributes.init.bonus).toBe("");
  });

  it("initiative bonus from extraInitiative", () => {
    // DEX 10 (mod +0), extraInitiative 4, prof +2 → initBonus = 4 - 0 = 4 = 2*prof
    const mock = makeMockMonster({
      source: {
        initiativeBonus: null,
        extraInitiative: 4,
        challengeRatingId: 3, // prof +2
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.attributes.init.bonus).toBe("2 * @prof");
  });

  it("non-prof initiative bonus stored as raw number", () => {
    // DEX 10 (mod +0), initiativeBonus 3, prof +2 → initBonus = 3 - 0 = 3 (not prof)
    const mock = makeMockMonster({
      source: {
        initiativeBonus: 3,
        challengeRatingId: 3, // prof +2
      },
    });
    generateAbilities.call(mock);

    expect(mock.npc.system.attributes.init.bonus).toBe("3");
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
