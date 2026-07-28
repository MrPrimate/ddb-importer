// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";

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
