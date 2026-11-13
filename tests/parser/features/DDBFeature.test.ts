// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import { setMockSettings } from "../../_setup/foundryMocks";

describe("Reanimated Companion classification", () => {
  it("routes the class feature through companion parsing and summon activity generation", () => {
    const feature = Object.create(DDBFeature.prototype);
    feature.originalName = "Reanimated Companion";
    // _checkSummons reads the option description from the definition every real feature carries
    feature.ddbDefinition = { name: "Reanimated Companion", description: "" };
    feature.is2014 = false;
    feature.ddbData = {
      character: { classes: [{ classFeatures: [{ definition: { name: "Reanimated Companion" } }] }] },
    };
    feature._checkSummons();
    expect(feature.isCompanionFeature2024).toBe(true);
    expect(feature.isSummons).toBe(true);
    expect(feature._getActivitiesType()).toBe("summon");
  });
});

// dnd5e data model stubs now live in tests/_setup/foundryMocks.ts (game.dnd5e).

// Dhampir 2024: the "Vampiric Bite" trait spawns a "Fanged Bite" action, and DDB
// stores a rename against the action rather than the trait
const TRAIT = {
  definition: {
    id: 16553775,
    entityTypeId: 1960452172,
    name: "Vampiric Bite",
    description: "<p>Your fanged bite is a natural weapon.</p>",
    snippet: "",
    sources: [],
    requiredLevel: null,
    hideInSheet: false,
  },
};

const ACTION = {
  id: 12052877,
  entityTypeId: 222216831,
  name: "Fanged Bite",
  componentId: TRAIT.definition.id,
  componentTypeId: TRAIT.definition.entityTypeId,
  displayAsAttack: true,
  activation: {},
};

function makeDDB(characterValues: any[] = []): any {
  return {
    character: {
      classes: [],
      feats: [],
      race: { fullName: "Dhampir", racialTraits: [TRAIT] },
      actions: { race: [ACTION], class: [], feat: [], item: [], background: [] },
      options: { class: [], race: [], feat: [] },
      choices: { class: [], race: [], feat: [] },
      modifiers: { class: [], race: [], background: [], item: [], feat: [], condition: [] },
      optionalClassFeatures: [],
      characterValues,
    },
    classOptions: [],
  };
}

function makeRawCharacter(characterValues: any[]): any {
  return {
    flags: { ddbimporter: { compendium: false, dndbeyond: { characterValues } } },
    system: { resources: {} },
  };
}

function buildTrait(characterValues: any[]) {
  const ddb = makeDDB(characterValues);
  return new DDBFeature({
    ddbCharacter: {
      totalLevels: 5,
      _ddbRace: { fullName: "Dhampir", baseName: "Dhampir", baseRaceName: "Dhampir", groupName: "Dhampir", isLineage: false },
    },
    ddbData: ddb,
    ddbDefinition: TRAIT,
    rawCharacter: makeRawCharacter(characterValues),
    type: "race",
    source: null,
    extraFlags: {},
    fallbackEnricher: "Generic",
  } as any);
}

describe("DDBFeature naming", () => {
  it("uses the raw DDB name when nothing is renamed", () => {
    const feature = buildTrait([]);
    expect(feature.data.name).toBe("Vampiric Bite");
    expect(feature.originalName).toBe("Vampiric Bite");
  });

});

