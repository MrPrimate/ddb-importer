// Characterization tests for DDBChoiceFeature: build(choice) naming and flag
// output, and the static buildChoiceFeatures merge/split behaviour.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBChoiceFeature from "../../../src/parser/features/DDBChoiceFeature";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import DDBEnricherFactoryMixin from "../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin";
import {
  makeDdbCharacterData,
  makeDdbChoice,
  makeDdbClass,
  makeDdbFeature,
  makeRawCharacter,
} from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs, installDocumentStub, repairEnricherDataStatics } from "../../_fixtures/ddb/stubs";

beforeAll(async () => {
  installActivityConfigStubs();
  installDocumentStub();
  await repairEnricherDataStatics();
  // enricher.init() builds a summons manager backed by real compendia which do
  // not exist in the test environment; everything else on the enricher is real.
  vi.spyOn(DDBEnricherFactoryMixin.prototype, "init").mockResolvedValue(undefined);
});

// build() swallows errors via try/catch and logs them; rethrow from the logger
// so a broken pipeline fails these tests loudly.
beforeEach(async () => {
  const { logger } = await import("../../../src/lib/_module");
  vi.spyOn(logger as any, "error").mockImplementation((...args: any[]) => {
    throw args[1] instanceof Error ? args[1] : new Error(JSON.stringify(args));
  });
});

const FEATURE_ID = 70001;
const FEATURE_ENTITY_TYPE_ID = 12168134;
const CHOICE_TYPE = 1;

interface IChoiceDataOptions {
  featureName?: string;
  options?: { id: number; label: string; description: string }[];
  chosenId?: number;
}

/**
 * ddbData containing one class whose class feature FEATURE_ID has a class
 * choice with the supplied options, of which chosenId is selected.
 */
function makeChoiceDdbData({
  featureName = "Test Feature",
  options = [
    { id: 101, label: "Option A", description: "<p>Option A text.</p>" },
    { id: 102, label: "Option B", description: "<p>Option B text.</p>" },
  ],
  chosenId = 101,
}: IChoiceDataOptions = {}): any {
  const feature = makeDdbFeature({ id: FEATURE_ID, name: featureName });
  const klass = makeDdbClass({ classFeatures: [feature] });
  return makeDdbCharacterData({
    character: {
      classes: [klass],
      choices: {
        class: [
          {
            id: "choice-1",
            componentId: FEATURE_ID,
            componentTypeId: FEATURE_ENTITY_TYPE_ID,
            type: CHOICE_TYPE,
            subType: 1,
            optionValue: chosenId,
            optionIds: options.map((o) => o.id),
            parentChoiceId: null,
            label: null,
          },
        ],
        race: [],
        feat: [],
        background: [],
        item: [],
        choiceDefinitions: [
          { id: `${FEATURE_ENTITY_TYPE_ID}-${CHOICE_TYPE}`, options },
        ],
      },
    },
  });
}

function makeChoiceFeature(dataOptions: IChoiceDataOptions = {}, type = "class"): any {
  const ddbData = makeChoiceDdbData(dataOptions);
  const ddbDefinition = foundry.utils.deepClone(
    ddbData.character.classes[0].classFeatures[0],
  );
  return new DDBChoiceFeature({
    ddbData,
    ddbDefinition,
    type,
    rawCharacter: makeRawCharacter(),
  } as any);
}

function makeParentFeature(dataOptions: IChoiceDataOptions = {}, type = "class"): any {
  const ddbData = makeChoiceDdbData(dataOptions);
  const ddbDefinition = ddbData.character.classes[0].classFeatures[0];
  return new DDBFeature({
    ddbData,
    ddbDefinition,
    type,
    rawCharacter: makeRawCharacter(),
  } as any);
}

