import "../../../src/parser/character/skills";
import DDBCharacter from "../../../src/parser/DDBCharacter";
import ProficiencyFinder from "../../../src/parser/lib/ProficiencyFinder";
import { makeMockCharacter } from "../../_fixtures/mockCharacter";
import { auditFixturesPresent, loadFixtureCharacter } from "../../_fixtures/ddb/auditCharacterFixtures";

// entries mirror DICTIONARY.actor.skills
const ATHLETICS: IDDBSkillsLookup = { name: "ath", label: "Athletics", ability: "str", subType: "athletics", valueId: 2 };
const ACROBATICS: IDDBSkillsLookup = { name: "acr", label: "Acrobatics", ability: "dex", subType: "acrobatics", valueId: 3 };
const PERCEPTION: IDDBSkillsLookup = { name: "prc", label: "Perception", ability: "wis", subType: "perception", valueId: 14 };

function skillMock(ddbCharacter: Record<string, any>): any {
  const mock = makeMockCharacter({ ddbCharacter });
  mock.proficiencyFinder = new ProficiencyFinder({ ddb: mock.source.ddb });
  // composite methods (_generateSkills) call sibling prototype methods, so the
  // mock adopts the real prototype like the fixture loader does
  Object.setPrototypeOf(mock, DDBCharacter.prototype);
  return mock;
}

function mod(overrides: Record<string, any>): any {
  return { isGranted: true, restriction: "", ...overrides };
}

