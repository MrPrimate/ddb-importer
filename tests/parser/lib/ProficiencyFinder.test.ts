import ProficiencyFinder from "../../../src/parser/lib/ProficiencyFinder";

const globals: any = globalThis;

// =============================================================================
// Fixtures
// =============================================================================

function makeDdb({
  raceMods = [],
  classes = [],
  customProficiencies = [],
  characterValues = [],
}: {
  raceMods?: any[];
  classes?: any[];
  customProficiencies?: any[];
  characterValues?: any[];
} = {}): any {
  return {
    character: {
      modifiers: { race: raceMods, class: [], background: [], feat: [], item: [], condition: [] },
      classes,
      options: { race: [], class: [], feat: [] },
      choices: { race: [], class: [], feat: [] },
      optionalClassFeatures: [],
      optionalOriginFeatures: [],
      inventory: [],
      customProficiencies,
      characterValues,
    },
    classOptions: [],
  };
}

// =============================================================================
// getArmorProficiencies
// =============================================================================

describe("getArmorProficiencies", () => {
  it("maps the armor categories to their dnd5e keys", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getArmorProficiencies([
      { name: "Light Armor" },
      { name: "Medium Armor" },
      { name: "Heavy Armor" },
      { name: "Shields" },
    ]);
    expect(result.value).toEqual(expect.arrayContaining(["lgt", "med", "hvy", "shl"]));
    expect(result.value).toHaveLength(4);
  });

  it("maps specific armors via the dictionary foundryValue", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getArmorProficiencies([{ name: "Chain Mail" }]);
    expect(result.value).toEqual(["chainmail"]);
  });

  it("ignores unknown armor names and never populates custom", () => {
    // Characterization: the custom array is declared but nothing is ever
    // pushed to it, so custom is always the empty string.
    const finder = new ProficiencyFinder();
    const result = finder.getArmorProficiencies([{ name: "Cardboard Box" }]);
    expect(result.value).toEqual([]);
    expect(result.custom).toBe("");
  });

  it("adds custom proficiencies from ddb characterValues", () => {
    // valueId 3 is Studded Leather in the fallback config armor list.
    const ddb = makeDdb({
      characterValues: [{ typeId: 32, valueTypeId: 701257905, value: 3, valueId: 3 }],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getArmorProficiencies([]);
    expect(result.value).toEqual(["studded"]);
  });

  it("skips characterValue proficiencies when excludeCustom is set", () => {
    const ddb = makeDdb({
      characterValues: [{ typeId: 32, valueTypeId: 701257905, value: 3, valueId: 3 }],
    });
    const finder = new ProficiencyFinder({ ddb, excludeCustom: true });
    const result = finder.getArmorProficiencies([]);
    expect(result.value).toEqual([]);
  });
});

// =============================================================================
// getWeaponProficiencies
// =============================================================================

describe("getWeaponProficiencies", () => {
  it("maps weapon category proficiencies", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getWeaponProficiencies([
      { name: "Simple Weapons" },
      { name: "Martial Weapons" },
      { name: "Advanced Weapons" },
    ]);
    expect(result.value).toEqual(expect.arrayContaining(["sim", "mar", "adv"]));
  });

  it("puts known dictionary weapons into custom when not in CONFIG.DND5E.weaponIds", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getWeaponProficiencies([{ name: "Longsword" }]);
    expect(result.value).toEqual([]);
    expect(result.custom).toBe("Longsword");
  });

  it("uses the system weapon id when present, including comma-name normalization", () => {
    globals.CONFIG.DND5E.weaponIds = { longsword: "id1", handcrossbow: "id2" };
    try {
      const finder = new ProficiencyFinder();
      const result = finder.getWeaponProficiencies([
        { name: "Longsword" },
        { name: "Crossbow, Hand" },
      ]);
      expect(result.value).toEqual(expect.arrayContaining(["longsword", "handcrossbow"]));
      expect(result.custom).toBe("");
    } finally {
      globals.CONFIG.DND5E.weaponIds = {};
    }
  });

  it("carries weapon masteries through", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getWeaponProficiencies([], [{ dnd5eName: "cleave" }, { dnd5eName: "nick" }]);
    expect(result.mastery?.value).toEqual(["cleave", "nick"]);
    expect(result.mastery?.bonus).toEqual([]);
  });

  it("adds custom weapon proficiencies from ddb characterValues", () => {
    // valueId 4 is Longsword in the fallback config weapons list.
    const ddb = makeDdb({
      characterValues: [{ typeId: 33, valueTypeId: 1782728300, value: 3, valueId: 4 }],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getWeaponProficiencies([]);
    expect(result.custom).toBe("Longsword");
  });
});