describe("DDBChoiceFeature.build", () => {
  it("prefixes the choice label with the feature name", async () => {
    const feature = makeChoiceFeature();
    const originalId = feature.data._id;
    await feature.build(makeDdbChoice());

    expect(feature.data.name).toBe("Test Feature: Option A");
    expect(feature.originalName).toBe("Test Feature: Option A");
    expect(feature.data.flags.ddbimporter.originalName).toBe("Test Feature: Option A");
    expect(feature.data.flags.ddbimporter.dndbeyond.choice).toMatchObject({
      parentName: "Test Feature",
      label: "Option A",
      choiceId: "choice-1",
      optionId: "101",
    });
    // build stamps a fresh document id
    expect(feature.data._id).not.toBe(originalId);
  });

  it("reworks labels that already start with the feature name", async () => {
    const feature = makeChoiceFeature();
    await feature.build(makeDdbChoice({ label: "Test Feature - Improved" }));
    expect(feature.data.name).toBe("Test Feature: Improved");
  });

  it("returns early when the label already equals the feature name", async () => {
    const feature = makeChoiceFeature();
    await feature.build(makeDdbChoice({ label: "Test Feature" }));
    expect(feature.data.name).toBe("Test Feature");
    expect(feature.data.flags.ddbimporter.dndbeyond?.choice).toBeUndefined();
  });

  it("keeps the feature name for KEEP_CHOICE_FEATURE_NAME features", async () => {
    const feature = makeChoiceFeature({ featureName: "Hunter's Prey" });
    await feature.build(makeDdbChoice({ label: "Colossus Slayer" }));
    expect(feature.data.name).toBe("Hunter's Prey");
    expect(feature.data.system.type.subtype).toBe("huntersPrey");
  });

  it("strips the parent prefix for NO_FEATURE_PREFIX_NAME features", async () => {
    const feature = makeChoiceFeature({ featureName: "Rune Carver" });
    await feature.build(makeDdbChoice({ label: "Cloud Rune" }));
    expect(feature.data.name).toBe("Cloud Rune");
    // the subtype falls back to the backing class feature component name
    expect(feature.data.system.type.subtype).toBe("rune");
  });

  it("captures point costs from the label into resourceCharges", async () => {
    const feature = makeChoiceFeature();
    await feature.build(makeDdbChoice({ label: "Option A (2 points)" }));
    expect(feature.data.name).toBe("Test Feature: Option A");
    expect(feature.resourceCharges).toBe(2);
  });

  it("builds the description from the choice and snapshots the initial feature", async () => {
    const feature = makeChoiceFeature();
    await feature.build(makeDdbChoice());
    expect(feature.data.system.description.value).toContain("Option A text.");
    expect(feature.data.flags.ddbimporter.initialFeature).toBeDefined();
  });
});

describe("DDBChoiceFeature.buildChoiceFeatures", () => {
  it("merges a single chosen choice into the parent feature", async () => {
    const parent = makeParentFeature();
    expect(parent.isChoiceFeature).toBe(true);

    const features = await DDBChoiceFeature.buildChoiceFeatures(parent);
    expect(features).toEqual([]);
    expect(parent.data.name).toBe("Test Feature: Option A");
    expect(parent.data.flags.ddbimporter.dndbeyond.choice).toMatchObject({
      parentName: "Test Feature",
      label: "Option A",
    });
  });

  it("returns each choice as a separate feature when allFeatures is set", async () => {
    const parent = makeParentFeature();
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);

    expect(features.map((f: any) => f.name)).toEqual([
      "Test Feature: Option A",
      "Test Feature: Option B",
    ]);
    // the parent is not renamed when the choices split out
    expect(parent.data.name).toBe("Test Feature");
    for (const feature of features as any[]) {
      expect(feature.flags.ddbimporter.isChoice).toBe(true);
    }
    expect(new Set(features.map((f: any) => f._id)).size).toBe(2);
  });

  it("builds nothing for NO_CHOICE_BUILD features", async () => {
    const parent = makeParentFeature({ featureName: "Charger" });
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
    expect(features).toEqual([]);
    expect(parent.data.name).toBe("Charger");
  });

  it("builds nothing for feats outside FORCE_FEAT_CHOICES", async () => {
    const parent = makeParentFeature({}, "feat");
    parent.type = "feat";
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
    expect(features).toEqual([]);
  });

  it("filters NEVER_CHOICES labels such as ability scores", async () => {
    const parent = makeParentFeature({
      options: [
        { id: 101, label: "Strength", description: "" },
        { id: 102, label: "Dexterity", description: "" },
      ],
    });
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
    expect(features).toEqual([]);
    expect(parent.data.name).toBe("Test Feature");
  });
});