// =============================================================================
// getSkillProficiency
// =============================================================================
describe("DDBCharacter.getSkillProficiency (synthetic)", () => {
  const getSkillProficiency = DDBCharacter.prototype.getSkillProficiency;

  it("returns 0 with no matching modifiers", () => {
    const mock = skillMock({});
    expect(getSkillProficiency.call(mock, ATHLETICS, [])).toBe(0);
  });

  it("returns 1 for a proficiency modifier matching the skill label", () => {
    const mock = skillMock({});
    const modifiers = [mod({ type: "proficiency", subType: "athletics", friendlySubtypeName: "Athletics" })];
    expect(getSkillProficiency.call(mock, ATHLETICS, modifiers)).toBe(1);
  });

  it("expertise wins over proficiency", () => {
    const mock = skillMock({});
    const modifiers = [
      mod({ type: "proficiency", subType: "athletics", friendlySubtypeName: "Athletics" }),
      mod({ type: "expertise", subType: "athletics", friendlySubtypeName: "Athletics" }),
    ];
    expect(getSkillProficiency.call(mock, ATHLETICS, modifiers)).toBe(2);
  });

  it("Jack of All Trades gives 0.5 on an unproficient skill", () => {
    const mock = skillMock({});
    const modifiers = [mod({ type: "half-proficiency", subType: "ability-checks", friendlySubtypeName: "Ability Checks" })];
    expect(getSkillProficiency.call(mock, PERCEPTION, modifiers)).toBe(0.5);
  });

  it("full proficiency beats half proficiency", () => {
    const mock = skillMock({});
    const modifiers = [
      mod({ type: "half-proficiency", subType: "ability-checks", friendlySubtypeName: "Ability Checks" }),
      mod({ type: "proficiency", subType: "perception", friendlySubtypeName: "Perception" }),
    ];
    expect(getSkillProficiency.call(mock, PERCEPTION, modifiers)).toBe(1);
  });

  it("half-proficiency-round-up applies only to the matching ability (Remarkable Athlete)", () => {
    const mock = skillMock({});
    const modifiers = [
      mod({ type: "half-proficiency-round-up", subType: "strength-ability-checks", friendlySubtypeName: "Strength Ability Checks" }),
    ];
    expect(getSkillProficiency.call(mock, ATHLETICS, modifiers)).toBe(0.5);
    expect(getSkillProficiency.call(mock, PERCEPTION, modifiers)).toBe(0);
  });

  it("pulls modifiers from the DDB source when none are passed", () => {
    const mock = skillMock({
      modifiers: {
        race: [mod({ type: "proficiency", subType: "athletics", friendlySubtypeName: "Athletics" })],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    expect(getSkillProficiency.call(mock, ATHLETICS)).toBe(1);
    expect(getSkillProficiency.call(mock, ACROBATICS)).toBe(0);
  });
});

// =============================================================================
// getCustomSkillProficiency (characterValues typeId 26)
// =============================================================================
describe("DDBCharacter.getCustomSkillProficiency", () => {
  const getCustomSkillProficiency = DDBCharacter.prototype.getCustomSkillProficiency;

  it("returns undefined when no custom value exists", () => {
    expect(getCustomSkillProficiency.call(skillMock({}), ATHLETICS)).toBeUndefined();
  });

  it.each([
    [1, 0], // "not proficient" override
    [2, 0.5],
    [3, 1],
    [4, 2],
  ])("maps DDB custom value %i to proficiency %d", (value, expected) => {
    const mock = skillMock({ characterValues: [{ typeId: 26, valueId: ATHLETICS.valueId, value }] });
    expect(getCustomSkillProficiency.call(mock, ATHLETICS)).toBe(expected);
  });

  it("returns undefined for an unmapped custom value", () => {
    const mock = skillMock({ characterValues: [{ typeId: 26, valueId: ATHLETICS.valueId, value: 99 }] });
    expect(getCustomSkillProficiency.call(mock, ATHLETICS)).toBeUndefined();
  });

  it("ignores entries for other typeIds or skills", () => {
    const mock = skillMock({
      characterValues: [
        { typeId: 27, valueId: ATHLETICS.valueId, value: 4 },
        { typeId: 26, valueId: PERCEPTION.valueId, value: 4 },
      ],
    });
    expect(getCustomSkillProficiency.call(mock, ATHLETICS)).toBeUndefined();
  });
});

// =============================================================================
// getCustomSkillAbility (characterValues typeId 27)
// =============================================================================
describe("DDBCharacter.getCustomSkillAbility", () => {
  const getCustomSkillAbility = DDBCharacter.prototype.getCustomSkillAbility;

  it("returns undefined when no custom ability exists", () => {
    expect(getCustomSkillAbility.call(skillMock({}), ATHLETICS)).toBeUndefined();
  });

  it("maps a custom ability id to its 5e key", () => {
    // ability id 2 = dex
    const mock = skillMock({ characterValues: [{ typeId: 27, valueId: ATHLETICS.valueId, value: 2 }] });
    expect(getCustomSkillAbility.call(mock, ATHLETICS)).toBe("dex");
  });

  it("returns undefined for an unknown ability id", () => {
    const mock = skillMock({ characterValues: [{ typeId: 27, valueId: ATHLETICS.valueId, value: 99 }] });
    expect(getCustomSkillAbility.call(mock, ATHLETICS)).toBeUndefined();
  });
});

// =============================================================================
// getCustomSkillBonus (characterValues typeIds 24/25)
// =============================================================================
describe("DDBCharacter.getCustomSkillBonus", () => {
  const getCustomSkillBonus = DDBCharacter.prototype.getCustomSkillBonus;

  it("returns 0 when no custom bonuses exist", () => {
    expect(getCustomSkillBonus.call(skillMock({}), ATHLETICS)).toBe(0);
  });

  it("sums bonuses from typeId 24 and 25", () => {
    const mock = skillMock({
      characterValues: [
        { typeId: 24, valueId: ATHLETICS.valueId, value: 2 },
        { typeId: 25, valueId: ATHLETICS.valueId, value: 3 },
      ],
    });
    expect(getCustomSkillBonus.call(mock, ATHLETICS)).toBe(5);
  });

  it("ignores bonuses for other skills", () => {
    const mock = skillMock({ characterValues: [{ typeId: 24, valueId: PERCEPTION.valueId, value: 2 }] });
    expect(getCustomSkillBonus.call(mock, ATHLETICS)).toBe(0);
  });
});

// =============================================================================
// _setSpecialSkills (Silver Tongue)
// =============================================================================
describe("DDBCharacter._setSpecialSkills", () => {
  const setSpecialSkills = DDBCharacter.prototype._setSpecialSkills;

  function silverTongueMock(level: number): any {
    const mock = skillMock({
      classes: [{
        level,
        classFeatures: [],
        subclassDefinition: {
          classFeatures: [{ name: "Silver Tongue", requiredLevel: 3 }],
        },
      }],
    });
    mock.raw.character.system.skills = {
      per: { roll: { min: null, max: null, mode: 0 } },
      dec: { roll: { min: null, max: null, mode: 0 } },
    };
    return mock;
  }

  it("sets a minimum roll of 10 on Persuasion and Deception", () => {
    const mock = silverTongueMock(3);
    setSpecialSkills.call(mock);
    expect(mock.raw.character.system.skills.per.roll.min).toBe(10);
    expect(mock.raw.character.system.skills.dec.roll.min).toBe(10);
  });

  it("does nothing below the required level", () => {
    const mock = silverTongueMock(2);
    setSpecialSkills.call(mock);
    expect(mock.raw.character.system.skills.per.roll.min).toBeNull();
    expect(mock.raw.character.system.skills.dec.roll.min).toBeNull();
  });
});

// =============================================================================
// _generateSkills
// =============================================================================
describe("DDBCharacter._generateSkills (synthetic)", () => {
  it("writes proficiency, expertise and the default shape for every skill", async () => {
    const mock = skillMock({
      modifiers: {
        race: [
          mod({ type: "proficiency", subType: "athletics", friendlySubtypeName: "Athletics" }),
          mod({ type: "expertise", subType: "stealth", friendlySubtypeName: "Stealth" }),
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    await mock._generateSkills();
    const skills = mock.raw.character.system.skills;
    expect(skills.ath.value).toBe(1);
    expect(skills.ste.value).toBe(2);
    expect(skills.acr).toEqual({
      value: 0,
      ability: "dex",
      bonuses: { passive: "" },
      roll: { bonus: "", min: null, max: null, mode: 0 },
    });
    expect(Object.keys(skills)).toHaveLength(18);
    // without dae active the skill-customization flag skeleton is created
    expect(mock.raw.character.flags["skill-customization-5e"]).toEqual({});
  });

  it("does not bake skill bonus modifiers into check bonuses (they emit as effects)", async () => {
    // every per-skill and passive-skill bonus subType is listed in
    // config/dictionary/effects/excluded.ts, so these modifiers are filtered
    // out here and handled by the active-effect pipeline instead
    const mock = skillMock({
      modifiers: {
        race: [
          mod({ type: "bonus", subType: "perception", friendlySubtypeName: "Perception", value: 2 }),
          mod({ type: "bonus", subType: "passive-perception", friendlySubtypeName: "Passive Perception", value: 5 }),
        ],
        class: [], background: [], item: [], feat: [], condition: [],
      },
    });
    await mock._generateSkills();
    expect(mock.raw.character.system.skills.prc.bonuses).toEqual({ passive: "" });
    expect(mock.raw.character.system.skills.prc.roll.bonus).toBe("");
  });

  it("bakes custom characterValues bonuses into the check bonus", async () => {
    // arcana valueId = 6
    const mock = skillMock({
      characterValues: [{ typeId: 24, valueId: 6, value: 2 }],
    });
    await mock._generateSkills();
    expect(mock.raw.character.system.skills.arc.roll.bonus).toBe("2");
  });

  it("lets a custom proficiency override modifiers in both directions", async () => {
    const mock = skillMock({
      modifiers: {
        race: [mod({ type: "proficiency", subType: "athletics", friendlySubtypeName: "Athletics" })],
        class: [], background: [], item: [], feat: [], condition: [],
      },
      characterValues: [
        { typeId: 26, valueId: ATHLETICS.valueId, value: 1 }, // remove proficiency
        { typeId: 26, valueId: 5, value: 4 }, // stealth (valueId 5) to expertise
      ],
    });
    await mock._generateSkills();
    expect(mock.raw.character.system.skills.ath.value).toBe(0);
    expect(mock.raw.character.system.skills.ste.value).toBe(2);
  });

  it("applies a custom skill ability as an override plus an active effect", async () => {
    // acrobatics valueId 3, ability id 1 = str
    const mock = skillMock({
      characterValues: [{ typeId: 27, valueId: ACROBATICS.valueId, value: 1 }],
    });
    await mock._generateSkills();
    expect(mock.raw.character.system.skills.acr.ability).toBe("str");
    const effect = mock.raw.character.effects.find((e: any) => e.name === "Skill Ability Changes");
    expect(effect).toBeDefined();
    expect(effect.system.changes).toEqual([
      { key: "system.skills.acr.ability", type: "override", value: "str", priority: 20 },
    ]);
  });
});

describe.skipIf(!auditFixturesPresent())("DDBCharacter._generateSkills (audit fixtures)", () => {
  it("gives every unproficient skill 0.5 for a bard with Jack of All Trades", async () => {
    const mock = await loadFixtureCharacter("classes/bard", "College-of-Adventurers");
    await mock._generateSkills();
    const skills = mock.raw.character.system.skills;
    expect(Object.keys(skills)).toHaveLength(18);
    for (const skill of Object.values<any>(skills)) {
      expect(skill.value).toBe(0.5);
    }
  });

  it("parses a race-granted skill proficiency (Grung Perception)", async () => {
    const mock = await loadFixtureCharacter("species", "-Grung-");
    await mock._generateSkills();
    expect(mock.raw.character.system.skills.prc.value).toBe(1);
    expect(mock.raw.character.system.skills.acr.value).toBe(0);
  });

  it("grants nothing for unresolved skill choices (mule rogue capture)", async () => {
    // the mule characters leave "Choose a Rogue Skill Proficiency" and
    // "Choose a Skill Expertise" unpicked, so no modifier carries a concrete
    // skill name and every skill stays at 0
    const mock = await loadFixtureCharacter("classes/rogue", "Arachnoid-Stalker");
    await mock._generateSkills();
    const skills = mock.raw.character.system.skills;
    for (const skill of Object.values<any>(skills)) {
      expect(skill.value).toBe(0);
    }
  });
});
