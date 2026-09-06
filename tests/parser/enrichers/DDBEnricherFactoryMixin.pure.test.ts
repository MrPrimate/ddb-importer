// Characterization tests for the pure parts of DDBEnricherFactoryMixin:
// name-hint resolution, the delegating getters and getFeatureActionsName.

// Heavy companion/summons machinery is irrelevant to the pure surface under test.
vi.mock("../../../src/parser/companions/DDBSummonsManager", () => ({
  default: class {},
}));
vi.mock("../../../src/parser/companions/types/TransformProfiles", () => ({
  resolveTransformProfileUuids: vi.fn(),
}));
vi.mock("../../../src/parser/enrichers/effects/_module", () => ({
  AutoEffects: {},
  EnchantmentEffects: {},
  ChangeHelper: {},
  EffectGenerator: {},
}));
// Break the load cycle mixin -> parser/lib -> DDBClass -> AdvancementHelper ->
// DDBBasicActivity -> enrichers/_module -> DDBGenericEnricher -> mixin (TDZ).
vi.mock("../../../src/parser/advancements/AdvancementHelper", () => ({
  default: class {},
}));
// The enrichers barrel re-exports every concrete enricher, all of which extend
// the mixin under test; loading it mid-cycle hits the TDZ. Stub every name the
// codebase imports from the barrel with an inert class.
vi.mock("../../../src/parser/enrichers/_module", () => ({
  DDBBackgroundEnricher: class {},
  DDBClassFeatureEnricher: class {},
  DDBFeatEnricher: class {},
  DDBGenericEnricher: class {},
  DDBItemEnricher: class {},
  DDBMonsterFeatureEnricher: class {},
  DDBSpeciesTraitEnricher: class {},
  DDBSpellEnricher: class {},
  Effects: {},
  GenericEnrichers: {},
  mixins: {},
}));

import DDBEnricherFactoryMixin from "../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin";

class TestEnricher extends DDBEnricherFactoryMixin<string> {

  ENRICHERS: Record<string, any> = {};

  FALLBACK_ENRICHERS: Record<string, any> = {};

}

class ObjectHintEnricher extends DDBEnricherFactoryMixin<{ hint: string }> {

  ENRICHERS: Record<string, any> = {};

  FALLBACK_ENRICHERS: Record<string, any> = {};

}

function makeEnricher(fields: Record<string, any> = {}): any {
  const enricher: any = new TestEnricher();
  Object.assign(enricher, {
    name: "Test Feature",
    is2014: false,
    is2024: true,
    isCustomAction: false,
  }, fields);
  return enricher;
}