describe("DDBFeature rules version", () => {
  function buildFeat(isHomebrew: boolean) {
    const definition = { ...TRAIT.definition, name: "Homebrew Feat", isHomebrew };
    return new DDBFeature({
      ddbData: makeDDB(),
      ddbDefinition: { definition },
      rawCharacter: makeRawCharacter([]),
      type: "feat",
      source: null,
      extraFlags: {},
      fallbackEnricher: "Generic",
    } as any);
  }

  afterEach(() => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
  });

  it.each([
    ["modern", false, "2024"],
    ["legacy", true, "2014"],
  ] as const)("imports unsourced homebrew under the %s system rules", (systemRules, is2014, rules) => {
    setMockSettings({ rulesVersion: systemRules }, "dnd5e");
    const feature = buildFeat(true);
    expect(feature.is2014).toBe(is2014);
    expect(feature.data.system.source?.rules).toBe(rules);
  });

  it("keeps unsourced official content on 2014", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(buildFeat(false).is2014).toBe(true);
  });

  // DDB puts isHomebrew on the class definition, never on its class features
  function buildClassFeature(classIsHomebrew: boolean) {
    const definition = {
      ...TRAIT.definition,
      id: 9100001,
      name: "Homebrew Class Feature",
      classId: 910000,
      requiredLevel: 1,
    };
    const ddb = makeDDB();
    ddb.character.classes = [{
      level: 1,
      isStartingClass: true,
      definition: { id: 910000, name: "Homebrew Class", sources: [], isHomebrew: classIsHomebrew, classFeatures: [] },
      subclassDefinition: null,
      classFeatures: [{ definition }],
    }];
    return new DDBFeature({
      ddbData: ddb,
      ddbDefinition: { definition },
      rawCharacter: makeRawCharacter([]),
      type: "class",
      source: null,
      extraFlags: {},
      fallbackEnricher: "Generic",
    } as any);
  }

  it.each([
    ["modern", false],
    ["legacy", true],
  ] as const)("files an unsourced feature of a homebrew class under the %s system rules", (systemRules, is2014) => {
    setMockSettings({ rulesVersion: systemRules }, "dnd5e");
    const feature = buildClassFeature(true);
    expect(feature.is2014).toBe(is2014);
    expect(feature.isClass2014).toBe(is2014);
  });

  // DDB puts isHomebrew on the species, never on its traits; DDBRace matches trait documents on it
  function buildSpeciesTrait(speciesIsHomebrew: boolean) {
    const ddb = makeDDB();
    Object.assign(ddb.character.race, { sources: [], isHomebrew: speciesIsHomebrew, isLegacy: false });
    return new DDBFeature({
      ddbCharacter: {
        totalLevels: 5,
        _ddbRace: { fullName: "Dhampir", baseName: "Dhampir", baseRaceName: "Dhampir", groupName: "Dhampir", isLineage: false },
      },
      ddbData: ddb,
      ddbDefinition: TRAIT,
      rawCharacter: makeRawCharacter([]),
      type: "race",
      source: null,
      extraFlags: {},
      fallbackEnricher: "Generic",
    } as any);
  }

  it.each([
    ["modern", false],
    ["legacy", true],
  ] as const)("files an unsourced trait of a homebrew species under the %s system rules", (systemRules, is2014) => {
    setMockSettings({ rulesVersion: systemRules }, "dnd5e");
    const trait = buildSpeciesTrait(true);
    expect(trait.is2014).toBe(is2014);
    expect(trait.data.flags.ddbimporter?.is2014).toBe(is2014);
  });

  it("keeps an unsourced trait of an official species on 2014", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(buildSpeciesTrait(false).is2014).toBe(true);
  });

  // a homebrew subclass of an official class: its features carry the subclass id and no sources
  function buildSubclassFeature(classSourceId: number, featureOwner: "subclass" | "class" = "subclass") {
    const definition = {
      ...TRAIT.definition,
      id: 9200001,
      name: "Homebrew Subclass Feature",
      classId: featureOwner === "subclass" ? 920001 : 920000,
      requiredLevel: 3,
    };
    const ddb = makeDDB();
    ddb.character.classes = [{
      level: 3,
      isStartingClass: true,
      definition: {
        id: 920000,
        name: "Official Class",
        sources: [{ sourceId: classSourceId, sourceType: 1, pageNumber: null }],
        classFeatures: [],
      },
      subclassDefinition: { id: 920001, name: "Homebrew Subclass", sources: [], isHomebrew: true, classFeatures: [] },
      classFeatures: [{ definition }],
    }];
    return new DDBFeature({
      ddbData: ddb,
      ddbDefinition: { definition },
      rawCharacter: makeRawCharacter([]),
      type: "class",
      source: null,
      extraFlags: {},
      fallbackEnricher: "Generic",
    } as any);
  }

  it.each([
    ["2014", 2, true],
    ["2024", 145, false],
  ] as const)("files an unsourced homebrew subclass feature by its %s class in either world", (_label, classSourceId, is2014) => {
    for (const systemRules of ["modern", "legacy"]) {
      setMockSettings({ rulesVersion: systemRules }, "dnd5e");
      const feature = buildSubclassFeature(classSourceId);
      expect(feature.is2014).toBe(is2014);
      expect(feature.data.system.source?.rules).toBe(is2014 ? "2014" : "2024");
    }
  });

  it("leaves an unsourced feature of the official class itself to the source check", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(buildSubclassFeature(145, "class").is2014).toBe(true);
  });

  it("keeps an unsourced feature of an official class on 2014", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(buildClassFeature(false).is2014).toBe(true);
  });
});
