// @vitest-environment jsdom
// Characterization tests for AdvancementHelper instance-level advancement
// builders, using the fake dnd5e advancement classes from the global test mocks.
//
// Intentionally uncovered (compendium/async spell-advancement methods):
//   getCompendiumSpellUuidsFromNames, _getSpellUuidsFromFeatureSpellData,
//   getTraitSpellAdvancements, getCantripChoiceAdvancement,
//   getCantripGrantAdvancement, getSpellChoiceAdvancement,
//   getSpellGrantAdvancement, addSpellAdvancement.

// AdvancementHelper imports the activities barrel (for DDBBasicActivity, only used
// by the async spell advancement path we do not test); stub it to avoid pulling in
// the entire enricher tree.
vi.mock("../../../src/parser/activities/_module", () => ({ DDBBasicActivity: class DDBBasicActivity {} }));
// DDBClass/DDBSubClass have static initializers that read AdvancementHelper before
// the circular import (AdvancementHelper -> parser/lib -> DDBDataUtils -> DDBClass)
// resolves; stub them to break the cycle.
vi.mock("../../../src/parser/classes/DDBClass", () => ({ default: class DDBClass {} }));
vi.mock("../../../src/parser/classes/DDBSubClass", () => ({ default: class DDBSubClass {} }));

import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";

// =============================================================================
// Fixtures
// =============================================================================

function makeDdbData(choices: Record<string, any> = {}): any {
  return {
    character: {
      choices: {
        choiceDefinitions: [],
        class: [],
        race: [],
        background: [],
        feat: [],
        ...choices,
      },
    },
  };
}

function makeHelper(overrides: Record<string, any> = {}): AdvancementHelper {
  return new AdvancementHelper({
    ddbData: overrides.ddbData ?? makeDdbData(),
    type: overrides.type ?? "class",
    dictionary: overrides.dictionary,
    isMuncher: overrides.isMuncher ?? false,
    isSubclass: overrides.isSubclass ?? false,
  });
}

function makeFeature(overrides: Record<string, any> = {}): any {
  return {
    id: 101,
    name: "Proficiencies",
    description: "",
    requiredLevel: 1,
    ...overrides,
  };
}

function profMod(subType: string, friendlySubtypeName: string): any {
  return {
    type: "proficiency",
    subType,
    friendlySubtypeName,
    friendlyTypeName: "Proficiency",
    restriction: "",
    value: null,
    componentId: 101,
    componentTypeId: 12,
  };
}

// =============================================================================
// advancementUpdate (static)
// =============================================================================
describe("AdvancementHelper.advancementUpdate", () => {
  const TraitAdvancement: any = game.dnd5e.documents.advancement.TraitAdvancement;

  it("writes grants into configuration and value.chosen", () => {
    const adv: any = new TraitAdvancement();
    AdvancementHelper.advancementUpdate(adv, { grants: ["skills:ath"] });
    const data = adv.toObject();
    expect(data.configuration.grants).toEqual(["skills:ath"]);
    expect(data.value.chosen).toEqual(["skills:ath"]);
  });

  it("writes a pool with its count into configuration.choices", () => {
    const adv: any = new TraitAdvancement();
    AdvancementHelper.advancementUpdate(adv, { pool: ["skills:arc", "skills:nat"], count: 2 });
    const data = adv.toObject();
    expect(data.configuration.choices).toEqual([{ count: 2, pool: ["skills:arc", "skills:nat"] }]);
  });

  it("omits count when it is zero", () => {
    const adv: any = new TraitAdvancement();
    AdvancementHelper.advancementUpdate(adv, { pool: ["skills:prc"], count: 0 });
    const data = adv.toObject();
    expect(data.configuration.choices).toHaveLength(1);
    expect(data.configuration.choices[0].count).toBeUndefined();
    expect(data.configuration.choices[0].pool).toEqual(["skills:prc"]);
  });

  it("chosen overrides the value.chosen written by grants", () => {
    const adv: any = new TraitAdvancement();
    AdvancementHelper.advancementUpdate(adv, { grants: ["skills:ath"], chosen: ["skills:ste"] });
    const data = adv.toObject();
    expect(data.configuration.grants).toEqual(["skills:ath"]);
    expect(data.value.chosen).toEqual(["skills:ste"]);
  });
});

