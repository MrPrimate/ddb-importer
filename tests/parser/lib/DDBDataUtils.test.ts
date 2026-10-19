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
// getScaleValueString
// =============================================================================

describe("DDBDataUtils.getScaleValueString", () => {
  const scales = [{ level: 1, fixedValue: 1, dice: null }, { level: 5, fixedValue: 2, dice: null }];

  // Class features arrive as { definition, levelScale } with no componentId; only actions
  // carry one. The wrapper is itself the scale source.
  it("resolves a class feature wrapper without a componentId", () => {
    const ddb = makeDDB({ classOptions: [] });
    const feature: any = {
      definition: { id: 100, name: "Action Surge", classId: 1, levelScales: scales },
      levelScale: scales[1],
    };
    expect(DDBDataUtils.getScaleValueString(ddb, feature)).toEqual({
      name: "Action Surge",
      value: "@scale.fighter.action-surge",
      rollable: true,
      dice: false,
      current: 2,
    });
  });

  it("resolves a wrapper whose current level has no scale row", () => {
    const ddb = makeDDB({ classOptions: [] });
    const feature: any = {
      definition: { id: 100, name: "Action Surge", classId: 1, levelScales: [{ level: 17, fixedValue: 2, dice: null }] },
      levelScale: null,
    };
    expect(DDBDataUtils.getScaleValueString(ddb, feature).value).toBe("@scale.fighter.action-surge");
  });

  it("follows an action's componentId to its class feature", () => {
    const ddb = makeDDB({ classOptions: [] });
    ddb.character.classes[0].classFeatures[0].definition.classId = 1;
    ddb.character.classes[0].classFeatures[0].definition.levelScales = scales;
    const action: any = { name: "Action Surge", componentId: 100, componentTypeId: 1 };
    expect(DDBDataUtils.getScaleValueString(ddb, action).value).toBe("@scale.fighter.action-surge");
  });

  // optional class features (Quickened Healing, Favored Foe) are parsed from their bare
  // ddb.classOptions definition: levelScales, but no { definition } wrapper and no componentId
  it("resolves a bare optional class feature definition that carries levelScales", () => {
    const ddb = makeDDB({ classOptions: [] });
    const option: any = { id: 3035739, name: "Favored Foe", classId: 1, levelScales: scales };
    expect(DDBDataUtils.getScaleValueString(ddb, option)).toEqual({
      name: "Favored Foe",
      value: "@scale.fighter.favored-foe",
      rollable: true,
      dice: false,
      current: null,
    });
  });

  it("returns no value when nothing resolves", () => {
    const ddb = makeDDB({ classOptions: [] });
    const action: any = { name: "Orphan", componentId: 99999, componentTypeId: 1 };
    expect(DDBDataUtils.getScaleValueString(ddb, action)).toEqual({ name: undefined, value: undefined, rollable: false, dice: false, current: null });
  });

  // Way of the Aether's Spectral Guide: description-only rows build a string scale ("CR 1/2"),
  // which cannot be used as a damage formula
  it("marks a description-only scale as not rollable", () => {
    const ddb = makeDDB({ classOptions: [] });
    const descriptionScales = [
      { level: 6, description: "CR 1/2", fixedValue: null, dice: { diceCount: null, diceValue: null, fixedValue: null, diceString: null } },
      { level: 17, description: "CR 4", fixedValue: null, dice: null },
    ];
    const feature: any = {
      definition: { id: 100, name: "Spectral Guide", classId: 1, levelScales: descriptionScales },
      levelScale: descriptionScales[1],
    };
    expect(DDBDataUtils.getScaleValueString(ddb, feature)).toEqual({
      name: "Spectral Guide",
      value: "@scale.fighter.spectral-guide",
      rollable: false,
      dice: true,
      current: null,
    });
  });

  it("marks a dice scale as rollable", () => {
    const ddb = makeDDB({ classOptions: [] });
    const diceScales = [{ level: 3, fixedValue: null, dice: { diceCount: 1, diceValue: 6, fixedValue: null, diceString: "1d6" } }];
    const feature: any = {
      definition: { id: 100, name: "Spirit Strike", classId: 1, levelScales: diceScales },
      levelScale: diceScales[0],
    };
    expect(DDBDataUtils.getScaleValueString(ddb, feature).rollable).toBe(true);
    expect(DDBDataUtils.getScaleValueString(ddb, feature).dice).toBe(true);
  });

  // a count scale (maneuvers known) is rollable as a number but is not dice, so an action under
  // the feature keeps its own damage dice
  it("marks a number-only scale as not dice", () => {
    const ddb = makeDDB({ classOptions: [] });
    const feature: any = {
      definition: { id: 100, name: "Action Surge", classId: 1, levelScales: scales },
      levelScale: scales[1],
    };
    const result = DDBDataUtils.getScaleValueString(ddb, feature);
    expect(result.rollable).toBe(true);
    expect(result.dice).toBe(false);
  });
});

