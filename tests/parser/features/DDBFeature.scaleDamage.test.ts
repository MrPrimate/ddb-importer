// @vitest-environment jsdom
// Load the feature class chain in production order before importing individual parsers.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import DDBAction from "../../../src/parser/features/DDBAction";
import DDBFeatureActivity from "../../../src/parser/activities/DDBFeatureActivity";
import AdvancementHelper from "../../../src/parser/advancements/AdvancementHelper";
import * as ClassEnrichers from "../../../src/parser/enrichers/class/_module";
import {
  makeDdbAction,
  makeDdbCharacterData,
  makeDdbClass,
  makeDdbDice,
  makeDdbFeature,
  makeEnricherData,
  makeRawCharacter,
} from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs, installDocumentStub } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
  installDocumentStub();
});

const CLASS_ID = 50001;
const SUBCLASS_ID = 50010;
const scales = [3, 5, 11, 17].map((level, index) => ({
  level,
  description: "",
  fixedValue: null,
  dice: makeDdbDice({ diceCount: index + 1, diceString: `${index + 1}d6` }),
}));

function setup({ level = 5, otherLevel = 0, subclass = false, name = "Scaling Strike", noCurrentScale = false,
  noScales = false, missingOwner = false } = {}) {
  const levelScale = noCurrentScale ? null : [...scales].reverse().find((scale) => scale.level <= level) ?? null;
  const source: IDDBClassFeature = makeDdbFeature({
    name,
    classId: subclass ? SUBCLASS_ID : CLASS_ID,
    requiredLevel: 3,
    levelScales: noScales ? [] : scales,
    dice: levelScale?.dice ?? makeDdbDice(),
    damageTypeId: 1,
  }, { levelScale });
  const owner: IDDBClass = makeDdbClass({
    level,
    definition: { id: CLASS_ID, name: "Fighter", classFeatures: [source.definition] },
    subclassDefinition: subclass ? { id: SUBCLASS_ID, name: "Path of the Test", classFeatures: [source.definition] } : null,
    classFeatures: [source],
  });
  // Put the unrelated class first and give it a same-named feature to catch name/order matching.
  const other: IDDBClass = makeDdbClass({
    level: otherLevel,
    definition: { id: 50002, name: "Wizard" },
    classFeatures: [makeDdbFeature({ name, classId: 50002, levelScales: scales })],
  });
  const ddbData: IDDBData = makeDdbCharacterData({ character: {
    classes: [...(otherLevel ? [other] : []), ...(missingOwner ? [] : [owner])],
  } });
  const parser = new DDBFeature({ ddbData, ddbDefinition: source, rawCharacter: makeRawCharacter(), type: "class" });
  return { parser, source, ddbData };
}