// =============================================================================
// getSaveAdvancement
// =============================================================================
describe("AdvancementHelper.getSaveAdvancement", () => {
  it("returns null when there are no saving throw modifiers", () => {
    const adv = makeHelper().getSaveAdvancement({
      feature: makeFeature(),
      mods: [profMod("acrobatics", "Acrobatics")],
      availableToMulticlass: false,
      level: 1,
    });
    expect(adv).toBeNull();
  });

  it("grants saves from modifiers at level 1 with primary restriction", () => {
    const adv: any = makeHelper().getSaveAdvancement({
      feature: makeFeature(),
      mods: [
        profMod("strength-saving-throws", "Strength Saving Throws"),
        profMod("constitution-saving-throws", "Constitution Saving Throws"),
      ],
      availableToMulticlass: false,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.configuration.grants).toEqual(["saves:str", "saves:con"]);
    expect(data.configuration.allowReplacements).toBe(false);
    expect(data.value.chosen).toEqual(["saves:str", "saves:con"]);
    expect(data.classRestriction).toBe("primary");
    expect(data.level).toBe(1);
  });

  it("uses secondary restriction when available to multiclass", () => {
    const adv: any = makeHelper().getSaveAdvancement({
      feature: makeFeature(),
      mods: [profMod("wisdom-saving-throws", "Wisdom Saving Throws")],
      availableToMulticlass: true,
      level: 1,
    });
    expect(adv.toObject().classRestriction).toBe("secondary");
  });

  it("clears the restriction above level 1 and for subclasses", () => {
    const mods = [profMod("dexterity-saving-throws", "Dexterity Saving Throws")];
    const feature = makeFeature();
    const higher: any = makeHelper().getSaveAdvancement({ feature, mods, availableToMulticlass: false, level: 3 });
    expect(higher.toObject().classRestriction).toBe("");
    const sub: any = makeHelper({ isSubclass: true }).getSaveAdvancement({ feature, mods, availableToMulticlass: false, level: 1 });
    expect(sub.toObject().classRestriction).toBe("");
  });

  it("allows replacements when the description says so", () => {
    const adv: any = makeHelper().getSaveAdvancement({
      feature: makeFeature({ description: "If you already have this proficiency, you instead gain proficiency in another saving throw." }),
      mods: [profMod("charisma-saving-throws", "Charisma Saving Throws")],
      availableToMulticlass: false,
      level: 1,
    });
    expect(adv.toObject().configuration.allowReplacements).toBe(true);
  });
});

// =============================================================================
// getSkillAdvancement
// =============================================================================
describe("AdvancementHelper.getSkillAdvancement", () => {
  it("returns null when no skills can be derived", () => {
    const adv = makeHelper().getSkillAdvancement({
      feature: makeFeature({ name: "Nothing Here", description: "<p>You can rage.</p>" }),
      mods: [],
      availableToMulticlass: false,
      level: 1,
    });
    expect(adv).toBeNull();
  });

  it("builds a class choice pool from parsed description and chosen from mods", () => {
    const adv: any = makeHelper().getSkillAdvancement({
      feature: makeFeature({ description: "<p><strong>Skills:</strong> Choose two from Athletics, Perception, and Survival</p>" }),
      mods: [profMod("athletics", "Athletics"), profMod("perception", "Perception")],
      availableToMulticlass: false,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Skill Proficiencies");
    expect(data.classRestriction).toBe("primary");
    expect(data.configuration.allowReplacements).toBe(true);
    expect(data.configuration.choices).toEqual([{ count: 2, pool: ["skills:ath", "skills:prc", "skills:sur"] }]);
    expect(data.value.chosen).toEqual(["skills:ath", "skills:prc"]);
  });

  it("builds grants from background descriptions", () => {
    const adv: any = makeHelper({ type: "background" }).getSkillAdvancement({
      feature: makeFeature({ name: "Background: Hermit", description: "<p><strong>Skill Proficiencies:</strong> Medicine, Religion</p>" }),
      mods: [],
      availableToMulticlass: undefined,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Skill Proficiencies");
    expect(data.classRestriction).toBeUndefined();
    expect(data.configuration.grants).toEqual(["skills:med", "skills:rel"]);
    expect(data.value.chosen).toEqual(["skills:med", "skills:rel"]);
  });

  it("uses the feature name as title for non-base features", () => {
    const adv: any = makeHelper().getSkillAdvancement({
      feature: makeFeature({ name: "Bonus Proficiency", description: "<p>You gain proficiency in the Intimidation skill.</p>" }),
      mods: [],
      availableToMulticlass: undefined,
      level: 3,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Bonus Proficiency");
    expect(data.configuration.grants).toEqual(["skills:itm"]);
  });

  it("muncher multiclass base proficiency uses the class dictionary count and grants from mods", () => {
    const adv: any = makeHelper({
      isMuncher: true,
      dictionary: { name: "Ranger", multiclassSkill: 1, multiclassTool: 0 },
    }).getSkillAdvancement({
      feature: makeFeature({ description: "<p><strong>Skills:</strong> Choose two from Athletics, Perception, and Survival</p>" }),
      mods: [profMod("survival", "Survival")],
      availableToMulticlass: true,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.classRestriction).toBe("secondary");
    expect(data.configuration.grants).toEqual(["skills:sur"]);
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["skills:ath", "skills:prc", "skills:sur"] }]);
    expect(data.value.chosen).toEqual(["skills:sur"]);
  });
});

// =============================================================================
// getLanguageAdvancement
// =============================================================================
describe("AdvancementHelper.getLanguageAdvancement", () => {
  function langMod(friendlySubtypeName: string): any {
    return {
      type: "language",
      subType: friendlySubtypeName.toLowerCase(),
      friendlySubtypeName,
      restriction: "",
      value: null,
      componentId: 101,
      componentTypeId: 12,
    };
  }

  it("returns null when nothing grants a language", () => {
    const adv = makeHelper().getLanguageAdvancement([], makeFeature({ description: "<p>No languages here.</p>" }), 1);
    expect(adv).toBeNull();
  });

  it("builds pool and chosen from language modifiers", () => {
    const adv: any = makeHelper().getLanguageAdvancement(
      [langMod("Dwarvish"), langMod("Undercommon")],
      makeFeature({ name: "Extra Languages", description: "<p>Nothing parsable.</p>" }),
      1,
    );
    const data = adv.toObject();
    expect(data.title).toBe("Extra Languages");
    expect(data.configuration.choices).toEqual([{ count: 2, pool: ["languages:standard:dwarvish", "languages:exotic:undercommon"] }]);
    expect(data.value.chosen).toEqual(["languages:standard:dwarvish", "languages:exotic:undercommon"]);
  });

  it("builds grants and wildcard pool from parsed description", () => {
    const adv: any = makeHelper().getLanguageAdvancement(
      [],
      makeFeature({ name: "Background: Outlander", description: "<p><strong>Languages:</strong> Giant and one other language of your choice</p>" }),
      1,
    );
    const data = adv.toObject();
    // "Background:" prefixed names fall back to the generic title
    expect(data.title).toBe("Languages");
    expect(data.configuration.grants).toEqual(["languages:standard:giant"]);
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["languages:*"] }]);
    expect(data.value.chosen).toEqual(["languages:standard:giant"]);
  });
});

// =============================================================================
// getToolAdvancement / getEmptyToolAdvancement
// =============================================================================
describe("AdvancementHelper.getToolAdvancement", () => {
  it("returns null for 'Tools: None' with no modifiers", () => {
    const adv = makeHelper().getToolAdvancement({
      feature: makeFeature({ description: "<p><strong>Tools:</strong> None</p>" }),
      mods: [],
      availableToMulticlass: false,
      level: 1,
    });
    expect(adv).toBeNull();
  });

  it("grants a parsed tool", () => {
    const adv: any = makeHelper().getToolAdvancement({
      feature: makeFeature({ description: "<p><strong>Tools:</strong> Herbalism kit</p>" }),
      mods: [],
      availableToMulticlass: false,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Tool Proficiencies");
    expect(data.configuration.grants).toEqual(["tool:herb"]);
    expect(data.value.chosen).toEqual(["tool:herb"]);
    expect(data.classRestriction).toBe("primary");
  });

  it("builds a group choice pool", () => {
    const adv: any = makeHelper().getToolAdvancement({
      feature: makeFeature({ description: "<p><strong>Tools:</strong> Choose one type of artisan’s tools</p>" }),
      mods: [],
      availableToMulticlass: false,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["tool:art:*"] }]);
  });
});

describe("AdvancementHelper.getEmptyToolAdvancement", () => {
  const choiceDefinitions = [{
    id: "12-2",
    options: [
      { id: 7, label: "Smith's Tools" },
      { id: 8, label: "Brewer's Supplies" },
    ],
  }];

  it("returns null when the feature has no tool choices", () => {
    const adv = makeHelper({ type: "background" }).getEmptyToolAdvancement({
      feature: makeFeature({ name: "Background: Sage" }),
      level: 1,
    });
    expect(adv).toBeNull();
  });

  it("grants the selected tool when a choice was made", () => {
    const ddbData = makeDdbData({
      choiceDefinitions,
      background: [{
        componentId: 101,
        componentTypeId: 12,
        subType: 1,
        type: 2,
        optionValue: 7,
        optionIds: [7, 8],
        defaultSubtypes: ["Smith's Tools"],
      }],
    });
    const adv: any = makeHelper({ type: "background", ddbData }).getEmptyToolAdvancement({
      feature: makeFeature({ name: "Background: Guild Artisan" }),
      level: 1,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Tool Proficiencies");
    expect(data.configuration.grants).toEqual(["tool:art:smith"]);
    expect(data.value.chosen).toEqual(["tool:art:smith"]);
  });

  it("offers the full pool when nothing is selected and no default exists", () => {
    const ddbData = makeDdbData({
      choiceDefinitions,
      background: [{
        componentId: 101,
        componentTypeId: 12,
        subType: 1,
        type: 2,
        optionValue: null,
        optionIds: [7, 8],
      }],
    });
    const adv: any = makeHelper({ type: "background", ddbData }).getEmptyToolAdvancement({
      feature: makeFeature({ name: "Background: Guild Artisan" }),
      level: 1,
    });
    const data = adv.toObject();
    expect(data.configuration.grants).toBeUndefined();
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["tool:art:smith", "tool:art:brewer"] }]);
  });
});

// =============================================================================
// getArmorAdvancement
// =============================================================================
describe("AdvancementHelper.getArmorAdvancement", () => {
  it("returns null when nothing grants armor", () => {
    const adv = makeHelper().getArmorAdvancement({
      feature: makeFeature({ description: "<p><strong>Armor:</strong> None</p>" }),
      mods: [],
      availableToMulticlass: false,
      level: 1,
    });
    expect(adv).toBeNull();
  });

  it("grants parsed armor groups", () => {
    const adv: any = makeHelper().getArmorAdvancement({
      feature: makeFeature({ description: "<p><strong>Armor:</strong> Light armor, shields</p>" }),
      mods: [],
      availableToMulticlass: false,
      level: 1,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Armor Training");
    expect(data.configuration.allowReplacements).toBe(false);
    expect(data.configuration.grants).toEqual(["armor:lgt", "armor:shl"]);
    expect(data.value.chosen).toEqual(["armor:lgt", "armor:shl"]);
    expect(data.classRestriction).toBe("primary");
  });

  it("falls back to armor modifiers when the description parses nothing", () => {
    const adv: any = makeHelper().getArmorAdvancement({
      feature: makeFeature({ name: "Bonus Armor Training", description: "<p>Nothing parsable.</p>" }),
      mods: [profMod("medium-armor", "Medium Armor")],
      availableToMulticlass: undefined,
      level: 4,
    });
    const data = adv.toObject();
    expect(data.title).toBe("Bonus Armor Training");
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["armor:med"] }]);
    expect(data.value.chosen).toEqual(["armor:med"]);
  });
});

// =============================================================================
// getWeaponAdvancement
// =============================================================================
describe("AdvancementHelper.getWeaponAdvancement", () => {
  it("returns null when nothing grants weapons", () => {
    const adv = makeHelper().getWeaponAdvancement(
      [],
      makeFeature({ description: "<p><strong>Weapons:</strong> None</p>" }),
      false,
      1,
    );
    expect(adv).toBeNull();
  });

  it("grants parsed weapon groups in default mode", () => {
    const adv: any = makeHelper().getWeaponAdvancement(
      [],
      makeFeature({ description: "<p><strong>Weapons:</strong> Simple weapons, martial weapons</p>" }),
      false,
      1,
    );
    const data = adv.toObject();
    expect(data.title).toBe("Weapon Proficiencies");
    expect(data.configuration.mode).toBe("default");
    expect(data.configuration.allowReplacements).toBe(false);
    expect(data.configuration.grants).toEqual(["weapon:sim", "weapon:mar"]);
    expect(data.value.chosen).toEqual(["weapon:sim", "weapon:mar"]);
    expect(data.classRestriction).toBe("primary");
  });

  it("falls back to weapon modifiers when the description parses nothing", () => {
    const adv: any = makeHelper().getWeaponAdvancement(
      [profMod("longsword", "Longsword"), profMod("rapier", "Rapier")],
      makeFeature({ name: "Extra Training", description: "<p>Nothing parsable.</p>" }),
      false,
      2,
    );
    const data = adv.toObject();
    expect(data.title).toBe("Extra Training");
    expect(data.classRestriction).toBe("");
    expect(data.configuration.choices).toEqual([{ count: 2, pool: ["weapon:mar:longsword", "weapon:mar:rapier"] }]);
    expect(data.value.chosen).toEqual(["weapon:mar:longsword", "weapon:mar:rapier"]);
  });
});

// =============================================================================
// getExpertiseAdvancement
// =============================================================================
describe("AdvancementHelper.getExpertiseAdvancement", () => {
  it("builds the default Expertise choice", () => {
    const adv: any = makeHelper().getExpertiseAdvancement(makeFeature({ name: "Expertise" }), 1);
    const data = adv.toObject();
    expect(data.title).toBe("Expertise");
    expect(data.configuration.mode).toBe("expertise");
    expect(data.configuration.allowReplacements).toBe(false);
    expect(data.configuration.choices).toEqual([{ count: 2, pool: ["skills:*", "tool:thief"] }]);
  });

  it("grants fixed skills for Survivalist", () => {
    const adv: any = makeHelper().getExpertiseAdvancement(makeFeature({ name: "Survivalist" }), 1);
    const data = adv.toObject();
    expect(data.title).toBe("Survivalist (Expertise)");
    expect(data.configuration.grants).toEqual(["skills:prc", "skills:nat"]);
    // count 0 is dropped from the pool entry
    expect(data.configuration.choices).toEqual([{ pool: ["skills:prc", "skills:nat"] }]);
    expect(data.value.chosen).toEqual(["skills:prc", "skills:nat"]);
  });

  it("uses the player's expertise selections for count and chosen", () => {
    const ddbData = makeDdbData({
      choiceDefinitions: [{
        id: "12-2",
        options: [
          { id: 7, label: "Stealth" },
          { id: 8, label: "Thieves' Tools" },
        ],
      }],
      class: [{
        componentId: 101,
        componentTypeId: 12,
        subType: 2,
        type: 2,
        optionValue: 7,
        optionIds: [7, 8],
      }],
    });
    const adv: any = makeHelper({ ddbData }).getExpertiseAdvancement(
      makeFeature({ name: "Expertise", requiredLevel: 6 }),
      6,
    );
    const data = adv.toObject();
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["skills:*", "tool:thief"] }]);
    expect(data.value.chosen).toEqual(["skills:ste"]);
  });
});