// =============================================================================
// _getNameHint
// =============================================================================
describe("DDBEnricherFactoryMixin._getNameHint", () => {
  it("uses an exact NAME_HINTS entry", () => {
    const e = makeEnricher({ name: "Rage" });
    e.NAME_HINTS = { Rage: "RageHint" };
    e._getNameHint();
    expect(e.hintName).toBe("RageHint");
  });

  it("prefers NAME_HINTS_2014 for 2014 sources", () => {
    const e = makeEnricher({ name: "Rage", is2014: true, is2024: false });
    e.NAME_HINTS_2014 = { Rage: "LegacyRage" };
    e.NAME_HINTS = { Rage: "ModernRage" };
    e._getNameHint();
    expect(e.hintName).toBe("LegacyRage");
  });

  it("ignores NAME_HINTS_2014 for 2024 sources", () => {
    const e = makeEnricher({ name: "Rage", is2014: false });
    e.NAME_HINTS_2014 = { Rage: "LegacyRage" };
    e.NAME_HINTS = { Rage: "ModernRage" };
    e._getNameHint();
    expect(e.hintName).toBe("ModernRage");
  });

  it("falls back from a 2014 miss to NAME_HINTS", () => {
    const e = makeEnricher({ name: "Rage", is2014: true });
    e.NAME_HINTS_2014 = { Frenzy: "Nope" };
    e.NAME_HINTS = { Rage: "ModernRage" };
    e._getNameHint();
    expect(e.hintName).toBe("ModernRage");
  });

  it("matches NAME_HINT_2014_INCLUDES substrings only for 2014 sources", () => {
    const e2014 = makeEnricher({ name: "Form of the Beast: Claws", is2014: true });
    e2014.NAME_HINT_2014_INCLUDES = { "Form of the Beast": "BeastForm" };
    e2014._getNameHint();
    expect(e2014.hintName).toBe("BeastForm");

    const e2024 = makeEnricher({ name: "Form of the Beast: Claws", is2014: false });
    e2024.NAME_HINT_2014_INCLUDES = { "Form of the Beast": "BeastForm" };
    e2024._getNameHint();
    expect(e2024.hintName).toBe("Form of the Beast: Claws");
  });

  it("matches NAME_HINT_INCLUDES substrings", () => {
    const e = makeEnricher({ name: "Maneuver: Trip Attack" });
    e.NAME_HINT_INCLUDES = { Maneuver: "GenericManeuver" };
    e._getNameHint();
    expect(e.hintName).toBe("GenericManeuver");
  });

  it("prefers an exact hint over an includes hint", () => {
    const e = makeEnricher({ name: "Maneuver: Trip Attack" });
    e.NAME_HINTS = { "Maneuver: Trip Attack": "ExactTrip" };
    e.NAME_HINT_INCLUDES = { Maneuver: "GenericManeuver" };
    e._getNameHint();
    expect(e.hintName).toBe("ExactTrip");
  });

  it("defaults hintName to the feature name when nothing matches", () => {
    const e = makeEnricher({ name: "Totally Unknown" });
    e._getNameHint();
    expect(e.hintName).toBe("Totally Unknown");
  });

  it("does nothing for custom actions", () => {
    const e = makeEnricher({ name: "Rage", isCustomAction: true });
    e.NAME_HINTS = { Rage: "RageHint" };
    e._getNameHint();
    expect(e.hintName).toBeNull();
  });

  it("ignores non-string hint values and falls through to the name", () => {
    const e: any = new ObjectHintEnricher();
    Object.assign(e, { name: "Rage", is2014: false, isCustomAction: false });
    e.NAME_HINTS = { Rage: { hint: "objectHint" } };
    e._getNameHint();
    // typeof raw !== "string" so the object hint is skipped by _getNameHint
    expect(e.hintName).toBe("Rage");
  });
});

