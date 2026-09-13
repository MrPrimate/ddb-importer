// @vitest-environment jsdom
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBaseClass from "../../../src/parser/classes/DDBBaseClass";
import logger from "../../../src/lib/Logger";
import DDBChoiceFeature from "../../../src/parser/features/DDBChoiceFeature";
import { NON_ITEM_CHOICE_LABELS } from "../../../src/parser/lib/FeatureChoiceRules";

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
    _addAdvancement: (advancement: I5eAdvancement) => advancements.push(advancement),
  });
  return { parser, advancements };
}

describe("class choice placeholders", () => {
  const warnings: unknown[][] = [];
  let original: typeof logger.warn;
  beforeEach(() => { original = logger.warn; warnings.length = 0; logger.warn = (...args) => { warnings.push(args); }; });
  afterEach(() => { logger.warn = original; });

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
