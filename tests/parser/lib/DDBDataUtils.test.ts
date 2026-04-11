// Mock barrel re-exports to break circular dependency chains
vi.mock("../../../src/config/_module", async () => {
  const dict = await vi.importActual<any>("../../../src/config/dictionary/dictionary");
  return { SETTINGS: { MODULE_ID: "ddb-importer" }, DICTIONARY: dict.default };
});
vi.mock("../../../src/effects/_module", () => ({}));
vi.mock("../../../src/effects/DDBEffectHelper", () => ({ default: {} }));

import DDBDataUtils from "../../../src/parser/lib/DDBDataUtils";

// =============================================================================
// Shared mock DDB data
// =============================================================================
function makeDDB(overrides: any = {}): any {
  return {
    character: {
      classes: [
        {
          definition: {
            id: 1,
            name: "Fighter",
            classFeatures: [
              { id: 100, name: "Action Surge" },
              { id: 101, name: "Second Wind" },
            ],
          },
          subclassDefinition: {
            id: 10,
            name: "Champion",
            classFeatures: [
              { id: 200, name: "Improved Critical" },
            ],
          },
          classFeatures: [
            { definition: { id: 100, name: "Action Surge", entityTypeId: 1, requiredLevel: 2 } },
            { definition: { id: 101, name: "Second Wind", entityTypeId: 1, requiredLevel: 1 } },
            { definition: { id: 200, name: "Improved Critical", entityTypeId: 1, requiredLevel: 3 } },
          ],
          level: 5,
          isStartingClass: true,
        },
      ],
      options: { class: [], race: [], feat: [] },
      choices: { class: [], race: [], feat: [] },
      modifiers: { class: [], race: [], background: [], item: [], feat: [], condition: [] },
      optionalClassFeatures: [],
      characterValues: [],
      ...overrides.character,
    },
    ...overrides,
  };
}

// =============================================================================
// getName
// =============================================================================
describe("DDBDataUtils.getName", () => {
  it("returns definition.name", () => {
    const ddb = makeDDB();
    const item = { definition: { name: "Longsword" } };
    expect(DDBDataUtils.getName(ddb, item)).toBe("Longsword");
  });

  it("returns item.name when no definition", () => {
    const ddb = makeDDB();
    const item = { name: "Shield" };
    expect(DDBDataUtils.getName(ddb, item)).toBe("Shield");
  });

  it("decodes HTML entities via nameString", () => {
    const ddb = makeDDB();
    const item = { definition: { name: "Fire &amp; Ice" } };
    expect(DDBDataUtils.getName(ddb, item)).toBe("Fire & Ice");
  });

  it("uses custom name from characterValues when present", () => {
    const ddb = makeDDB({
      character: {
        characterValues: [
          { valueId: 42, valueTypeId: 1, typeId: 8, value: "My Custom Sword" },
        ],
      },
    });
    const item = { id: 42, entityTypeId: 1, definition: { name: "Longsword" },
      flags: { ddbimporter: { dndbeyond: { id: 42, entityTypeId: 1 }, id: 42, entityTypeId: 1 } } };
    expect(DDBDataUtils.getName(ddb, item)).toBe("My Custom Sword");
  });

  it("ignores custom name when allowCustom is false", () => {
    const ddb = makeDDB({
      character: {
        characterValues: [
          { valueId: 42, valueTypeId: 1, typeId: 8, value: "My Custom Sword" },
        ],
      },
    });
    const item = { id: 42, entityTypeId: 1, definition: { name: "Longsword" },
      flags: { ddbimporter: { dndbeyond: { id: 42, entityTypeId: 1 }, id: 42, entityTypeId: 1 } } };
    expect(DDBDataUtils.getName(ddb, item, null, false)).toBe("Longsword");
  });
});

