vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/skills";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe("DDBMonster._generateSkills", () => {
  const generateSkills = DDBMonster.prototype._generateSkills;

  it("no skills: all values remain 0", () => {
    const mock = makeMockMonster({
      source: { skills: [], challengeRatingId: 3 },
    });
    generateSkills.call(mock);

    expect(mock.npc.system.skills.ste.value).toBe(0);
    expect(mock.npc.system.skills.prc.value).toBe(0);
  });

  // Giant Wolf Spider: Stealth +7 (skillId 5, DEX 16 mod +3, prof +2 → expected +5, actual +7 → double prof)
  // Perception +3 (skillId 14, WIS 12 mod +1, prof +2 → expected +3 → single prof)
  it("Giant Wolf Spider: Stealth double prof, Perception single prof", () => {
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 12 },
          { statId: 2, value: 16 }, // DEX 16
          { statId: 3, value: 13 },
          { statId: 4, value: 3 },
          { statId: 5, value: 12 }, // WIS 12
          { statId: 6, value: 4 },
        ],
        skills: [
          { skillId: 5, value: 7, additionalBonus: null },  // Stealth +7
          { skillId: 14, value: 3, additionalBonus: null },  // Perception +3
        ],
        challengeRatingId: 3, // CR 1/4, prof +2
      },
    });
    generateSkills.call(mock);

    // Stealth: DEX mod 3 + prof 2 = 5, but actual value 7 = 5 + 2 → double prof
    expect(mock.npc.system.skills.ste.value).toBe(2);
    // Perception: WIS mod 1 + prof 2 = 3, actual value 3 → single prof
    expect(mock.npc.system.skills.prc.value).toBe(1);
  });

  it("skill with additionalBonus", () => {
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 10 },
          { statId: 2, value: 10 },
          { statId: 3, value: 10 },
          { statId: 4, value: 10 },
          { statId: 5, value: 10 }, // WIS 10
          { statId: 6, value: 10 },
        ],
        skills: [
          // Perception: WIS mod(0) + prof(2) = 2 = calculatedScore
          // value matches calculatedScore exactly, so stays single prof
          // additionalBonus stored separately in bonuses
          { skillId: 14, value: 2, additionalBonus: 3 },
        ],
        challengeRatingId: 3, // prof +2
      },
    });
    generateSkills.call(mock);

    expect(mock.npc.system.skills.prc.value).toBe(1);
    expect(mock.npc.system.skills.prc.bonuses.check).toBe("3");
    expect(mock.npc.system.skills.prc.bonuses.passive).toBe("3");
  });

  it("non-proficient skills stay at 0", () => {
    const mock = makeMockMonster({
      source: {
        skills: [
          { skillId: 5, value: 5, additionalBonus: null }, // Stealth only
        ],
        challengeRatingId: 3,
      },
    });
    generateSkills.call(mock);

    // Athletics has no skill entry → remains 0
    expect(mock.npc.system.skills.ath.value).toBe(0);
  });

  it("returns the skills object", () => {
    const mock = makeMockMonster({ source: { skills: [], challengeRatingId: 3 } });
    const result = generateSkills.call(mock);

    expect(result).toBe(mock.npc.system.skills);
  });
});
