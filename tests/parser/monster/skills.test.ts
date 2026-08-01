import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/skills";
import { logger } from "../../../src/lib/_module";
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

describe("DDBMonster._generateSkillsHTML", () => {
  const generateSkillsHTML = DDBMonster.prototype._generateSkillsHTML;

  // utils.stripHtml uses document.createElement; provide a minimal stub for
  // the node test environment (skillsHtml fixtures are plain text)
  beforeAll(() => {
    (globalThis as any).document = {
      createElement: () => {
        let html = "";
        return {
          set innerHTML(value: string) {
            html = value;
          },
          get textContent() {
            return html;
          },
          get innerText() {
            return html;
          },
        };
      },
    };
  });

  afterAll(() => {
    delete (globalThis as any).document;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Zuul (Mesozoic monsters): negative modifiers written as "+-" in skillsHtml
  it("parses +- negative modifiers without error (Zuul)", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 18 }, // STR +4
          { statId: 2, value: 4 }, // DEX -3
          { statId: 3, value: 16 },
          { statId: 4, value: 2 },
          { statId: 5, value: 14 }, // WIS +2
          { statId: 6, value: 8 }, // CHA -1
        ],
        skills: [
          { skillId: 2, value: 0, additionalBonus: null }, // Athletics
          { skillId: 3, value: 0, additionalBonus: null }, // Acrobatics
          { skillId: 14, value: 3, additionalBonus: null }, // Perception
          { skillId: 17, value: 4, additionalBonus: null }, // Intimidation
        ],
        skillsHtml: "Athletics +-8, Acrobatics +-10, Perception +3, Intimidation +4",
        challengeRatingId: 9, // CR 5, prof +3
      },
    });
    generateSkillsHTML.call(mock);

    expect(errorSpy).not.toHaveBeenCalled();
    // html totals match neither prof nor expertise → flat check bonuses so
    // sheet totals equal the stat block (total = mod + prof + bonus)
    // Athletics -8: str +4, prof +3 → bonus -15
    expect(mock.npc.system.skills.ath.value).toBe(1);
    expect(mock.npc.system.skills.ath.bonuses.check).toBe("-15");
    // Acrobatics -10: dex -3, prof +3 → bonus -10
    expect(mock.npc.system.skills.acr.value).toBe(1);
    expect(mock.npc.system.skills.acr.bonuses.check).toBe("-10");
    // Perception +3: wis +2, prof +3 → bonus -2
    expect(mock.npc.system.skills.prc.value).toBe(1);
    expect(mock.npc.system.skills.prc.bonuses.check).toBe("-2");
    // Intimidation +4: cha -1, prof +3 → bonus +2
    expect(mock.npc.system.skills.itm.value).toBe(1);
    expect(mock.npc.system.skills.itm.bonuses.check).toBe("2");
  });

  it("parses spaced positive modifiers (History + 12, Perception + 10)", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const mock = makeMockMonster({
      source: {
        skills: [
          { skillId: 7, value: 12, additionalBonus: null }, // History
          { skillId: 14, value: 10, additionalBonus: null }, // Perception
        ],
        skillsHtml: "History + 12, Perception + 10",
        challengeRatingId: 3, // prof +2
      },
    });
    generateSkillsHTML.call(mock);

    expect(errorSpy).not.toHaveBeenCalled();
    // all stats 10 (mod 0), prof +2: html 12/10 match neither prof (2) nor
    // expertise (4) → flat bonuses make totals match exactly
    expect(mock.npc.system.skills.his.value).toBe(1);
    expect(mock.npc.system.skills.his.bonuses.check).toBe("10");
    expect(mock.npc.system.skills.prc.value).toBe(1);
    expect(mock.npc.system.skills.prc.bonuses.check).toBe("8");
  });

  it("detects expertise when the html value equals mod + double prof (Stealth +7)", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 10 },
          { statId: 2, value: 16 }, // DEX +3
          { statId: 3, value: 10 },
          { statId: 4, value: 10 },
          { statId: 5, value: 10 },
          { statId: 6, value: 10 },
        ],
        skills: [
          { skillId: 5, value: 7, additionalBonus: null }, // Stealth
        ],
        skillsHtml: "Stealth +7",
        challengeRatingId: 3, // prof +2
      },
    });
    generateSkillsHTML.call(mock);

    expect(errorSpy).not.toHaveBeenCalled();
    // dex +3, prof +2 → expertise total 7 matches html exactly
    expect(mock.npc.system.skills.ste.value).toBe(2);
    expect(mock.npc.system.skills.ste.bonuses.check).toBe("");
  });

  it("html value matching mod + prof stays single proficiency with no bonus", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const mock = makeMockMonster({
      source: {
        skills: [
          { skillId: 14, value: 2, additionalBonus: null }, // Perception
        ],
        skillsHtml: "Perception +2",
        challengeRatingId: 3, // prof +2
      },
    });
    generateSkillsHTML.call(mock);

    expect(errorSpy).not.toHaveBeenCalled();
    // wis +0, prof +2 → html +2 matches proficient calculation exactly
    expect(mock.npc.system.skills.prc.value).toBe(1);
    expect(mock.npc.system.skills.prc.bonuses.check).toBe("");
  });

  it("html value between proficiency and expertise adds a flat bonus", () => {
    const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const mock = makeMockMonster({
      source: {
        stats: [
          { statId: 1, value: 10 },
          { statId: 2, value: 10 },
          { statId: 3, value: 10 },
          { statId: 4, value: 10 },
          { statId: 5, value: 14 }, // WIS +2
          { statId: 6, value: 10 },
        ],
        skills: [
          { skillId: 14, value: 5, additionalBonus: null }, // Perception
        ],
        skillsHtml: "Perception +5",
        challengeRatingId: 3, // prof +2
      },
    });
    generateSkillsHTML.call(mock);

    expect(errorSpy).not.toHaveBeenCalled();
    // wis +2, prof +2 → proficient 4, expertise 6; html +5 sits between →
    // stays proficient with a +1 flat bonus so the total is exactly 5
    expect(mock.npc.system.skills.prc.value).toBe(1);
    expect(mock.npc.system.skills.prc.bonuses.check).toBe("1");
  });
});
