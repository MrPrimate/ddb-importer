// Characterization tests for DDBClassFeatures: constructor state, the pure
// deriveFeatures() grouping and the _getFeatures/build parsing pipeline.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBClassFeatures from "../../../src/parser/features/DDBClassFeatures";
import DDBEnricherFactoryMixin from "../../../src/parser/enrichers/mixins/DDBEnricherFactoryMixin";
import {
  makeDdbCharacterData,
  makeDdbClass,
  makeDdbFeature,
  makeRawCharacter,
} from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs, installDocumentStub } from "../../_fixtures/ddb/stubs";

beforeAll(async () => {
  installActivityConfigStubs();
  installDocumentStub();
  // enricher.init() builds a summons manager backed by real compendia which do
  // not exist in the test environment; everything else on the enricher is real.
  vi.spyOn(DDBEnricherFactoryMixin.prototype, "init").mockResolvedValue(undefined);
});

const CLASS_ID = 50001;
const SUBCLASS_ID = 50010;

interface IKlassFeatureSpec {
  id: number;
  name: string;
  requiredLevel?: number;
  displayOrder?: number;
  description?: string;
  classId?: number;
}

function makeFeature({ id, name, requiredLevel = 1, displayOrder = 1, description = "<p>A test feature.</p>", classId = CLASS_ID }: IKlassFeatureSpec): any {
  return makeDdbFeature({
    id,
    name,
    requiredLevel,
    displayOrder,
    description,
    classId,
  });
}

function makeKlassData({
  level = 5,
  features = [] as any[],
  subclassFeatures = [] as any[],
  optionalClassFeatures = [] as any[],
  className = "Testclass",
  // present on the character but absent from definition.classFeatures, the
  // "container feature" shape DDB ships for Gunslinger Maneuvers
  derivedOnlyFeatures = [] as any[],
} = {}): any {
  const subclassDefinition = subclassFeatures.length > 0
    ? {
      id: SUBCLASS_ID,
      name: "Testpath",
      classFeatures: subclassFeatures.map((f) => ({ ...f.definition })),
    }
    : null;
  const klass = makeDdbClass({
    level,
    definition: {
      id: CLASS_ID,
      name: className,
      classFeatures: features.map((f) => ({ ...f.definition })),
    },
    subclassDefinition,
    classFeatures: features.concat(subclassFeatures).concat(derivedOnlyFeatures),
  });
  return makeDdbCharacterData({
    character: {
      classes: [klass],
      optionalClassFeatures,
    },
  });
}

function makeClassFeatures(ddbData: any): any {
  return new DDBClassFeatures({ ddbData, rawCharacter: makeRawCharacter() });
}

describe("DDBClassFeatures constructor", () => {
  it("initialises parsed buckets for each class and subclass", () => {
    const ddbData = makeKlassData({
      features: [makeFeature({ id: 70101, name: "Alpha Strike" })],
      subclassFeatures: [makeFeature({ id: 70201, name: "Gamma Ward", classId: SUBCLASS_ID })],
    });
    const classFeatures = makeClassFeatures(ddbData);
    expect(Object.keys(classFeatures._parsed)).toEqual(["Testclass", "Testpath"]);
    expect(classFeatures.data).toEqual([]);
  });

  it("collects excluded feature ids from optional class features", () => {
    const ddbData = makeKlassData({
      features: [makeFeature({ id: 70101, name: "Alpha Strike" })],
      optionalClassFeatures: [
        { affectedClassFeatureId: 70101 },
        { affectedClassFeatureId: null },
      ],
    });
    const classFeatures = makeClassFeatures(ddbData);
    expect(classFeatures.excludedFeatures).toEqual([70101]);
  });
});