// =============================================================================
// getConditionAdvancement
// =============================================================================
describe("AdvancementHelper.getConditionAdvancement", () => {
  it("returns null with no parsable conditions and no modifiers", () => {
    const adv = makeHelper().getConditionAdvancement([], makeFeature({ description: "<p>Nothing here.</p>" }), 1);
    expect(adv).toBeNull();
  });

  it("grants resistances parsed from the description", () => {
    const adv: any = makeHelper().getConditionAdvancement(
      [],
      makeFeature({ name: "Psychic Resilience", description: "<p>You have resistance to psychic damage.</p>" }),
      1,
    );
    const data = adv.toObject();
    expect(data.title).toBe("Psychic Resilience");
    expect(data.configuration.allowReplacements).toBe(false);
    expect(data.configuration.grants).toEqual(["dr:psychic"]);
    expect(data.value.chosen).toEqual(["dr:psychic"]);
  });

  it("builds pool and chosen from resistance modifiers", () => {
    const mods = [{
      type: "resistance",
      subType: "psychic",
      friendlySubtypeName: "Psychic",
      restriction: "",
      value: null,
      componentId: 101,
      componentTypeId: 12,
    }];
    const adv: any = makeHelper().getConditionAdvancement(
      mods as any[],
      makeFeature({ name: "Mind Shield", description: "<p>Nothing parsable.</p>" }),
      1,
    );
    const data = adv.toObject();
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["dr:psychic"] }]);
    expect(data.value.chosen).toEqual(["dr:psychic"]);
  });
});

