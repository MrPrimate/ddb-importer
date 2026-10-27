// @vitest-environment jsdom
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";
import logger from "../../../src/lib/Logger";
import DDBChoiceFeature from "../../../src/parser/features/DDBChoiceFeature";
import { NON_ITEM_CHOICE_LABELS } from "../../../src/config/dictionary/parsing/features";

const feature = { id: 100, name: "Example Choice", requiredLevel: 3, description: "Choose an option." } as IDDBClassDefinitionFeature;
const choice = (optionIds: number[]) => ({ componentTypeId: 12168134, componentId: 100, type: 3,
  label: "Choose a Level 3 Option", optionValue: null, optionIds, id: "3-1", subType: null, options: [], isOptional: false,
  isInfinite: false, displayOrder: 3, parentChoiceId: null, defaultSubtypes: [], tagConstraints: [],
  itemDefinitionKey: null } satisfies IDDBChoiceEntry);

function stub() {
  const advancements: I5eAdvancement[] = [];
  const parser = Object.assign(Object.create(DDBBaseClass.prototype) as DDBBaseClass, {
    name: "Example", is2014: false, is2024: true,
    ddbParentClassDefinition: { id: 1 },
    ddbData: { character: { choices: { choiceDefinitions: [{ id: "12168134-3", options: [{ id: 7, label: "Example Option" }] }] } } },
    choiceMap: new Map(), configChoices: {},
    getCompendiumIxByFlags: () => ({ name: "Example Option", uuid: "Compendium.test.features.Item.example" }),
    _addFeatureAdvancement: (_feature: IDDBClassDefinitionFeature, advancement: I5eAdvancement) => advancements.push(advancement),
  });
  return { parser, advancements };
}

describe("class choice placeholders", () => {
  const warnings: unknown[][] = [];
  let original: typeof logger.warn;
  beforeEach(() => {
    original = logger.warn;
    warnings.length = 0;
    logger.warn = (...args) => {
      warnings.push(args);
    };
  });
  afterEach(() => {
    logger.warn = original;
  });

  it("ignores an empty placeholder without resolving its definition", async () => {
    const { parser, advancements } = stub();
    parser.ddbData.character.choices.choiceDefinitions = [];
    await parser._generateFeatureAdvancement(feature, [choice([])]);
    expect(advancements).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("keeps an available unselected choice without counting the empty placeholder", async () => {
    const { parser, advancements } = stub();
    await parser._generateFeatureAdvancement(feature, [choice([]), choice([7])]);
    expect(advancements).toHaveLength(1);
    expect(advancements[0].configuration).toMatchObject({ choices: { 3: { count: 1 } }, pool: [{ uuid: "Compendium.test.features.Item.example" }] });
    expect(warnings).toEqual([]);
  });

  it("still warns when actual option ids cannot be resolved", async () => {
    const { parser, advancements } = stub();
    await parser._generateFeatureAdvancement(feature, [choice([999])]);
    expect(advancements).toEqual([]);
    expect(warnings.some(([message]) => String(message).includes("option Ids: 999"))).toBe(true);
  });

  it("shares ability-only exclusions with choice document generation", () => {
    expect(DDBChoiceFeature.NEVER_CHOICES).toBe(NON_ITEM_CHOICE_LABELS);
    expect(NON_ITEM_CHOICE_LABELS).toEqual(expect.arrayContaining(["Intelligence", "Wisdom", "Charisma"]));
    expect(NON_ITEM_CHOICE_LABELS).not.toContain("Breath Weapon (Cold)");
  });
});

describe("feature advancement owners", () => {
  function owner(features: IDDBClassDefinitionFeature[]) {
    return Object.assign(Object.create(DDBBaseClass.prototype) as DDBBaseClass, {
      data: { system: { advancement: {} } },
      ddbClassDefinition: { id: 1 },
      classFeatures: features,
      ownedFeatureAdvancements: new Map(),
    });
  }

  it("keeps a discarded feature's option choice on the class", () => {
    const pactBoon = { id: 200, name: "Pact Boon", requiredLevel: 3 } as IDDBClassDefinitionFeature;
    const parser = owner([pactBoon]);
    parser._addFeatureAdvancement(pactBoon, { _id: "", type: "ItemChoice", name: "Pact Boon" } as I5eAdvancement);
    expect(parser.ownedFeatureAdvancements.size).toBe(0);
    expect(Object.values(parser.data.system.advancement!).map((a) => a.name)).toEqual(["Pact Boon"]);
  });

  it("holds other feature advancements for the feature's own item", () => {
    const metamagic = { id: 201, name: "Metamagic", requiredLevel: 2 } as IDDBClassDefinitionFeature;
    const parser = owner([metamagic]);
    parser._addFeatureAdvancement(metamagic, { _id: "", type: "ItemChoice", name: "Metamagic" } as I5eAdvancement);
    expect(parser.ownedFeatureAdvancements.get(201)?.advancements).toHaveLength(1);
    expect(Object.keys(parser.data.system.advancement!)).toEqual([]);
  });
});