// =============================================================================
// Delegating getters
// =============================================================================
describe("DDBEnricherFactoryMixin delegating getters", () => {
  const stubValues: Record<string, any> = {
    type: "attack",
    activity: { name: "Stub Activity" },
    effects: [{ name: "Stub Effect" }],
    override: { data: { name: "Override" } },
    additionalActivities: [{ constructor: { data: {} } }],
    additionalAdvancements: [{ type: "ScaleValue" }],
    useDefaultAdditionalActivities: false,
    usesOnActivity: true,
    documentStub: { stopDefaultActivity: true },
    clearAutoEffects: true,
    addAutoAdditionalActivities: false,
    addToDefaultAdditionalActivities: true,
    builtFeaturesFromActionFilters: ["Only This"],
    itemMacro: { type: "feat", name: "macro" },
    setMidiOnUseMacroFlag: { type: "feat", name: "macro", triggerPoints: ["postActiveEffects"] },
    stopDefaultActivity: true,
    parseAllChoiceFeatures: true,
    ddbMacroDescriptionData: { name: "fn", type: "feat" },
    summonsFunction: () => null,
    generateSummons: true,
    noVersatile: true,
    choiceComponentFeatureName: "Choice Name",
    combineGrantedDamageModifiers: true,
    combineDamageTypes: true,
    identifier: "my-identifier",
  };

  it("delegates every getter to the loaded enricher", () => {
    const e = makeEnricher({ loadedEnricher: stubValues });
    for (const [key, value] of Object.entries(stubValues)) {
      expect(e[key], `getter ${key}`).toBe(value);
    }
  });

  it("returns null defaults when no enricher is loaded", () => {
    const e = makeEnricher({ loadedEnricher: null });
    expect(e.type).toBeNull();
    expect(e.activity).toBeNull();
    expect(e.override).toBeNull();
    expect(e.documentStub).toBeNull();
    expect(e.itemMacro).toBeNull();
    expect(e.setMidiOnUseMacroFlag).toBeNull();
    expect(e.ddbMacroDescriptionData).toBeNull();
    expect(e.summonsFunction).toBeNull();
    expect(e.choiceComponentFeatureName).toBeNull();
    expect(e.identifier).toBeNull();
  });

  it("returns empty array defaults when no enricher is loaded", () => {
    const e = makeEnricher({ loadedEnricher: null });
    expect(e.effects).toEqual([]);
    expect(e.additionalActivities).toEqual([]);
    expect(e.additionalAdvancements).toEqual([]);
    expect(e.builtFeaturesFromActionFilters).toEqual([]);
  });

  it("returns boolean defaults when no enricher is loaded", () => {
    const e = makeEnricher({ loadedEnricher: null, ddbParser: { isAction: false } });
    expect(e.usesOnActivity).toBe(false);
    expect(e.clearAutoEffects).toBe(false);
    expect(e.addAutoAdditionalActivities).toBe(true);
    expect(e.addToDefaultAdditionalActivities).toBe(false);
    expect(e.stopDefaultActivity).toBe(false);
    expect(e.parseAllChoiceFeatures).toBe(false);
    expect(e.generateSummons).toBe(false);
    expect(e.noVersatile).toBe(false);
    expect(e.combineGrantedDamageModifiers).toBe(false);
    expect(e.combineDamageTypes).toBe(false);
  });

  it("bases useDefaultAdditionalActivities on isAction when no enricher is loaded", () => {
    const action = makeEnricher({ loadedEnricher: null, ddbParser: { isAction: true } });
    expect(action.useDefaultAdditionalActivities).toBe(false);

    const feature = makeEnricher({ loadedEnricher: null, ddbParser: { isAction: false } });
    expect(feature.useDefaultAdditionalActivities).toBe(true);
  });

  it("coalesces a missing additionalActivities on the loaded enricher to []", () => {
    const e = makeEnricher({ loadedEnricher: { additionalActivities: undefined } });
    expect(e.additionalActivities).toEqual([]);
  });
});

describe("DDBEnricherFactoryMixin.ddbMacroDescription", () => {
  it("returns an empty string without macro description data", () => {
    const e = makeEnricher({ loadedEnricher: null });
    expect(e.ddbMacroDescription).toBe("");
  });

  it("builds the ddbifunc block from name and type", () => {
    const e = makeEnricher({
      loadedEnricher: { ddbMacroDescriptionData: { name: "fontOfMagic", type: "spell" } },
    });
    expect(e.ddbMacroDescription).toBe(
      "<hr><div class=\"ddb-macros-container\"><p>[[/ddbifunc functionName=\"fontOfMagic\" functionType=\"spell\"]]</div></p></div>",
    );
  });

  it("appends parameters and label, with the unclosed functionParams quote", () => {
    // Oddity pinned deliberately: the parameters fragment opens a quote for
    // functionParams but never closes it, and the wrapping </div></p></div>
    // tags are mis-nested relative to the opening <p>.
    const e = makeEnricher({
      loadedEnricher: {
        ddbMacroDescriptionData: { name: "fontOfMagic", type: "spell", parameters: "1,2", label: "Font of Magic" },
      },
    });
    expect(e.ddbMacroDescription).toBe(
      "<hr><div class=\"ddb-macros-container\"><p>[[/ddbifunc functionName=\"fontOfMagic\" functionType=\"spell\" functionParams=\"1,2]]{Font of Magic}</div></p></div>",
    );
  });
});