describe("class-feature damage scales", () => {
  it.each([3, 4, 5, 6, 10, 11, 12, 16, 17, 18, 20])("keeps a native link when imported at class level %i", (level) => {
    const { parser } = setup({ level });
    expect(parser.useScaleValueLink).toBe(true);
    expect(parser.getDamage()).toMatchObject({
      custom: { enabled: true, formula: "@scale.fighter.scaling-strike" },
      types: ["bludgeoning"],
    });
  });

  it("links even when the wrapper has no captured scale at its current level", () => {
    const { parser } = setup({ level: 2, noCurrentScale: true });
    expect(parser.getDamage().custom?.formula).toBe("@scale.fighter.scaling-strike");
  });

  it.each([false, true])("uses the owning class levels for the emitted advancement (subclass: %s)", (subclass) => {
    const { parser, source } = setup({ level: 4, otherLevel: 13, subclass });
    const advancement = AdvancementHelper.generateScaleValueAdvancement(source.definition);
    expect(advancement).toMatchObject({ configuration: {
      identifier: "scaling-strike",
      type: "dice",
      scale: {
        // this branch writes the legacy { n, die } entry, which dnd5e migrates on updateSource
        3: { n: 1, die: 6 }, 5: { n: 2, die: 6 },
        11: { n: 3, die: 6 }, 17: { n: 4, die: 6 },
      },
    } });
    expect(parser.getDamage().custom?.formula).toBe(`@scale.${subclass ? "test" : "fighter"}.scaling-strike`);
    // Reimporting after either class levels up must keep the same owning scale namespace.
    expect(setup({ level: 4, otherLevel: 14, subclass }).parser.getDamage()).toEqual(parser.getDamage());
    expect(setup({ level: 5, otherLevel: 13, subclass }).parser.getDamage()).toEqual(parser.getDamage());
  });

  it("writes the link into the generated damage activity", () => {
    const { parser } = setup();
    const activity = new DDBFeatureActivity({ type: "damage", name: "Scaling Strike", ddbParent: parser });
    activity._generateDamage();
    expect(activity.data.damage?.parts?.[0].custom).toEqual({ enabled: true, formula: "@scale.fighter.scaling-strike" });
  });

  it("preserves added damage bonuses", () => {
    const { parser } = setup();
    expect(parser.getDamage([" + @mod"]).custom?.formula).toBe("@scale.fighter.scaling-strike + @mod");
  });

  it("honours damage-scale exclusions", () => {
    const { parser } = setup({ name: "Fire Rune" });
    expect(parser.useScaleValueLink).toBe(false);
    expect(parser.getDamage()).toMatchObject({ number: 2, denomination: 6, custom: { enabled: false } });
  });

  it.each([{ noScales: true }, { missingOwner: true }])("retains captured dice when no native link exists: %o", (options) => {
    const { parser } = setup(options);
    expect(parser.getDamage()).toMatchObject({ number: 2, denomination: 6, custom: { enabled: false } });
  });

  it("does not emit the unresolved scale placeholder", () => {
    const { parser } = setup({ noScales: true, noCurrentScale: true });
    expect(parser.useScaleValueLink).toBe(false);
    expect(parser.getDamage()).toMatchObject({ number: 1, denomination: 6, custom: { enabled: false } });
  });

  it("keeps action component lookup working in a multiclass build", () => {
    const { ddbData, source } = setup({ level: 4, otherLevel: 13 });
    const action = new DDBAction({
      ddbData,
      ddbDefinition: makeDdbAction({ componentId: source.definition.id, dice: makeDdbDice() }),
      rawCharacter: makeRawCharacter(),
      type: "class",
    });
    expect(action.getDamage().custom?.formula).toBe("@scale.fighter.scaling-strike");
  });

  it.each([
    [ClassEnrichers.Warlock.ThrillOfTheHunt, "necrotic", null],
    [ClassEnrichers.Rogue.WailsFromTheGrave, "necrotic", "(ceil(@scale.rogue.sneak-attack.number / 2))d@scale.rogue.sneak-attack.faces"],
  ] as const)("%s replaces default scale damage instead of adding a second part", async (Enricher, type, formula) => {
    const { parser } = setup();
    await parser.enricher.load({ ddbParser: parser });
    const activity = new DDBFeatureActivity({ type: "damage", ddbParent: parser });
    activity._generateDamage();
    const hint = makeEnricherData(Enricher).activity;
    await parser.enricher._applyActivityDataOverride(activity.data, hint);
    expect(activity.data.damage?.parts).toHaveLength(1);
    expect(activity.data.damage?.parts?.[0].types).toEqual([type]);
    if (formula) {
      expect(activity.data.damage?.parts?.[0].custom?.formula).toBe(formula);
    } else {
      expect(activity.data.damage?.parts?.[0].bonus).toBe("@scale.the-predator.thrill-of-the-hunt");
    }
  });

  it.each([
    [ClassEnrichers.Druid.HaloOfSpores, "necrotic"],
    [ClassEnrichers.Ranger.FrigidExplorer, "cold"],
    [ClassEnrichers.Ranger.GatheredSwarm, "piercing"],
  ] as const)("%s gives the restored scale damage its rules-defined type", async (Enricher, type) => {
    const { parser } = setup();
    await parser.enricher.load({ ddbParser: parser });
    const activity = new DDBFeatureActivity({ type: "damage", ddbParent: parser });
    activity._generateDamage();
    await parser.enricher._applyActivityDataOverride(activity.data, makeEnricherData(Enricher).activity);
    expect(activity.data.damage?.parts).toHaveLength(1);
    expect(activity.data.damage?.parts?.[0]).toMatchObject({
      types: [type], custom: { enabled: true, formula: "@scale.fighter.scaling-strike" },
    });
  });
});