describe("DDBClassFeatures.deriveFeatures", () => {
  it("groups class features and their definition ids", () => {
    const alpha = makeFeature({ id: 70101, name: "Alpha Strike" });
    const beta = makeFeature({ id: 70102, name: "Beta Guard", requiredLevel: 3 });
    const ddbData = makeKlassData({ features: [alpha, beta] });
    const classFeatures = makeClassFeatures(ddbData);

    const grouped = classFeatures.klassFeatures["Testclass"];
    expect(grouped.classFeatureIds).toEqual([70101, 70102]);
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual([
      "Alpha Strike",
      "Beta Guard",
    ]);
    expect(grouped.filtered.subclass).toEqual([]);
  });

  it("drops features above the class level", () => {
    const ddbData = makeKlassData({
      level: 2,
      features: [
        makeFeature({ id: 70101, name: "Alpha Strike", requiredLevel: 1 }),
        makeFeature({ id: 70102, name: "Beta Guard", requiredLevel: 9 }),
      ],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Testclass"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual(["Alpha Strike"]);
  });

  it("drops features skipped by the feature name check", () => {
    const ddbData = makeKlassData({
      features: [
        makeFeature({ id: 70101, name: "Hit Points" }),
        makeFeature({ id: 70102, name: "Alpha Strike" }),
      ],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Testclass"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual(["Alpha Strike"]);
  });

  it("drops features replaced by optional class features", () => {
    const ddbData = makeKlassData({
      features: [
        makeFeature({ id: 70101, name: "Alpha Strike" }),
        makeFeature({ id: 70102, name: "Beta Guard" }),
      ],
      optionalClassFeatures: [{ affectedClassFeatureId: 70101 }],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Testclass"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual(["Beta Guard"]);
  });

  // DDB ships some features on the character but leaves them out of
  // definition.classFeatures. They are normally duplicates and correctly dropped;
  // FORCE_DERIVED_FEATURES recovers the ones whose text lives nowhere else.
  it("drops a derived feature missing from the definition feature list", () => {
    const ddbData = makeKlassData({
      features: [makeFeature({ id: 70101, name: "Alpha Strike" })],
      derivedOnlyFeatures: [makeFeature({ id: 70301, name: "Maneuvers" })],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Testclass"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual(["Alpha Strike"]);
  });

  it("keeps a derived feature listed under its class in FORCE_DERIVED_FEATURES", () => {
    const ddbData = makeKlassData({
      className: "Gunslinger",
      features: [makeFeature({ id: 70101, name: "Alpha Strike" })],
      derivedOnlyFeatures: [makeFeature({ id: 70301, name: "Maneuvers" })],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Gunslinger"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual([
      "Alpha Strike",
      "Maneuvers",
    ]);
  });

  it("still drops that name for a class it is not listed under", () => {
    // the whole reason FORCE_DERIVED_FEATURES is keyed by class name: Fighter has
    // its own "Maneuvers", which must keep going through the normal path
    const ddbData = makeKlassData({
      className: "Fighter",
      features: [makeFeature({ id: 70101, name: "Alpha Strike" })],
      derivedOnlyFeatures: [makeFeature({ id: 70301, name: "Maneuvers" })],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Fighter"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual(["Alpha Strike"]);
  });

  it("still applies the level and skip filters to a forced derived feature", () => {
    const ddbData = makeKlassData({
      className: "Gunslinger",
      level: 2,
      features: [makeFeature({ id: 70101, name: "Alpha Strike" })],
      derivedOnlyFeatures: [makeFeature({ id: 70301, name: "Maneuvers", requiredLevel: 9 })],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Gunslinger"];
    expect(grouped.filtered.class.map((f: any) => f.definition.name)).toEqual(["Alpha Strike"]);
  });

  it("splits subclass features and removes class features they shadow", () => {
    const alpha = makeFeature({ id: 70101, name: "Alpha Strike" });
    const gamma = makeFeature({ id: 70201, name: "Gamma Ward", classId: SUBCLASS_ID });
    const shadowed = makeFeature({ id: 70202, name: "Alpha Strike", classId: SUBCLASS_ID });
    const ddbData = makeKlassData({
      features: [alpha],
      subclassFeatures: [gamma, shadowed],
    });
    const grouped = makeClassFeatures(ddbData).klassFeatures["Testclass"];

    expect(grouped.subclassFeatureIds).toEqual([70201, 70202]);
    expect(grouped.filtered.subclass.map((f: any) => f.definition.name)).toEqual([
      "Gamma Ward",
      "Alpha Strike",
    ]);
    // the class-level Alpha Strike is shadowed by the subclass version
    expect(grouped.filtered.class).toEqual([]);
  });
});

describe("DDBClassFeatures._getFeatures", () => {
  it("parses a class feature and applies the passed flags", async () => {
    const alpha = makeFeature({ id: 70101, name: "Alpha Strike", requiredLevel: 3 });
    const ddbData = makeKlassData({ features: [alpha] });
    const classFeatures = makeClassFeatures(ddbData);

    const results = await classFeatures._getFeatures({
      featureDefinition: alpha,
      type: "class",
      source: "Testclass",
      flags: { ddbimporter: { class: "Testclass", classId: CLASS_ID } },
    });

    expect(results).toHaveLength(1);
    const data = results[0] as any;
    expect(data.name).toBe("Alpha Strike");
    expect(data.type).toBe("feat");
    expect(data.flags.ddbimporter.class).toBe("Testclass");
    expect(data.flags.ddbimporter.classId).toBe(CLASS_ID);
    expect(data.flags.ddbimporter.dndbeyond.requiredLevel).toBe(3);
    expect(data.system.description.value).toBe("<p>A test feature.</p>");
  });

  it("drops EXCLUDED_FEATURES such as Expertise", async () => {
    const expertise = makeFeature({ id: 70101, name: "Expertise" });
    const ddbData = makeKlassData({ features: [expertise] });
    const classFeatures = makeClassFeatures(ddbData);

    const results = await classFeatures._getFeatures({
      featureDefinition: expertise,
      type: "class",
      source: "Testclass",
    });
    expect(results).toEqual([]);
  });

  it("drops features above the class level when filtering by level", async () => {
    const high = makeFeature({ id: 70101, name: "Alpha Strike", requiredLevel: 9 });
    const ddbData = makeKlassData({ level: 5, features: [high] });
    const classFeatures = makeClassFeatures(ddbData);

    const filtered = await classFeatures._getFeatures({
      featureDefinition: high,
      type: "class",
      source: "Testclass",
    });
    expect(filtered).toEqual([]);

    const unfiltered = await classFeatures._getFeatures({
      featureDefinition: high,
      type: "class",
      source: "Testclass",
      filterByLevel: false,
    });
    expect(unfiltered).toHaveLength(1);
  });
});

describe("DDBClassFeatures.build", () => {
  it("parses class features and merges repeated levelled features", async () => {
    const alpha = makeFeature({ id: 70101, name: "Alpha Strike", requiredLevel: 1, displayOrder: 1 });
    const alphaImproved = makeFeature({
      id: 70103,
      name: "Alpha Strike",
      requiredLevel: 3,
      displayOrder: 3,
      description: "<p>Improved alpha strike.</p>",
    });
    const beta = makeFeature({ id: 70102, name: "Beta Guard", requiredLevel: 2, displayOrder: 2 });
    const ddbData = makeKlassData({ features: [alpha, alphaImproved, beta] });
    const classFeatures = makeClassFeatures(ddbData);

    await classFeatures.build();

    expect(classFeatures.data.map((f: any) => f.name)).toEqual(["Alpha Strike", "Beta Guard"]);
    const merged = classFeatures.data[0] as any;
    expect(merged.system.description.value).toContain("<h3>Testclass: Level 3</h3>");
    expect(merged.system.description.value).toContain("Improved alpha strike.");
  });

  it("drops a level prefixed repeat of a FORCE_DUPLICATE_FEATURE feature", async () => {
    // DDB ships the leveled repeats as "9: Critical Shot", and the prefix survives
    // on originalName, so the FORCE_DUPLICATE_FEATURE lookup has to normalise it
    const base = makeFeature({ id: 70301, name: "Critical Shot", requiredLevel: 2, displayOrder: 1 });
    const improved = makeFeature({
      id: 70302,
      name: "9: Critical Shot",
      requiredLevel: 9,
      displayOrder: 2,
      description: "<p>Improved crit range.</p>",
    });
    const ddbData = makeKlassData({ level: 20, features: [base, improved] });
    const classFeatures = makeClassFeatures(ddbData);

    await classFeatures.build();

    expect(classFeatures.data.map((f: any) => f.name)).toEqual(["Critical Shot"]);
    const doc = classFeatures.data[0] as any;
    expect(doc.system.description.value).not.toContain("Improved crit range.");
    expect(doc.system.description.value).not.toContain("Level 9");
  });

  it("adds subclass features with subclass flags", async () => {
    const alpha = makeFeature({ id: 70101, name: "Alpha Strike" });
    const gamma = makeFeature({ id: 70201, name: "Gamma Ward", classId: SUBCLASS_ID });
    const ddbData = makeKlassData({ features: [alpha], subclassFeatures: [gamma] });
    const classFeatures = makeClassFeatures(ddbData);

    await classFeatures.build();

    expect(classFeatures.data.map((f: any) => f.name)).toEqual(["Alpha Strike", "Gamma Ward"]);
    const subclassFeature = classFeatures.data[1] as any;
    expect(subclassFeature.flags.ddbimporter.subClass).toBe("Testpath");
    expect(subclassFeature.flags.ddbimporter.subClassId).toBe(SUBCLASS_ID);
    expect(subclassFeature.flags.ddbimporter.class).toBe("Testclass");
  });
});