// =============================================================================
// getFeatureActionsName
// =============================================================================
describe("DDBEnricherFactoryMixin.getFeatureActionsName", () => {
  const FEATURE_ID = 111;
  const FEATURE_ENTITY_TYPE_ID = 222;

  function makeAction(overrides: Record<string, any> = {}): any {
    return {
      id: 1,
      name: "Psionic Power",
      componentId: FEATURE_ID,
      componentTypeId: FEATURE_ENTITY_TYPE_ID,
      ...overrides,
    };
  }

  function makeParser({
    actions = {},
    options = {},
    currentChoice = null,
  }: { actions?: Record<string, any[]>; options?: Record<string, any[]>; currentChoice?: any } = {}): any {
    return {
      ddbDefinition: { name: "Psionic Power", id: FEATURE_ID, entityTypeId: FEATURE_ENTITY_TYPE_ID },
      ddbData: { character: { actions, options } },
      _currentChoice: currentChoice,
    };
  }

  const emptyResults = { all: [], name: [], id: [], options: [], choices: [] };

  it("returns empty results without a parser or definition", () => {
    const e = makeEnricher({ ddbParser: null, enricherType: "class" });
    expect(e.getFeatureActionsName()).toEqual(emptyResults);

    const noDefinition = makeEnricher({ ddbParser: {}, enricherType: "class" });
    expect(noDefinition.getFeatureActionsName()).toEqual(emptyResults);
  });

  it("returns empty results when there are no actions for the derived type", () => {
    const e = makeEnricher({
      ddbParser: makeParser({ actions: { race: [makeAction()] } }),
      enricherType: "class",
    });
    expect(e.getFeatureActionsName()).toEqual(emptyResults);
  });

  it("collects name matches on name, componentId and componentTypeId", () => {
    const match = makeAction({ id: 1 });
    const wrongComponent = makeAction({ id: 2, componentId: 999 });
    const e = makeEnricher({
      ddbParser: makeParser({ actions: { class: [match, wrongComponent] } }),
      enricherType: "class",
    });
    const results = e.getFeatureActionsName();
    expect(results.name).toEqual([match]);
    expect(results.id).toEqual([]);
    expect(results.all).toEqual([match]);
  });

  it("collects id matches for differently named actions of the same component", () => {
    const nameMatch = makeAction({ id: 1 });
    const idMatch = makeAction({ id: 2, name: "Psionic Strike" });
    const e = makeEnricher({
      ddbParser: makeParser({ actions: { class: [nameMatch, idMatch] } }),
      enricherType: "class",
    });
    const results = e.getFeatureActionsName();
    expect(results.name).toEqual([nameMatch]);
    expect(results.id).toEqual([idMatch]);
    expect(results.all).toEqual([nameMatch, idMatch]);
  });

  it("collects option matches through the options lookup", () => {
    const optionAction = makeAction({
      id: 3,
      name: "Option Action",
      componentId: 555,
      componentTypeId: 666,
      flags: { ddbimporter: { componentId: 555, componentTypeId: 666 } },
    });
    const option = {
      definition: { id: 555, entityTypeId: 666 },
      componentId: FEATURE_ID,
      componentTypeId: FEATURE_ENTITY_TYPE_ID,
    };
    const e = makeEnricher({
      ddbParser: makeParser({
        actions: { class: [optionAction] },
        options: { class: [option] },
      }),
      enricherType: "class",
    });
    const results = e.getFeatureActionsName();
    expect(results.options).toEqual([optionAction]);
    expect(results.name).toEqual([]);
    expect(results.id).toEqual([]);
    expect(results.all).toEqual([optionAction]);
  });

  it("restricts option matches to the current choice option id", () => {
    const optionAction = makeAction({
      id: 3,
      name: "Option Action",
      componentId: 555,
      componentTypeId: 666,
      flags: { ddbimporter: { componentId: 555, componentTypeId: 666 } },
    });
    const option = {
      definition: { id: 555, entityTypeId: 666 },
      componentId: FEATURE_ID,
      componentTypeId: FEATURE_ENTITY_TYPE_ID,
    };

    const matching = makeEnricher({
      ddbParser: makeParser({
        actions: { class: [optionAction] },
        options: { class: [option] },
        currentChoice: { id: 555 },
      }),
      enricherType: "class",
    });
    expect(matching.getFeatureActionsName().options).toEqual([optionAction]);

    const nonMatching = makeEnricher({
      ddbParser: makeParser({
        actions: { class: [optionAction] },
        options: { class: [option] },
        currentChoice: { id: 777 },
      }),
      enricherType: "class",
    });
    expect(nonMatching.getFeatureActionsName().options).toEqual([]);
  });

  it("derives the action type from the type argument over enricherType", () => {
    const match = makeAction();
    const e = makeEnricher({
      ddbParser: makeParser({ actions: { feat: [match] } }),
      enricherType: "class",
    });
    expect(e.getFeatureActionsName().all).toEqual([]);
    expect(e.getFeatureActionsName({ type: "feat" }).all).toEqual([match]);
  });

  it("prefers ddbActionType over enricherType when no type argument is given", () => {
    const match = makeAction();
    const e = makeEnricher({
      ddbParser: makeParser({ actions: { race: [match] } }),
      enricherType: "class",
      ddbActionType: "race",
    });
    expect(e.getFeatureActionsName().all).toEqual([match]);
  });

  it("skips choice matching entirely without a ddbFeature", () => {
    const match = makeAction();
    const e = makeEnricher({
      ddbParser: makeParser({ actions: { class: [match] } }),
      enricherType: "class",
    });
    expect(e.getFeatureActionsName().choices).toEqual([]);
  });
});

