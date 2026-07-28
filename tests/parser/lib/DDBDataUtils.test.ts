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
    const item: any = { definition: { name: "Longsword" } };
    expect(DDBDataUtils.getName(ddb, item)).toBe("Longsword");
  });

  it("returns item.name when no definition", () => {
    const ddb = makeDDB();
    const item: any = { name: "Shield" };
    expect(DDBDataUtils.getName(ddb, item)).toBe("Shield");
  });

  it("decodes HTML entities via nameString", () => {
    const ddb = makeDDB();
    const item: any = { definition: { name: "Fire &amp; Ice" } };
    expect(DDBDataUtils.getName(ddb, item)).toBe("Fire & Ice");
  });

  it("uses custom name from characterValues when present", () => {
    const ddb = makeDDB();
    const character: any = {
      flags: { ddbimporter: { dndbeyond: { characterValues: [
        { valueId: 42, valueTypeId: 1, typeId: 8, value: "My Custom Sword" },
      ] } } },
    };
    const item: any = { id: 42, entityTypeId: 1, definition: { name: "Longsword" } };
    expect(DDBDataUtils.getName(ddb, item, character)).toBe("My Custom Sword");
  });

  it("ignores custom name when allowCustom is false", () => {
    const ddb = makeDDB();
    const character: any = {
      flags: { ddbimporter: { dndbeyond: { characterValues: [
        { valueId: 42, valueTypeId: 1, typeId: 8, value: "My Custom Sword" },
      ] } } },
    };
    const item: any = { id: 42, entityTypeId: 1, definition: { name: "Longsword" } };
    expect(DDBDataUtils.getName(ddb, item, character, false)).toBe("Longsword");
  });

  // DDB stores a renamed action against the action entity, but the document is built
  // from the parent trait/feature definition, which has a different id/entityTypeId
  describe("custom name set on a linked action", () => {
    // Dhampir: "Vampiric Bite" trait, "Fanged Bite" action
    const TRAIT = { id: 16553775, entityTypeId: 1960452172, name: "Vampiric Bite" };
    const ACTION = {
      id: 12052877,
      entityTypeId: 222216831,
      name: "Fanged Bite",
      componentId: TRAIT.id,
      componentTypeId: TRAIT.entityTypeId,
    };

    function makeCharacter(characterValues: any[]): any {
      return { flags: { ddbimporter: { dndbeyond: { characterValues } } } };
    }

    function makeActionDDB(actions: any[]): any {
      return makeDDB({ character: { actions: { race: actions, class: [], feat: [], item: [], background: [] } } });
    }

    it("uses the custom name from the linked action", () => {
      const ddb = makeActionDDB([ACTION]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character)).toBe("Draining Strike");
    });

    it("ignores the linked action custom name when allowCustom is false", () => {
      const ddb = makeActionDDB([ACTION]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character, false)).toBe("Vampiric Bite");
    });

    it("skips the linked action lookup when a feature has more than one action", () => {
      const ddb = makeActionDDB([
        ACTION,
        { ...ACTION, id: 12052878, name: "Fanged Bite (2)" },
      ]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character)).toBe("Vampiric Bite");
    });

    it("prefers a custom name set directly on the entity", () => {
      const ddb = makeActionDDB([ACTION]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
        { valueId: "16553775", valueTypeId: "1960452172", typeId: 8, value: "Blood Drinker" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character)).toBe("Blood Drinker");
    });

    it("returns the raw name when the linked action has no custom name", () => {
      const ddb = makeActionDDB([ACTION]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 12, value: "2" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character)).toBe("Vampiric Bite");
    });

    it("skips null actions and null action groups", () => {
      const ddb = makeDDB({ character: { actions: { race: [null, ACTION], class: null, feat: [], item: [], background: [] } } });
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character)).toBe("Draining Strike");
    });

    it("does not match actions with a null componentId when the item has no id", () => {
      const ddb = makeActionDDB([{ ...ACTION, componentId: null, componentTypeId: null }]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
      ]);
      const item: any = { name: "Some Feature" };
      expect(DDBDataUtils.getName(ddb, item, character)).toBe("Some Feature");
    });

    it("does not match an unrelated action", () => {
      const ddb = makeActionDDB([{ ...ACTION, componentId: 999, componentTypeId: 888 }]);
      const character = makeCharacter([
        { valueId: "12052877", valueTypeId: "222216831", typeId: 8, value: "Draining Strike" },
      ]);
      expect(DDBDataUtils.getName(ddb, TRAIT as any, character)).toBe("Vampiric Bite");
    });
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
// findComponentByComponentId
// =============================================================================
describe("DDBDataUtils.findComponentByComponentId", () => {
  const optionScales: any[] = [
    { id: 1, level: 1, description: "", dice: null, fixedValue: 1 },
    { id: 2, level: 5, description: "", dice: null, fixedValue: 2 },
    { id: 3, level: 9, description: "", dice: null, fixedValue: 3 },
  ];

  function makeOptionalDDB() {
    return makeDDB({
      classOptions: [
        { id: 500, classId: 1, name: "Optional Feature", levelScales: optionScales, limitedUse: [] },
        { id: 501, classId: 1, name: "No Scale Option", levelScales: [], limitedUse: [] },
      ],
    });
  }

  it("returns the real IDDBClassFeature wrapper for a class feature id", () => {
    const ddb = makeDDB({ classOptions: [] });
    const result: any = DDBDataUtils.findComponentByComponentId(ddb, 100);
    expect(result?.definition?.id).toBe(100);
    expect(result?.definition?.name).toBe("Action Surge");
  });

  it("wraps an optional class feature in a synthetic { definition, levelScale }", () => {
    const ddb = makeOptionalDDB();
    const result: any = DDBDataUtils.findComponentByComponentId(ddb, 500);
    // definition is the classOptions element itself (same reference)
    expect(result.definition).toBe(ddb.classOptions[0]);
    // levelScale is the highest scale at/below the owning class level (5)
    expect(result.levelScale.level).toBe(5);
    expect(result.levelScale.fixedValue).toBe(2);
  });

  it("does NOT mutate the shared classOptions element", () => {
    const ddb = makeOptionalDDB();
    DDBDataUtils.findComponentByComponentId(ddb, 500);
    expect("levelScale" in ddb.classOptions[0]).toBe(false);
  });

  it("returns null levelScale for an optional feature with no scales", () => {
    const ddb = makeOptionalDDB();
    const result: any = DDBDataUtils.findComponentByComponentId(ddb, 501);
    expect(result.definition).toBe(ddb.classOptions[1]);
    expect(result.levelScale).toBeNull();
  });

  it("returns undefined for an unknown component id", () => {
    const ddb = makeDDB({ classOptions: [] });
    expect(DDBDataUtils.findComponentByComponentId(ddb, 99999)).toBeUndefined();
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
    const item: any = { id: 42, entityTypeId: 1 };
    expect(DDBDataUtils.getCustomValueFromCharacter(item, character as any, 8)).toBe("Custom Name");
    expect(DDBDataUtils.getCustomValueFromCharacter(item, character as any, 12)).toBe("+2");
  });

  it("returns null when no match", () => {
    const character = {
      flags: { ddbimporter: { dndbeyond: { characterValues: [] as any[] } } },
    };
    const item: any = { id: 42, entityTypeId: 1 };
    expect(DDBDataUtils.getCustomValueFromCharacter(item, character as any, 8)).toBeNull();
  });

  it("returns null when character is null", () => {
    // getCustomValueFromCharacter guards `if (!character) return null;` but its
    // signature does not admit null, so cast to exercise that runtime guard
    expect(DDBDataUtils.getCustomValueFromCharacter({} as any, null as unknown as I5ePCData, 8)).toBeNull();
  });
});
