// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import { setMockSettings } from "../../_setup/foundryMocks";

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

  it("uses a custom name set on the trait's linked action", () => {
    const feature = buildTrait([
      { typeId: 8, valueId: "12052877", valueTypeId: "222216831", value: "Draining Strike" },
    ]);
    expect(feature.data.name).toBe("Draining Strike");
    // enricher lookups, dedupe and FORCE_WEAPON_FEATURES all key off originalName
    expect(feature.originalName).toBe("Vampiric Bite");
    expect(feature.documentType).toBe("weapon");
  });

  it("uses a custom name set directly on the trait", () => {
    const feature = buildTrait([
      { typeId: 8, valueId: "16553775", valueTypeId: "1960452172", value: "Blood Drinker" },
    ]);
    expect(feature.data.name).toBe("Blood Drinker");
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

  it("keeps an unsourced feature of an official class on 2014", () => {
    setMockSettings({ rulesVersion: "modern" }, "dnd5e");
    expect(buildClassFeature(false).is2014).toBe(true);
  });
});