// =============================================================================
// isModifierFromNamedFeature
// =============================================================================
describe("DDBDataUtils.isModifierFromNamedFeature", () => {
  // ids and entity type ids taken from real cleric payloads
  const CLASS_FEATURE_TYPE_ID = 12168134;
  const OPTION_TYPE_ID = 258900837;

  function makeMod(componentId: number, componentTypeId: number): any {
    return {
      type: "bonus",
      subType: "cleric-cantrip-damage",
      restriction: "",
      componentId,
      componentTypeId,
    };
  }

  // 2014: Potent Spellcasting is a subclass class feature
  function makeClassFeatureDDB() {
    return makeDDB({
      character: {
        classes: [
          {
            definition: { id: 1, name: "Cleric", classFeatures: [] },
            classFeatures: [
              { definition: { id: 140, name: "Potent Spellcasting", entityTypeId: CLASS_FEATURE_TYPE_ID, requiredLevel: 8 } },
              { definition: { id: 141, name: "Divine Strike", entityTypeId: CLASS_FEATURE_TYPE_ID, requiredLevel: 8 } },
            ],
            level: 8,
          },
        ],
        options: { class: [], race: [], feat: [] },
      },
      classOptions: [],
    });
  }

  // 2024: Potent Spellcasting is a chosen option of the Blessed Strikes feature
  function makeOptionDDB() {
    return makeDDB({
      character: {
        classes: [
          {
            definition: { id: 1, name: "Cleric", classFeatures: [] },
            classFeatures: [
              { definition: { id: 10292211, name: "Blessed Strikes", entityTypeId: CLASS_FEATURE_TYPE_ID, requiredLevel: 7 } },
            ],
            level: 7,
          },
        ],
        options: {
          class: [
            {
              componentId: 10292211,
              componentTypeId: CLASS_FEATURE_TYPE_ID,
              definition: { id: 4496847, name: "Potent Spellcasting", entityTypeId: OPTION_TYPE_ID },
            },
          ],
          race: [],
          feat: [],
        },
      },
      classOptions: [],
    });
  }

  it("matches a class feature on id, entityTypeId and name", () => {
    const ddb = makeClassFeatureDDB();
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(140, CLASS_FEATURE_TYPE_ID), "Potent Spellcasting")).toBe(true);
  });

  it("does not match a differently named class feature", () => {
    const ddb = makeClassFeatureDDB();
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(141, CLASS_FEATURE_TYPE_ID), "Potent Spellcasting")).toBe(false);
  });

  it("does not match when the componentTypeId differs", () => {
    const ddb = makeClassFeatureDDB();
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(140, OPTION_TYPE_ID), "Potent Spellcasting")).toBe(false);
  });

  it("matches a class option on its own definition id", () => {
    const ddb = makeOptionDDB();
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(4496847, OPTION_TYPE_ID), "Potent Spellcasting")).toBe(true);
  });

  it("matches a class option on its parent componentId", () => {
    const ddb = makeOptionDDB();
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(10292211, CLASS_FEATURE_TYPE_ID), "Potent Spellcasting")).toBe(true);
  });

  it("does not match a class option on a mixed id and type id pair", () => {
    const ddb = makeOptionDDB();
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(4496847, CLASS_FEATURE_TYPE_ID), "Potent Spellcasting")).toBe(false);
  });

  it("matches an optional class feature definition in classOptions", () => {
    const ddb = makeDDB({
      character: {
        classes: [{ definition: { id: 1, name: "Cleric", classFeatures: [] }, classFeatures: [], level: 8 }],
        options: { class: [], race: [], feat: [] },
      },
      classOptions: [
        { id: 4496847, classId: 1, entityTypeId: OPTION_TYPE_ID, name: "Potent Spellcasting", levelScales: [], limitedUse: [] },
      ],
    });
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(4496847, OPTION_TYPE_ID), "Potent Spellcasting")).toBe(true);
  });

  it("returns false when options.class and classOptions are missing", () => {
    const ddb = makeDDB({
      character: {
        classes: [{ definition: { id: 1, name: "Cleric", classFeatures: [] }, classFeatures: [], level: 8 }],
        options: { race: [], feat: [] },
      },
    });
    delete ddb.classOptions;
    expect(DDBDataUtils.isModifierFromNamedFeature(ddb, makeMod(4496847, OPTION_TYPE_ID), "Potent Spellcasting")).toBe(false);
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
// hasCharacterFeat
// =============================================================================
describe("DDBDataUtils.hasCharacterFeat", () => {
  // 2024 Fighting Style choices are feats, and DDB leaves character.options empty for them
  it("finds a 2024 Fighting Style feat that hasChosenCharacterOption misses", () => {
    const ddb = makeDDB({
      character: {
        feats: [{ definition: { name: "Great Weapon Fighting" } }],
        options: { class: [], race: [], feat: [] },
      },
    });
    expect(DDBDataUtils.hasCharacterFeat(ddb, "Great Weapon Fighting")).toBe(true);
    expect(DDBDataUtils.hasChosenCharacterOption(ddb, "Great Weapon Fighting")).toBe(false);
  });

  it("returns false when the feat is not present", () => {
    expect(DDBDataUtils.hasCharacterFeat(makeDDB(), "Great Weapon Fighting")).toBe(false);
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

describe("DDBDataUtils.getLimitedUses ability-modifier floors", () => {
  const wisdomUses = (extra: Record<string, unknown> = {}): any => ({
    resetType: 2, maxUses: 0, statModifierUsesId: 5, operator: 1, useProficiencyBonus: false, numberUsed: 0, ...extra,
  });

  it("floors the modifier at one when the text says minimum of once", () => {
    const uses = DDBDataUtils.getLimitedUses({
      data: wisdomUses(),
      description: "<p>You can use this feature a number of times equal to your Wisdom modifier (minimum of once).</p>",
    });
    expect(uses?.max).toBe("max(1, @abilities.wis.mod)");
  });

  it("floors a multiplied modifier and the (minimum 1) wording", () => {
    const uses = DDBDataUtils.getLimitedUses({
      data: wisdomUses({ maxUses: 1, operator: 2 }),
      description: "Uses equal to your Wisdom modifier (minimum 1).",
    });
    expect(uses?.max).toBe("max(1, 1 * @abilities.wis.mod)");
  });

  it("leaves the bare modifier when the text sets no minimum", () => {
    const uses = DDBDataUtils.getLimitedUses({
      data: wisdomUses(),
      description: "You can use this feature a number of times equal to your Wisdom modifier.",
    });
    expect(uses?.max).toBe("@abilities.wis.mod");
  });

  it("does not floor proficiency-bonus uses", () => {
    const uses = DDBDataUtils.getLimitedUses({
      data: { resetType: 2, maxUses: 0, statModifierUsesId: null, useProficiencyBonus: true, proficiencyBonusOperator: 1, numberUsed: 0 } as any,
      description: "a number of times equal to your proficiency bonus (minimum of once)",
    });
    expect(uses?.max).toBe("@prof");
  });
});

// =============================================================================
// knownColumnIsPrepared
// =============================================================================
describe("DDBDataUtils.knownColumnIsPrepared", () => {
  // DDB's shapes: a 2024 Paladin sends its Prepared Spells column as levelSpellKnownMaxes, a 2024
  // Wizard sends levelPreparedSpellMaxes, a 2014 Paladin sends a column of nulls
  const KNOWN = [0, 2, 3, 4, 5, 6];
  const PREPARED = [0, 4, 5, 6, 7, 9];

  it("is true for a 2024 class whose only column is the known column", () => {
    expect(DDBDataUtils.knownColumnIsPrepared({ levelSpellKnownMaxes: KNOWN, levelPreparedSpellMaxes: [] } as any, false)).toBe(true);
  });

  it("is false when DDB sends prepared maximums", () => {
    expect(DDBDataUtils.knownColumnIsPrepared({ levelSpellKnownMaxes: [], levelPreparedSpellMaxes: PREPARED } as any, false)).toBe(false);
  });

  it("is false for 2014 classes, whose known casters really know their spells", () => {
    expect(DDBDataUtils.knownColumnIsPrepared({ levelSpellKnownMaxes: KNOWN, levelPreparedSpellMaxes: [0, null, null] } as any, true)).toBe(false);
  });

  it("is false without spell rules or columns", () => {
    expect(DDBDataUtils.knownColumnIsPrepared(null, false)).toBe(false);
    expect(DDBDataUtils.knownColumnIsPrepared({ levelSpellKnownMaxes: [], levelPreparedSpellMaxes: [] } as any, false)).toBe(false);
  });
});

describe("DDBDataUtils.getChoices", () => {
  function makeChoiceDDB(optionIds: number[]): any {
    const ddb = makeDDB();
    return makeDDB({
      character: {
        ...ddb.character,
        choices: {
          class: [
            {
              id: "choice-1",
              componentId: 100,
              componentTypeId: 12168134,
              parentChoiceId: null,
              type: 2,
              subType: 1,
              optionValue: 502,
              optionIds,
            },
          ],
          race: [],
          feat: [],
          choiceDefinitions: [
            {
              id: "12168134-2",
              options: [
                { id: 501, label: "Option A", description: null },
                { id: 502, label: "Option B", description: null },
              ],
            },
          ],
        },
      },
    });
  }

  const feat: any = { definition: { id: 100 } };

  it("returns the selected option", () => {
    const result = DDBDataUtils.getChoices({
      ddb: makeChoiceDDB([501, 502]),
      type: "class",
      feat,
    });
    expect(result.map((r) => r.label)).toEqual(["Option B"]);
    expect(result[0].choiceId).toBe("choice-1");
  });

  it("skips a selection whose optionValue is excluded by optionIds instead of throwing", () => {
    expect(() => DDBDataUtils.getChoices({
      ddb: makeChoiceDDB([501]),
      type: "class",
      feat,
    })).not.toThrow();
  });
});

describe("DDBDataUtils.getChoices", () => {
  function makeChoiceDDB(optionIds: number[]): any {
    const ddb = makeDDB();
    return makeDDB({
      character: {
        ...ddb.character,
        choices: {
          class: [
            {
              id: "choice-1",
              componentId: 100,
              componentTypeId: 12168134,
              parentChoiceId: null,
              type: 2,
              subType: 1,
              optionValue: 502,
              optionIds,
            },
          ],
          race: [],
          feat: [],
          choiceDefinitions: [
            {
              id: "12168134-2",
              options: [
                { id: 501, label: "Option A", description: null },
                { id: 502, label: "Option B", description: null },
              ],
            },
          ],
        },
      },
    });
  }

  const feat: any = { definition: { id: 100 } };

  it("returns the selected option", () => {
    const result = DDBDataUtils.getChoices({
      ddb: makeChoiceDDB([501, 502]),
      type: "class",
      feat,
    });
    expect(result.map((r) => r.label)).toEqual(["Option B"]);
    expect(result[0].choiceId).toBe("choice-1");
  });

  it("skips a selection whose optionValue is excluded by optionIds instead of throwing", () => {
    expect(() => DDBDataUtils.getChoices({
      ddb: makeChoiceDDB([501]),
      type: "class",
      feat,
    })).not.toThrow();
  });
});

describe("DDBDataUtils.getDescriptionLimitedUses", () => {
  const limit = (text: string) => DDBDataUtils.getDescriptionLimitedUses(`<p>${text}</p>`);

  it.each([
    ["Once you use this feature, you can&rsquo;t use it again until you finish a Long Rest.", "lr"],
    ["After you do so, you can't do so again until you finish a Short or Long Rest.", "sr"],
    ["Once you've lit the beacon, you can't do so again until you finish a short rest.", "sr"],
    ["When you use this benefit, you cannot use it again until you finish a long rest.", "lr"],
    ["The ground shakes. You can't use this feature again until you finish a Long Rest.", "lr"],
    ["Once you swap a tongue in this way, you must finish a long rest before you can do so again.", "lr"],
    ["Once you use this trait, you can't do so again until you finish a [rules]Long Rest[/rules].", "lr"],
  ])("reads one use per rest from %s", (text, period) => {
    expect(limit(text)).toEqual({ spent: 0, max: "1", recovery: [{ period, type: "recoverAll", formula: undefined }] });
  });

  it.each([
    ["a limit on a cast", "Once you cast the spell with this feature, you can't do so again until you finish a Long Rest."],
    ["a cast in the sentence before", "You can cast the chosen spell once without a slot. You must finish a long rest before you can do so again."],
    ["a limit per target", "On a success, you can't use this feature on that creature again until you finish a long rest."],
    ["a limit on one benefit", "Once you use one of these benefits, you can't use that benefit again until you finish a long rest."],
    ["a limit on one thing the feature does", "You can regain one die, but you can't do so again until you finish a long rest."],
    ["a rate", "Once per turn, you can add the bonus to one damage roll."],
    ["benefits limited separately", "Once you use this feature, you can't use it again until you finish a Short Rest. You can also cast the spell a number of times equal to your Proficiency Bonus."],
  ])("ignores %s", (_label, text) => {
    expect(limit(text)).toBeNull();
  });
});

describe("DDBDataUtils.getDescriptionSlotAlternative", () => {
  const slot = (text: string) => DDBDataUtils.getDescriptionSlotAlternative(`<p>${text}</p>`);

  it.each([
    ["you can't use it again until you finish a Long Rest unless you expend a spell slot to use it again.", 1],
    ["you can't do so again until you finish a Long Rest, unless you expend a 4th-level spell slot.", 4],
    ["you can't use it again until you finish a Long Rest unless you expend a spell slot of level 3 or higher.", 3],
    ["you can't do so again until you finish a long rest, unless you expend a spell slot of 5th level or higher.", 5],
    ["you can't use it again until you finish a Long Rest unless you expend a level 2+ spell slot.", 2],
  ])("reads the lowest slot level from %s", (text, level) => {
    expect(slot(text)).toEqual({ level, restore: false });
  });

  it.each([
    ["You can also restore your use of it by expending a level 5 spell slot (no action required).", 5],
    ["You can also restore your use of this feature by expending a level 3+ spell slot (no action required).", 3],
  ])("reads the 2024 restore sentence %s", (text, level) => {
    expect(slot(text)).toEqual({ level, restore: true });
  });

  it("reads a slot that restores the use", () => {
    expect(slot("you can't use it again until you finish a Long Rest unless you expend a level 5 spell slot (no action required) to restore your use of it."))
      .toEqual({ level: 5, restore: true });
  });

  it("ignores other alternative costs", () => {
    expect(slot("you can't use it again until you finish a Long Rest unless you expend two uses of your Rage.")).toBeNull();
  });
});

describe("DDBDataUtils.getDescriptionRestoreAlternative", () => {
  const restore = (text: string) => DDBDataUtils.getDescriptionRestoreAlternative(`<p>${text}</p>`);

  it("reads uses of another feature", () => {
    expect(restore("you can't use it again until you finish a Long Rest unless you expend two uses of your Rage (no action required) to restore your use of it."))
      .toEqual({ resource: "Rage", count: 2 });
  });

  it("reads levels of Exhaustion", () => {
    expect(restore("you can't use it again until you finish a Long Rest unless you gain 1 Exhaustion level (no action required by you) to restore your use of it."))
      .toEqual({ resource: null, count: 1 });
  });

  it.each([
    ["You can also restore your use of it by expending one use of your Rage (no action required).", "Rage", 1],
    ["You can also restore your use of it by expending one use of your Bardic Inspiration dice (no action required).", "Bardic Inspiration", 1],
    ["You can also restore your use of this feature by expending a use of your Second Wind (no action required).", "Second Wind", 1],
  ])("reads the 2024 restore sentence %s", (text, resource, count) => {
    expect(restore(text)).toEqual({ resource, count });
  });

  it("leaves point pools to enrichers", () => {
    expect(restore("You can also restore your use of it by expending 4 Focus Points (no action required).")).toBeNull();
  });

  it("ignores spell slot alternatives", () => {
    expect(restore("you can't use it again until you finish a Long Rest unless you expend a spell slot to use it again.")).toBeNull();
  });
});