// =============================================================================
// getToolProficiencies
// =============================================================================

describe("getToolProficiencies", () => {
  it("returns tools keyed by baseTool with value 0 when no ddb modifiers exist", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getToolProficiencies([{ name: "Alchemist's Supplies" }]);
    expect(result.alchemist).toBeDefined();
    expect(result.alchemist.value).toBe(0);
    expect(result.alchemist.ability).toBe("int");
  });

  it("grants proficiency from a ddb proficiency modifier", () => {
    const ddb = makeDdb({
      raceMods: [{
        type: "proficiency", subType: "alchemists-supplies",
        friendlySubtypeName: "Alchemist's Supplies", restriction: "",
      }],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getToolProficiencies([{ name: "Alchemist's Supplies" }]);
    expect(result.alchemist.value).toBe(1);
  });

  it("doubles proficiency when the character has Tool Expertise", () => {
    const ddb = makeDdb({
      raceMods: [{
        type: "proficiency", subType: "alchemists-supplies",
        friendlySubtypeName: "Alchemist's Supplies", restriction: "",
      }],
      classes: [{
        level: 3,
        definition: { id: 42, name: "Artificer", classFeatures: [] },
        subclassDefinition: null,
        classFeatures: [{ definition: { id: 500, entityTypeId: 12, name: "Tool Expertise", requiredLevel: 2 } }],
      }],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getToolProficiencies([{ name: "Alchemist's Supplies" }]);
    expect(result.alchemist.value).toBe(2);
  });

  it("grants expertise from an expertise modifier", () => {
    const ddb = makeDdb({
      raceMods: [{
        type: "expertise", subType: "alchemists-supplies",
        friendlySubtypeName: "Alchemist's Supplies", restriction: "",
      }],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getToolProficiencies([{ name: "Alchemist's Supplies" }]);
    expect(result.alchemist.value).toBe(2);
  });

  it("ignores tools not in the dictionary", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getToolProficiencies([{ name: "Imaginary Gadget" }]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("adds custom tool proficiencies from ddb characterValues", () => {
    // valueId 102 is Alchemist's Supplies in the fallback config tools list.
    const ddb = makeDdb({
      characterValues: [{ typeId: 34, valueTypeId: 2103445194, value: 3, valueId: 102 }],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getToolProficiencies([]);
    expect(result.alchemist).toBeDefined();
    expect(result.alchemist.value).toBe(1);
  });
});

// =============================================================================
// getLanguagesFromModifiers / getMappedLanguage
// =============================================================================

describe("languages", () => {
  it("maps language modifiers to dnd5e language keys", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getLanguagesFromModifiers([
      { type: "language", friendlySubtypeName: "Elvish", value: null },
      { type: "language", friendlySubtypeName: "Deep Speech", value: null },
    ] as any[]);
    expect(result.value).toEqual(expect.arrayContaining(["elvish", "deep"]));
    expect(result.custom).toBe("");
  });

  it("puts unknown languages into custom and skips Choose a Language", () => {
    const finder = new ProficiencyFinder();
    const result = finder.getLanguagesFromModifiers([
      { type: "language", friendlySubtypeName: "Blipish", value: null },
      { type: "language", friendlySubtypeName: "Choose a Language", value: null },
    ] as any[]);
    expect(result.value).toEqual([]);
    expect(result.custom).toBe("Blipish");
  });

  it("includes type 3 customProficiencies from the ddb character", () => {
    const ddb = makeDdb({
      customProficiencies: [
        { type: 3, name: "Dwarvish" },
        { type: 3, name: "Ancient Whalesong" },
        { type: 2, name: "Ignored Tool" },
      ],
    });
    const finder = new ProficiencyFinder({ ddb });
    const result = finder.getLanguagesFromModifiers([]);
    expect(result.value).toEqual(["dwarvish"]);
    expect(result.custom).toBe("Ancient Whalesong");
  });

  it("getMappedLanguage matches dictionary names and falls back to null", () => {
    expect(ProficiencyFinder.getMappedLanguage({ name: "Common" })).toBe("common");
    expect(ProficiencyFinder.getMappedLanguage({ name: "Thieves' Cant" })).toBe("cant");
    expect(ProficiencyFinder.getMappedLanguage({ name: "Nonsense" })).toBeNull();
    expect(ProficiencyFinder.getMappedLanguage({})).toBeNull();
  });

  it("getMappedLanguage uses CONFIG.DND5E.languages.ddb children for rare matches", () => {
    globals.CONFIG.DND5E.languages = { ddb: { children: { foolang: "Foo Lang" } } };
    try {
      expect(ProficiencyFinder.getMappedLanguage({ key: "foolang" })).toBe("foolang");
      expect(ProficiencyFinder.getMappedLanguage({ name: "Foo Lang" })).toBe("foolang");
      expect(ProficiencyFinder.getMappedLanguage({ name: "Bar Lang" })).toBeNull();
    } finally {
      globals.CONFIG.DND5E.languages = {};
    }
  });
});

// =============================================================================
// getSkillProficiency / isHalfProficiencyRoundedUp
// =============================================================================

describe("skill proficiency", () => {
  const athletics: any = { label: "Athletics", ability: "str" };

  it("returns 1 for a proficiency modifier", () => {
    const finder = new ProficiencyFinder();
    const mods: any[] = [{ type: "proficiency", friendlySubtypeName: "Athletics", subType: "athletics", restriction: "" }];
    expect(finder.getSkillProficiency(athletics, mods)).toBe(1);
  });

  it("returns 2 for an expertise modifier", () => {
    const finder = new ProficiencyFinder();
    const mods: any[] = [{ type: "expertise", friendlySubtypeName: "Athletics", subType: "athletics", restriction: "" }];
    expect(finder.getSkillProficiency(athletics, mods)).toBe(2);
  });

  it("returns 0.5 for jack of all trades style half proficiency", () => {
    const finder = new ProficiencyFinder();
    const mods: any[] = [{ type: "half-proficiency", subType: "ability-checks", friendlySubtypeName: "Ability Checks", restriction: "" }];
    expect(finder.getSkillProficiency(athletics, mods)).toBe(0.5);
  });

  it("returns 0 with no matching modifiers", () => {
    const finder = new ProficiencyFinder();
    const mods: any[] = [{ type: "bonus", subType: "speed", friendlySubtypeName: "Speed", restriction: "" }];
    expect(finder.getSkillProficiency(athletics, mods)).toBe(0);
  });

  it("returns null with no modifiers and no ddb", () => {
    const finder = new ProficiencyFinder();
    expect(finder.getSkillProficiency(athletics, null)).toBeNull();
  });

  it("isHalfProficiencyRoundedUp is truthy only for a matching ability modifier list", () => {
    const finder = new ProficiencyFinder();
    const mods: any[] = [{ type: "half-proficiency-round-up", subType: "strength-ability-checks", restriction: "" }];
    expect(finder.isHalfProficiencyRoundedUp("str", mods)).toBeTruthy();
    expect(finder.isHalfProficiencyRoundedUp("dex", mods)).toBeFalsy();
  });

  it("isHalfProficiencyRoundedUp reads base modifiers from the ddb when no list given", () => {
    const ddb = makeDdb({
      raceMods: [{ type: "half-proficiency-round-up", subType: "strength-ability-checks", restriction: "" }],
    });
    const finder = new ProficiencyFinder({ ddb });
    expect(finder.isHalfProficiencyRoundedUp("str")).toBeTruthy();
    expect(finder.isHalfProficiencyRoundedUp("cha")).toBeFalsy();
  });
});