// =============================================================================
// isComponentIdInClassFeatures
// =============================================================================
describe("DDBDataUtils.isComponentIdInClassFeatures", () => {
  const ddb = makeDDB();

  it("returns true when componentId is in class features for given classId", () => {
    expect(DDBDataUtils.isComponentIdInClassFeatures(ddb, 100, 1)).toBe(true);
  });

  it("returns true for subclass classId match", () => {
    expect(DDBDataUtils.isComponentIdInClassFeatures(ddb, 200, 10)).toBe(true);
  });

  it("returns false when componentId not found", () => {
    expect(DDBDataUtils.isComponentIdInClassFeatures(ddb, 999, 1)).toBe(false);
  });

  it("returns false when classId does not match", () => {
    expect(DDBDataUtils.isComponentIdInClassFeatures(ddb, 100, 999)).toBe(false);
  });
});

// =============================================================================
// getClassFeatureIds
// =============================================================================
describe("DDBDataUtils.getClassFeatureIds", () => {
  const ddb = makeDDB();

  it("returns all feature IDs with no filters", () => {
    const ids = DDBDataUtils.getClassFeatureIds(ddb);
    expect(ids).toContain(100);
    expect(ids).toContain(101);
    expect(ids).toContain(200);
    expect(ids).toHaveLength(3);
  });

  it("filters by classId (definition)", () => {
    const ids = DDBDataUtils.getClassFeatureIds(ddb, { classId: 1 });
    expect(ids).toContain(100);
    expect(ids).toContain(101);
    expect(ids).toContain(200);
  });

  it("filters by classId (subclass)", () => {
    const ids = DDBDataUtils.getClassFeatureIds(ddb, { classId: 10 });
    expect(ids).toContain(100); // same class entry has both
  });

  it("returns empty for non-matching classId", () => {
    const ids = DDBDataUtils.getClassFeatureIds(ddb, { classId: 999 });
    expect(ids).toHaveLength(0);
  });

  it("filters by requiredLevel (>=)", () => {
    const ids = DDBDataUtils.getClassFeatureIds(ddb, { requiredLevel: 2 });
    expect(ids).toContain(100); // level 2
    expect(ids).toContain(200); // level 3
    expect(ids).not.toContain(101); // level 1
  });

  it("filters by exactLevel", () => {
    const ids = DDBDataUtils.getClassFeatureIds(ddb, { exactLevel: 1 });
    expect(ids).toEqual([101]);
  });
});

// =============================================================================
// classIdentifierName
// =============================================================================
describe("DDBDataUtils.classIdentifierName", () => {
  it("removes 'Circle of the' prefix", () => {
    expect(DDBDataUtils.classIdentifierName("Circle of the Moon")).toBe("moon");
  });

  it("removes 'Circle of' prefix", () => {
    expect(DDBDataUtils.classIdentifierName("Circle of Spores")).toBe("spores");
  });

  it("removes 'College of' prefix", () => {
    expect(DDBDataUtils.classIdentifierName("College of Lore")).toBe("lore");
  });

  it("removes 'Path of the' prefix", () => {
    expect(DDBDataUtils.classIdentifierName("Path of the Berserker")).toBe("berserker");
  });

  it("removes 'Oath of the' prefix", () => {
    expect(DDBDataUtils.classIdentifierName("Oath of the Ancients")).toBe("ancients");
  });

  it("removes '-domain' suffix", () => {
    expect(DDBDataUtils.classIdentifierName("Life Domain")).toBe("life");
  });

  it("removes '-sorcery' suffix", () => {
    expect(DDBDataUtils.classIdentifierName("Wild Magic Sorcery")).toBe("wild-magic");
  });

  it("passes simple names through as slugified", () => {
    expect(DDBDataUtils.classIdentifierName("Champion")).toBe("champion");
  });

  it("strips parenthetical before processing", () => {
    const result = DDBDataUtils.classIdentifierName("Thief (Revised)");
    expect(result).toBe("thief");
  });
});