// =============================================================================
// _addDefaultActionMatchedActivities
// =============================================================================
describe("DDBEnricherFactoryMixin._addDefaultActionMatchedActivities", () => {
  function makeFeature(name: string, activityId: string): any {
    return {
      name,
      type: "feat",
      effects: [],
      flags: { ddbimporter: { originalName: name } },
      system: {
        activities: {
          [activityId]: { _id: activityId, type: "attack", name: "" },
        },
      },
    };
  }

  function makeActivityEnricher(fields: Record<string, any> = {}): any {
    const e = makeEnricher(fields);
    // `data` is an accessor over ddbParser?.data ?? document; back it with document
    e.document = {
      type: "feat",
      effects: [],
      flags: {},
      system: { activities: {} },
    };
    e.defaultActionFeatures = {};
    return e;
  }

  it("copies feature activities onto the data with new unique keys", () => {
    const e = makeActivityEnricher();
    e.defaultActionFeatures = {
      "Predatory Strike": [makeFeature("Predatory Strike (STR)", "abcdefghijklm001")],
    };
    e._addDefaultActionMatchedActivities();
    const keys = Object.keys(e.data.system.activities);
    expect(keys).toEqual(["abcdefghijklmNe0"]);
    expect(e.data.system.activities.abcdefghijklmNe0._id).toBe("abcdefghijklmNe0");
    expect(e.data.system.activities.abcdefghijklmNe0.name).toBe("Predatory Strike (STR)");
  });

  it("does not hang when the generated key collides with an existing activity", () => {
    // Previously the collision check was evaluated once outside the while loop
    // and the loop body assigned a constant, so any collision hung the import.
    const e = makeActivityEnricher();
    e.data.system.activities.abcdefghijklmNe0 = { _id: "abcdefghijklmNe0", type: "attack", name: "Existing" };
    e.defaultActionFeatures = {
      "Predatory Strike": [
        makeFeature("Predatory Strike (STR)", "abcdefghijklm001"),
        makeFeature("Predatory Strike (DEX)", "abcdefghijklm002"),
      ],
    };
    e._addDefaultActionMatchedActivities();
    const keys = Object.keys(e.data.system.activities);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
    expect(e.data.system.activities.abcdefghijklmNe0.name).toBe("Existing");
    for (const key of keys) {
      expect(key).toHaveLength(16);
    }
  });

  it("keeps 16 character ids when the collision suffix reaches double digits", () => {
    const e = makeActivityEnricher();
    for (let n = 0; n < 10; n++) {
      const key = `abcdefghijklmNe${n}`;
      e.data.system.activities[key] = { _id: key, type: "attack", name: `Existing ${n}` };
    }
    e.defaultActionFeatures = {
      "Predatory Strike": [makeFeature("Predatory Strike (STR)", "abcdefghijklm001")],
    };
    e._addDefaultActionMatchedActivities();
    const added = Object.keys(e.data.system.activities).filter((k) => !k.match(/Ne\d$/));
    expect(added).toEqual(["abcdefghijklNe10"]);
    expect(added[0]).toHaveLength(16);
  });
});
