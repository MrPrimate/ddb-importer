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

});

describe("AdvancementHelper skill choice subtypes", () => {
  it("recognises DDB choose subtypes and names their skills", () => {
    expect(AdvancementHelper.isSkillChoiceSubType("choose-a-barbarian-skill-proficiency")).toBe(true);
    expect(AdvancementHelper.isSkillChoiceSubType("choose-nature-or-survival")).toBe(true);
    expect(AdvancementHelper.isSkillChoiceSubType("magical-knowledge-skill")).toBe(true);
    expect(AdvancementHelper.isSkillChoiceSubType("enchanter-proficiency")).toBe(true);
    expect(AdvancementHelper.isSkillChoiceSubType("choose-a-kensei-tool")).toBe(false);
    expect(AdvancementHelper.isSkillChoiceSubType("choose-an-iron-mind-saving-throw")).toBe(false);
    expect(AdvancementHelper.isSkillChoiceSubType("choose-a-gaming-set")).toBe(false);
    expect(AdvancementHelper.isSkillChoiceSubType("perception")).toBe(false);

    expect(AdvancementHelper.skillsFromChooseSubType("choose-nature-or-survival")).toEqual(["nat", "sur"]);
    expect(AdvancementHelper.skillsFromChooseSubType("choose-deception-investigation-persuasion-slight-of-hand-or-stealth"))
      .toEqual(["dec", "inv", "per", "slt", "ste"]);
    expect(AdvancementHelper.skillsFromChooseSubType("choose-a-skill")).toEqual([]);
  });

  it("builds a skill pick from a choose subtype the description does not spell out", () => {
    const feature = makeFeature({ name: "Research Skills", requiredLevel: 3, description: "<p>You gain a proficiency.</p>" });
    const adv: any = makeHelper({ isSubclass: true }).getSkillAdvancement({
      feature,
      mods: [profMod("choose-history-investigation-or-nature", "Choose History, Investigation, or Nature")],
      level: 3,
    });
    expect(adv.toObject().configuration.choices).toEqual([{ count: 1, pool: ["skills:his", "skills:inv", "skills:nat"] }]);

    const open: any = makeHelper({ isSubclass: true }).getSkillAdvancement({
      feature: makeFeature({ name: "Well-Rounded", requiredLevel: 6, description: "<p>You gain a proficiency.</p>" }),
      mods: [profMod("choose-a-skill", "Choose a Skill")],
      level: 6,
    });
    expect(open.toObject().configuration.choices).toEqual([{ count: 1, pool: ["skills:*"] }]);
  });
});

describe("AdvancementHelper.getSaveAdvancement all saves", () => {
  it("expands Diamond Soul's single saving-throws modifier to every save", () => {
    const adv: any = makeHelper().getSaveAdvancement({
      feature: makeFeature({ name: "Diamond Soul", requiredLevel: 14 }),
      mods: [profMod("saving-throws", "Saving Throws")],
      availableToMulticlass: false,
      level: 14,
    });
    expect(adv.toObject().configuration.grants).toEqual(["saves:str", "saves:dex", "saves:con", "saves:int", "saves:wis", "saves:cha"]);
  });

  it("offers a pick of any save for a choose-a-saving-throw modifier", () => {
    const adv: any = makeHelper({ isSubclass: true }).getSaveAdvancement({
      feature: makeFeature({ name: "Iron Mind", requiredLevel: 7 }),
      mods: [profMod("choose-an-iron-mind-saving-throw", "Choose a Saving Throw")],
      availableToMulticlass: false,
      level: 7,
    });
    const data = adv.toObject();
    expect(data.configuration.grants).toEqual([]);
    expect(data.configuration.choices).toEqual([{ count: 1, pool: ["saves:*"] }]);
  });
});

// =============================================================================
// getExpertiseAdvancement
// =============================================================================
describe("AdvancementHelper.getExpertiseAdvancement", () => {

  it("counts choose modifiers and yields nothing for a listed name without expertise modifiers", () => {
    const choose = [{ type: "expertise", subType: "choose-a-skill-expertise", friendlySubtypeName: "Choose a Skill", restriction: "", componentId: 101 }] as any[];
    const adv: any = makeHelper({ isSubclass: true }).getExpertiseAdvancement(makeFeature({ name: "Visionary", requiredLevel: 11 }), 11, choose);
    expect(adv.toObject().configuration.choices).toEqual([{ count: 1, pool: ["skills:*"] }]);

    const none = makeHelper({ isSubclass: true }).getExpertiseAdvancement(
      makeFeature({ name: "Bonus Proficiencies", requiredLevel: 3 }),
      3,
      [profMod("giant", "Giant")],
    );
    expect(none).toBeNull();
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