// =============================================================================
// hasClassFeature
// =============================================================================
describe("DDBDataUtils.hasClassFeature", () => {
  const ddb = makeDDB();

  it("returns true when feature exists and level is sufficient", () => {
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Action Surge" })).toBe(true);
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Second Wind" })).toBe(true);
  });

  it("returns false when feature does not exist", () => {
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Nonexistent Feature" })).toBe(false);
  });

  it("filters by className", () => {
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Action Surge", className: "Fighter" })).toBe(true);
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Action Surge", className: "Wizard" })).toBe(false);
  });

  it("filters by subClassName", () => {
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Improved Critical", subClassName: "Champion" })).toBe(true);
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Improved Critical", subClassName: "Battlemaster" })).toBe(false);
  });

  it("respects required level vs character level", () => {
    // Character is level 5, Improved Critical requires level 3 - should be available
    expect(DDBDataUtils.hasClassFeature({ ddbData: ddb, featureName: "Improved Critical" })).toBe(true);

    // Make a level 2 character - Improved Critical (level 3) should NOT be available
    const lowLevelDdb = makeDDB();
    lowLevelDdb.character.classes[0].level = 2;
    expect(DDBDataUtils.hasClassFeature({ ddbData: lowLevelDdb, featureName: "Improved Critical" })).toBe(false);
  });
});

// =============================================================================
// hasSubClass
// =============================================================================
describe("DDBDataUtils.hasSubClass", () => {
  const ddb = makeDDB();

  it("returns true when subclass exists", () => {
    expect(DDBDataUtils.hasSubClass({ ddbData: ddb, subClassName: "Champion" })).toBe(true);
  });

  it("returns false when subclass does not exist", () => {
    expect(DDBDataUtils.hasSubClass({ ddbData: ddb, subClassName: "Battlemaster" })).toBe(false);
  });
});

// =============================================================================
// hasChosenCharacterOption
// =============================================================================
describe("DDBDataUtils.hasChosenCharacterOption", () => {
  it("returns true when option is in class options", () => {
    const ddb = makeDDB({
      character: {
        options: {
          class: [{ definition: { name: "Great Weapon Fighting" } }],
          race: [],
          feat: [],
        },
      },
    });
    expect(DDBDataUtils.hasChosenCharacterOption(ddb, "Great Weapon Fighting")).toBe(true);
  });

  it("returns true when option is in race options", () => {
    const ddb = makeDDB({
      character: {
        options: {
          class: [],
          race: [{ definition: { name: "Darkvision" } }],
          feat: [],
        },
      },
    });
    expect(DDBDataUtils.hasChosenCharacterOption(ddb, "Darkvision")).toBe(true);
  });

  it("returns true when option is in feat options", () => {
    const ddb = makeDDB({
      character: {
        options: {
          class: [],
          race: [],
          feat: [{ definition: { name: "Sharpshooter" } }],
        },
      },
    });
    expect(DDBDataUtils.hasChosenCharacterOption(ddb, "Sharpshooter")).toBe(true);
  });

  it("returns false when option is not present", () => {
    const ddb = makeDDB();
    expect(DDBDataUtils.hasChosenCharacterOption(ddb, "Nonexistent")).toBe(false);
  });
});

// =============================================================================
// getCustomValueFromCharacter
// =============================================================================
describe("DDBDataUtils.getCustomValueFromCharacter", () => {
  it("returns custom value when match found", () => {
    const character = {
      flags: {
        ddbimporter: {
          dndbeyond: {
            characterValues: [
              { valueId: 42, valueTypeId: 1, typeId: 8, value: "Custom Name" },
              { valueId: 42, valueTypeId: 1, typeId: 12, value: "+2" },
            ],
          },
        },
      },
    };
    const item = { id: 42, entityTypeId: 1 };
    expect(DDBDataUtils.getCustomValueFromCharacter(item, character as any, 8)).toBe("Custom Name");
    expect(DDBDataUtils.getCustomValueFromCharacter(item, character as any, 12)).toBe("+2");
  });

  it("returns null when no match", () => {
    const character = {
      flags: { ddbimporter: { dndbeyond: { characterValues: [] } } },
    };
    const item = { id: 42, entityTypeId: 1 };
    expect(DDBDataUtils.getCustomValueFromCharacter(item, character as any, 8)).toBeNull();
  });

  it("returns null when character is null", () => {
    expect(DDBDataUtils.getCustomValueFromCharacter({}, null, 8)).toBeNull();
  });
});
