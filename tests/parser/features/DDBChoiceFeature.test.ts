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
import { installActivityConfigStubs, installDocumentStub } from "../../_fixtures/ddb/stubs";

beforeAll(async () => {
  installActivityConfigStubs();
  installDocumentStub();
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
// DDB choice type 3: a class feature option
const CHOICE_TYPE = 3;

interface IChoiceDataOptions {
  featureName?: string;
  featureDescription?: string;
  options?: { id: number; label: string; description: string }[];
  chosenId?: number;
  /** DDB choice type (3, a feature option, by default; 2 proficiency pick, 4 spell pick) */
  choiceType?: number;
  /** character.spells.class entries (feature-granted spells) */
  classSpells?: any[];
}

/**
 * ddbData containing one class whose class feature FEATURE_ID has a class
 * choice with the supplied options, of which chosenId is selected.
 */
function makeChoiceDdbData({
  featureName = "Test Feature",
  featureDescription,
  options = [
    { id: 101, label: "Option A", description: "<p>Option A text.</p>" },
    { id: 102, label: "Option B", description: "<p>Option B text.</p>" },
  ],
  chosenId = 101,
  choiceType = CHOICE_TYPE,
  classSpells = [],
}: IChoiceDataOptions = {}): any {
  const feature = makeDdbFeature({
    id: FEATURE_ID,
    name: featureName,
    ...(featureDescription === undefined ? {} : { description: featureDescription }),
  });
  const klass = makeDdbClass({ classFeatures: [feature] });
  return makeDdbCharacterData({
    character: {
      classes: [klass],
      spells: { class: classSpells },
      choices: {
        class: [
          {
            id: "choice-1",
            componentId: FEATURE_ID,
            componentTypeId: FEATURE_ENTITY_TYPE_ID,
            type: choiceType,
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
          { id: `${FEATURE_ENTITY_TYPE_ID}-${choiceType}`, options },
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

function makeParentFeature(dataOptions: IChoiceDataOptions = {}, type = "class", isMuncher = false): any {
  const ddbData = makeChoiceDdbData(dataOptions);
  const ddbDefinition = ddbData.character.classes[0].classFeatures[0];
  return new DDBFeature({
    ddbData,
    ddbDefinition,
    type,
    rawCharacter: makeRawCharacter(),
    isMuncher,
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
      optionId: 101,
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

  it("keeps a lone chosen option as its own document when munching a feature with several options", async () => {
    // the class munch chooses one option per mule pass; a merged parent per pass left the
    // compendium with several parent-flagged copies and no isChoice options
    const parent = makeParentFeature({}, "class", true);
    expect(parent.isMuncher).toBe(true);
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent);

    expect(features.map((f: any) => f.name)).toEqual(["Test Feature: Option A"]);
    expect((features[0] as any).flags.ddbimporter.isChoice).toBe(true);
    expect((features[0] as any).flags.ddbimporter.dndbeyond.choice.optionId).toBe(101);
    expect(parent.data.name).toBe("Test Feature");
    expect(parent.data.flags.ddbimporter.dndbeyond?.choice).toBeUndefined();
  });

  it("keeps a munched pass's only offered option as its own document too", async () => {
    // a pass can offer one option of several (an earlier pick narrows the list)
    const parent = makeParentFeature({
      options: [{ id: 101, label: "Option A", description: "<p>Option A text.</p>" }],
    }, "class", true);
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent);

    expect(features.map((f: any) => f.name)).toEqual(["Test Feature: Option A"]);
    expect(parent.data.name).toBe("Test Feature");
  });

  it("splits lone munched options for class features only", () => {
    const stub = (type: string, isMuncher = true) => ({ type, isMuncher, isCompanionFeature: false, isCompanionFeatureOption: false }) as any;
    expect(DDBChoiceFeature.munchKeepsLoneChoice(stub("class"))).toBe(true);
    // species lookups match one merged trait per option; backgrounds keep the merge too
    expect(DDBChoiceFeature.munchKeepsLoneChoice(stub("race"))).toBe(false);
    expect(DDBChoiceFeature.munchKeepsLoneChoice(stub("background"))).toBe(false);
    expect(DDBChoiceFeature.munchKeepsLoneChoice(stub("class", false))).toBe(false);
    expect(DDBChoiceFeature.munchKeepsLoneChoice({ ...stub("class"), isCompanionFeature: true })).toBe(false);
  });

  describe("derived choice suppression", () => {
    const single = (label: string) => [{ id: 101, label, description: "<p>Text.</p>" }];

    it("suppresses a lone option restating the feature", async () => {
      const parent = makeParentFeature({ options: single("Rage: Test Feature") });
      expect(parent.isRestatingSingleChoice).toBe(true);
      expect(parent.suppressesChoiceBuild).toBe(true);
      expect(await DDBChoiceFeature.buildChoiceFeatures(parent)).toEqual([]);
      expect(parent.data.name).toBe("Test Feature");
    });

    it("builds a lone option that adds to the feature name (a pool narrowed by an earlier pick)", () => {
      // "Elemental Gift (Dao)", "Full Bloom: Jade Vine"
      expect(makeParentFeature({ options: single("Test Feature (Dao)") }).isRestatingSingleChoice).toBe(false);
      expect(makeParentFeature({ options: single("Test Feature: Jade Vine") }).isRestatingSingleChoice).toBe(false);
      // "Black Draconic Magic": one of several real options served one per pass
      expect(makeParentFeature({ options: single("Black Test Feature") }).isRestatingSingleChoice).toBe(false);
      expect(makeParentFeature({ options: single("Take Test Feature") }).isRestatingSingleChoice).toBe(true);
      expect(makeParentFeature({ options: single("Test Feature") }).isRestatingSingleChoice).toBe(true);
    });

    it("builds a lone option that names something else", async () => {
      const parent = makeParentFeature({ options: single("Eyes") });
      expect(parent.isRestatingSingleChoice).toBe(false);
      expect(parent.suppressesChoiceBuild).toBe(false);
    });

    it("suppresses proficiency picks", async () => {
      const parent = makeParentFeature({ choiceType: 2 });
      expect(parent.isPickOnlyChoiceFeature).toBe(true);
      expect(await DDBChoiceFeature.buildChoiceFeatures(parent)).toEqual([]);
      expect(parent.data.name).toBe("Test Feature");
    });

    it("leaves pick options out of the parent description", async () => {
      // the option list of a language or spell pick is bare names
      const parent = makeParentFeature({
        choiceType: 2,
        options: [{ id: 101, label: "Abyssal", description: "" }, { id: 102, label: "Draconic", description: "" }],
      });
      await parent.loadEnricher();
      await parent.build();
      expect(parent.data.system.description.value).not.toContain("Abyssal");
      expect(parent.data.system.description.value).not.toContain("Draconic");
    });

    it("leaves bare option labels out of the parent description", async () => {
      // options without their own text add nothing to the feature's body
      const parent = makeParentFeature({
        choiceType: 3,
        options: [{ id: 101, label: "Lorem", description: "" }, { id: 102, label: "Ipsum", description: "" }],
      });
      await parent.loadEnricher();
      await parent.build();
      expect(parent.data.system.description.value).not.toContain("Ipsum");
    });

    it("suppresses a spell pick that lands in the spellbook", () => {
      const parent = makeParentFeature({
        choiceType: 4,
        classSpells: [{ componentId: FEATURE_ID, usesSpellSlot: true, limitedUse: null, definition: { id: 101, name: "Option A" } }],
      });
      expect(parent.isPickOnlyChoiceFeature).toBe(true);
    });

    it("keeps a spell pick the feature casts on its own uses (Mystic Arcanum)", async () => {
      const parent = makeParentFeature({
        choiceType: 4,
        classSpells: [{ componentId: FEATURE_ID, usesSpellSlot: false, limitedUse: { maxUses: 1, resetType: 2 }, definition: { id: 101, name: "Option A" } }],
      });
      expect(parent.isPickOnlyChoiceFeature).toBe(false);
      expect(parent.suppressesChoiceBuild).toBe(false);
      await DDBChoiceFeature.buildChoiceFeatures(parent);
      expect(parent.data.name).toBe("Test Feature: Option A");
    });

    describe("feat and species options that are a bare ability or damage type", () => {
      // the same fixture with its choices filed under the species or feat section
      function makeTypedParent(type: "race" | "feat", dataOptions: IChoiceDataOptions = {}): any {
        const ddbData = makeChoiceDdbData(dataOptions);
        ddbData.character.choices[type] = ddbData.character.choices.class;
        ddbData.character.choices.class = [];
        return new DDBFeature({
          ddbData,
          ddbDefinition: ddbData.character.classes[0].classFeatures[0],
          type,
          rawCharacter: makeRawCharacter(),
        } as any);
      }
      const labels = (...names: string[]) => names.map((label, i) => ({ id: 101 + i, label, description: "" }));

      it("suppresses a species trait offering only spellcasting abilities (Astral Fire)", async () => {
        const parent = makeTypedParent("race", { options: labels("Intelligence", "Wisdom", "Charisma") });
        expect(parent.isTraitOnlyChoiceFeature).toBe(true);
        expect(await DDBChoiceFeature.buildChoiceFeatures(parent)).toEqual([]);
        expect(parent.data.name).toBe("Test Feature");
      });

      it("builds species damage types, picks and abilities with a lead-in", () => {
        // Dragonborn Damage Resistance: the option carries the resistance effect
        expect(makeTypedParent("race", { options: labels("Acid", "Cold") }).isTraitOnlyChoiceFeature).toBe(false);
        // High Elf "Cantrip: Prestidigitation" names the trait after its pick
        expect(makeTypedParent("race", { choiceType: 4 }).isTraitOnlyChoiceFeature).toBe(false);
        // Eladrin Fey Step: a real season option that also sets an ability
        expect(makeTypedParent("race", { options: labels("Autumn - Intelligence", "Winter - Wisdom") })
          .isTraitOnlyChoiceFeature).toBe(false);
      });

      it("suppresses feats offering abilities, damage types or picks", () => {
        expect(makeTypedParent("feat", { options: labels("Intelligence", "Wisdom") }).isTraitOnlyChoiceFeature).toBe(true);
        expect(makeTypedParent("feat", { options: labels("Acid", "Cold Damage") }).isTraitOnlyChoiceFeature).toBe(true);
        expect(makeTypedParent("feat", { choiceType: 2 }).isTraitOnlyChoiceFeature).toBe(true);
        expect(makeTypedParent("feat", { choiceType: 4 }).isTraitOnlyChoiceFeature).toBe(true);
        expect(makeTypedParent("feat", { options: labels("Wisdom - Cleric, Druid") }).isTraitOnlyChoiceFeature).toBe(false);
      });

      it("leaves class features to the class rules", () => {
        expect(makeParentFeature({ options: labels("Intelligence", "Wisdom") }).isTraitOnlyChoiceFeature).toBe(false);
      });

      it("keeps the feat's own uses when its only option is a spellcasting ability (Gathered Whispers)", async () => {
        // no option document is built to merge uses from, so the parent parses its own
        const parent = makeTypedParent("feat", { options: labels("Intelligence", "Wisdom", "Charisma"), chosenId: 103 });
        parent.ddbDefinition.limitedUse = { maxUses: 0, useProficiencyBonus: true, proficiencyBonusOperator: 1, resetType: 2 };
        expect(parent.isTraitOnlyChoiceFeature).toBe(true);
        await parent.loadEnricher();
        await parent.build();
        expect(parent.data.system.uses.max).toBe("@prof");
      });
    });
  });

  describe("FOLD_CHOICE_INTO_PARENT", () => {
    const folded = { featureName: "Martial Sorcery", options: [{ id: 101, label: "Innate Bladework", description: "<p>Use Charisma.</p>" }] };

    it("merges the lone option into the parent, which keeps its own name", async () => {
      const parent = makeParentFeature(folded);
      expect(await DDBChoiceFeature.buildChoiceFeatures(parent)).toEqual([]);
      expect(parent.data.name).toBe("Martial Sorcery");
      expect(parent.data.flags.ddbimporter.dndbeyond.choice).toMatchObject({ label: "Innate Bladework" });
    });

    it("merges on a class munch too, where other lone options stay documents", async () => {
      const parent = makeParentFeature(folded, "class", true);
      expect(await DDBChoiceFeature.buildChoiceFeatures(parent)).toEqual([]);
      expect(parent.data.name).toBe("Martial Sorcery");
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
    const parent = makeParentFeature({ featureName: "Hunter's Prey" });
    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
    expect(features).toEqual([]);
    expect(parent.data.name).toBe("Hunter's Prey");
  });

  // The class-scoped alternative to NO_CHOICE_BUILD, for a name two classes treat
  // differently: Gunslinger "Maneuvers" wants one feature carrying the options as
  // text, Fighter "Maneuvers" wants a child feature per maneuver. A flat name list
  // cannot express both.
  it("builds nothing when the enricher sets noChoiceBuild", async () => {
    const parent = makeParentFeature();
    vi.spyOn(parent.enricher, "noChoiceBuild", "get").mockReturnValue(true);

    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
    expect(features).toEqual([]);
    expect(parent.data.name).toBe("Test Feature");
  });

  // A parent whose enricher builds the primary activity itself would otherwise lose the chosen
  // option's own actions (Semblance of Life's spirit-form attacks) in the single-choice merge.
  it("appends a lone chosen option's activities when the enricher sets mergeChoiceActivities", async () => {
    const primary = { _id: "primaryAAAAAAAAA", name: "Shapeshift", type: "transform" };
    const ddbCopy = { _id: "ddbCopyAAAAAAAAA", name: "Shapeshift", type: "utility" };
    const attack = { _id: "attackAAAAAAAAAA", name: "Radiant Mace", type: "damage" };
    const originalBuild = DDBChoiceFeature.prototype.build;
    vi.spyOn(DDBChoiceFeature.prototype, "build").mockImplementation(async function (this: any, choice: any) {
      await originalBuild.call(this, choice);
      this.data.system.activities = { [ddbCopy._id]: ddbCopy, [attack._id]: attack };
    });

    const parent = makeParentFeature();
    parent.data.system.activities = { [primary._id]: primary };
    vi.spyOn(parent.enricher, "mergeChoiceActivities", "get").mockReturnValue(true);

    const features = await DDBChoiceFeature.buildChoiceFeatures(parent);
    expect(features).toEqual([]);
    expect(parent.data.name).toBe("Test Feature: Option A");
    // the same-named DDB copy loses to the parent's activity, the rest are appended
    expect(Object.keys(parent.data.system.activities)).toEqual([primary._id, attack._id]);

    // a companion option's summon folds its profiles into the parent's summon instead of
    // arriving as a second summon activity
    const parentSummon = { _id: "summonParentAAAA", name: "Summon Vestige", type: "summon", profiles: [] as any[] };
    const childSummon = {
      _id: "summonChildAAAAA", name: "Summon", type: "summon",
      bonuses: { ac: "@abilities.cha.mod" }, match: { proficiency: true },
      profiles: [{ _id: "profileAAAAAAAAA", name: "Vestige Companion (Celestial)", uuid: "Actor.vestige" }],
    };
    vi.mocked(DDBChoiceFeature.prototype.build).mockImplementation(async function (this: any, choice: any) {
      await originalBuild.call(this, choice);
      this.data.system.activities = { [childSummon._id]: childSummon, [attack._id]: attack };
    });
    const companionParent = makeParentFeature();
    // an actor already linked (the sheet copy's generic parse) is not added a second time
    parentSummon.profiles.push({ _id: "profileBBBBBBBBB", name: "Vestige Companion (Celestial)", uuid: "Actor.vestige" });
    companionParent.data.system.activities = { [parentSummon._id]: parentSummon };
    vi.spyOn(companionParent.enricher, "mergeChoiceActivities", "get").mockReturnValue(true);
    await DDBChoiceFeature.buildChoiceFeatures(companionParent);
    expect(Object.keys(companionParent.data.system.activities)).toEqual([parentSummon._id, attack._id]);
    expect(companionParent.data.system.activities[parentSummon._id]).toMatchObject({
      bonuses: { ac: "@abilities.cha.mod" },
      match: { proficiency: true },
      profiles: [{ name: "Vestige Companion (Celestial)", uuid: "Actor.vestige" }],
    });
    expect(companionParent.data.system.activities[parentSummon._id].profiles).toHaveLength(1);

    // without the getter the parent's activities win outright, as before
    const control = makeParentFeature();
    control.data.system.activities = { [primary._id]: primary };
    await DDBChoiceFeature.buildChoiceFeatures(control);
    expect(Object.keys(control.data.system.activities)).toEqual([primary._id]);
    vi.mocked(DDBChoiceFeature.prototype.build).mockRestore();
  });

  it("builds the children for the same parent with a default enricher", async () => {
    // control for the case above: the suppression must come from the enricher,
    // not from anything else about this feature
    const parent = makeParentFeature();
    expect(parent.enricher.noChoiceBuild).toBe(false);

    const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
    expect(features.map((f: any) => f.name)).toEqual([
      "Test Feature: Option A",
      "Test Feature: Option B",
    ]);
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

  // DDB models builder on/off toggles (Bladesong, Elemental Attunement, ...) as a
  // choice whose whole option pool is one "Activate X"/"Invoke the X" entry; the
  // merge would only rename the parent to "X: Activate X", so it is suppressed.
  describe("single toggle choices", () => {
    it("suppresses a lone chosen 'Activate' option", async () => {
      const parent = makeParentFeature({
        options: [{ id: 101, label: "Activate Test Feature", description: "<p>Toggle text.</p>" }],
        chosenId: 101,
      });
      const features = await DDBChoiceFeature.buildChoiceFeatures(parent);
      expect(features).toEqual([]);
      expect(parent.data.name).toBe("Test Feature");
      expect(parent.data.flags.ddbimporter.dndbeyond?.choice).toBeUndefined();
    });

    it("suppresses a lone chosen 'Invoke the' option", async () => {
      const parent = makeParentFeature({
        options: [{ id: 101, label: "Invoke the Test Feature", description: "<p>Toggle text.</p>" }],
        chosenId: 101,
      });
      const features = await DDBChoiceFeature.buildChoiceFeatures(parent);
      expect(features).toEqual([]);
      expect(parent.data.name).toBe("Test Feature");
    });

    it("suppresses the toggle in allFeatures mode too", async () => {
      const parent = makeParentFeature({
        options: [{ id: 101, label: "Activate Test Feature", description: "<p>Toggle text.</p>" }],
        chosenId: 101,
      });
      const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
      expect(features).toEqual([]);
      expect(parent.data.name).toBe("Test Feature");
    });

    it("still merges a lone option without a toggle prefix", async () => {
      // pins Counterspell / "Bough and Branch: Shield" style single-option pools
      const parent = makeParentFeature({
        options: [{ id: 101, label: "Shield", description: "<p>Shield text.</p>" }],
        chosenId: 101,
      });
      const features = await DDBChoiceFeature.buildChoiceFeatures(parent);
      expect(features).toEqual([]);
      expect(parent.data.name).toBe("Test Feature: Shield");
      expect(parent.data.flags.ddbimporter.dndbeyond.choice).toMatchObject({
        parentName: "Test Feature",
        label: "Shield",
      });
    });

    it("builds normally when an 'Activate' option sits in a larger pool", async () => {
      // the rule requires the toggle to be the entire option pool
      const parent = makeParentFeature({
        options: [
          { id: 101, label: "Activate Something", description: "<p>A.</p>" },
          { id: 102, label: "Option B", description: "<p>B.</p>" },
        ],
        chosenId: 101,
      });
      const features = await DDBChoiceFeature.buildChoiceFeatures(parent, true);
      expect(features.map((f: any) => f.name)).toEqual([
        "Test Feature: Activate Something",
        "Test Feature: Option B",
      ]);
    });

    it("keeps building a lone 'Activate' option for KEEP_CHOICE_FEATURE features", async () => {
      const parent = makeParentFeature({
        featureName: "Genie's Vessel",
        options: [{ id: 101, label: "Activate Genie's Vessel", description: "<p>Vessel text.</p>" }],
        chosenId: 101,
      });
      const features = await DDBChoiceFeature.buildChoiceFeatures(parent);
      expect(features.map((f: any) => f.name)).toEqual(["Genie's Vessel: Activate Genie's Vessel"]);
      expect(parent.data.name).toBe("Genie's Vessel");
    });
  });
});

// DDB ships the parent "Blood Curses" feature with every curse in its description;
// REPLACE_DESCRIPTION_WITH_CHOICES swaps that for the chosen options' own text.
describe("DDBFeature._buildChoiceFeature REPLACE_DESCRIPTION_WITH_CHOICES", () => {
  const CURSE_BLOB = "<p>Blood Curse of Exposure. Blood Curse of Binding. Blood Curse of Bloated Agony.</p>";

  function makeCurseParent(dataOptions: IChoiceDataOptions = {}) {
    return makeParentFeature({
      featureName: "Blood Curses",
      featureDescription: CURSE_BLOB,
      options: [
        { id: 101, label: "Blood Curse of Exposure", description: "<p>Exposure text.</p>" },
        { id: 102, label: "Blood Curse of Binding", description: "<p>Binding text.</p>" },
      ],
      ...dataOptions,
    });
  }

  it("replaces the full DDB option dump with the chosen option descriptions", async () => {
    const parent = makeCurseParent();
    await parent.loadEnricher();
    await parent.build();

    const description = parent.data.system.description.value;
    expect(description).not.toContain("Bloated Agony");
    expect(description).toContain("<strong>Blood Curse of Exposure</strong>");
    expect(description).toContain("Exposure text.");
    // only the chosen curse, and no appended secret block on top of it
    expect(description).not.toContain("Binding text.");
    expect(description).not.toContain("<section class=\"secret\">");
    expect(parent.descriptionOverride).toContain("Exposure text.");
  });

  it("keeps the DDB description when nothing usable is chosen", async () => {
    // skill labels are filtered out of the choice text, leaving nothing to swap in
    const parent = makeCurseParent({
      options: [
        { id: 101, label: "Acrobatics", description: "" },
        { id: 102, label: "Athletics", description: "" },
      ],
    });
    await parent.loadEnricher();
    await parent.build();

    expect(parent.descriptionOverride).toBeNull();
    expect(parent.data.system.description.value).toContain("Bloated Agony");
  });

  it("leaves features outside the list on the existing secret-block behaviour", async () => {
    // a short option text that only repeats its label is dropped as slight, so give it substance
    const parent = makeParentFeature({
      featureDescription: "<p>A test feature.</p>",
      options: [{ id: 101, label: "Option A", description: "<p>You gain a burrowing speed.</p>" }],
    });
    await parent.loadEnricher();
    await parent.build();

    const description = parent.data.system.description.value;
    expect(parent.descriptionOverride).toBeNull();
    expect(description).toContain("A test feature.");
    expect(description).toContain("<section class=\"secret\">");
  });

  it("appends a single toggle option's text without a secret wrapper", async () => {
    // matches the NO_CHOICE_BUILD behaviour the toggle rule replaces
    const parent = makeParentFeature({
      featureDescription: "<p>A test feature.</p>",
      options: [{ id: 101, label: "Activate Test Feature", description: "<p>Unique toggle text.</p>" }],
      chosenId: 101,
    });
    await parent.loadEnricher();
    await parent.build();

    const description = parent.data.system.description.value;
    expect(description).toContain("A test feature.");
    expect(description).toContain("Unique toggle text.");
    expect(description).not.toContain("<section class=\"secret\">");
  });
});

describe("DDBFeature._isCompanionFeatureOption", () => {
  const check = (originalName: string, description: string) => {
    const stub = { originalName, ddbDefinition: { description } } as any;
    return { result: DDBFeature.prototype._isCompanionFeatureOption.call(stub), stub };
  };

  it("treats the Ranger's Primal Companion, which names the beast forms, as a companion", () => {
    const { result, stub } = check("Primal Companion", "<p>Choose its stat block: Beast of the Land, Beast of the Sea, or Beast of the Sky.</p>");
    expect(result).toBe(true);
    expect(stub.companionFeatureOption).toEqual({ parentFeature: "Primal Companion", childName: "Beast of the Land" });
  });

  it("leaves a same-named feature with other options alone", () => {
    // Grim Hollow's Path of the Primal Spirit: options Primal Guardian and Primal Striker
    expect(check("Primal Companion", "<p>Choose Primal Guardian or Primal Striker.</p>").result).toBe(false);
  });

  it("still recognises a named companion option", () => {
    expect(check("Primal Companion: Beast of the Sea", "").result).toBe(true);
  });
});
