import DDBMonster from "../../../src/parser/DDBMonster";
import "../../../src/parser/monster/skills";
import { utils } from "../../../src/lib/_module";
import { makeMockMonster } from "../../_fixtures/mockMonster";

describe.each(["_generateSkills", "_generateSkillsHTML"] as const)("DDBMonster.%s additional bonuses", (method) => {
  beforeEach(() => {
    vi.stubGlobal("CONFIG", {
      ...CONFIG,
      DDB: {
        ...CONFIG.DDB,
        challengeRatings: [{ id: 3, proficiencyBonus: 2 }],
        statModifiers: [{ value: 10, modifier: 0 }],
      },
    });
    // These fixtures contain plain text, so no DOM is needed to strip markup.
    vi.spyOn(utils, "stripHtml").mockImplementation((text) => text);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["", "5"])("applies the check bonus without overwriting passive-only bonus %j", (passiveBonus) => {
    const mock = makeMockMonster({
      source: {
        skills: [{ skillId: 14, value: 2, additionalBonus: 3 }],
        skillsHtml: "Perception +5",
        challengeRatingId: 3,
      },
    });
    mock.npc.system.skills.prc.bonuses.passive = passiveBonus;

    DDBMonster.prototype[method].call(mock);

    const skill = mock.npc.system.skills.prc;
    expect(skill.value).toBe(1);
    expect(skill.bonuses.check).toBe("3");
    // The system includes the check bonus in passive scores automatically.
    expect(skill.bonuses.passive).toBe(passiveBonus);
  });
});