// =============================================================================
// generateScaleValueAdvancement (static)
// =============================================================================
describe("AdvancementHelper.generateScaleValueAdvancement", () => {
  it("returns null when the feature has no level scales", () => {
    expect(AdvancementHelper.generateScaleValueAdvancement(makeFeature({ name: "No Scales" }))).toBeNull();
  });

  it("builds a dice scale value", () => {
    const feature = makeFeature({
      name: "Sneak Attack",
      levelScales: [
        { level: 1, description: "1d6", fixedValue: null, dice: { diceCount: 1, diceValue: 6, diceString: "1d6", fixedValue: null } },
        { level: 5, description: "3d6", fixedValue: null, dice: { diceCount: 3, diceValue: 6, diceString: "3d6", fixedValue: null } },
      ],
    });
    const result: any = AdvancementHelper.generateScaleValueAdvancement(feature);
    expect(result.title).toBe("Sneak Attack");
    expect(result.configuration.identifier).toBe("sneak-attack");
    expect(result.configuration.type).toBe("dice");
    expect(result.configuration.scale["1"]).toEqual({ number: 1, faces: 6 });
    expect(result.configuration.scale["5"]).toEqual({ number: 3, faces: 6 });
  });

  it("builds a number scale value and clamps levels to requiredLevel", () => {
    const feature = makeFeature({
      name: "Rage Damage",
      requiredLevel: 3,
      levelScales: [
        { level: 1, description: "+2", fixedValue: 2 },
        { level: 9, description: "+3", fixedValue: 3 },
      ],
    });
    const result: any = AdvancementHelper.generateScaleValueAdvancement(feature);
    expect(result.configuration.type).toBe("number");
    // the level 1 scale is lifted to the feature's required level
    expect(result.configuration.scale["3"]).toEqual({ value: 2 });
    expect(result.configuration.scale["9"]).toEqual({ value: 3 });
  });

  it("falls back to a string scale using the scale description", () => {
    const feature = makeFeature({
      name: "Wild Shape CR",
      requiredLevel: 2,
      levelScales: [
        { level: 2, description: "1/4", fixedValue: null },
        { level: 8, description: "1", fixedValue: null },
      ],
    });
    const result: any = AdvancementHelper.generateScaleValueAdvancement(feature);
    expect(result.configuration.type).toBe("string");
    expect(result.configuration.scale["2"]).toEqual({ value: "1/4" });
    expect(result.configuration.scale["8"]).toEqual({ value: "1" });
  });

  it("combines dice string and fixed value for mixed scales", () => {
    const feature = makeFeature({
      name: "Mixed Scale",
      requiredLevel: 1,
      levelScales: [
        { level: 1, description: "", fixedValue: null, dice: { diceCount: 1, diceValue: 8, diceString: "1d8", fixedValue: 2 } },
      ],
    });
    const result: any = AdvancementHelper.generateScaleValueAdvancement(feature);
    expect(result.configuration.type).toBe("string");
    expect(result.configuration.scale["1"]).toEqual({ value: "1d8 + 2" });
  });
});
