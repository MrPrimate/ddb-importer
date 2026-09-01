// Ownership of effect-owned modifiers granted by the child options of a feature whose choice
// children are never built (DDBFeatureMixin._suppressedChoiceModifiers). Without the rule those
// modifiers reach no document at all, because the option's component ids differ from the parent's.
// Order of the Lycan is both the shape it was written for and the opt-out case: the three Improved
// Predatory Strikes options hang off Stalker's Prowess (NO_CHOICE_BUILD), but their bonus is hybrid
// form only, so the StalkersProwess enricher refuses the carry and Hybrid Transformation bands it
// onto the Predatory Strike activities instead.

// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBFeature from "../../../src/parser/features/DDBFeature";
import DDBFeatureMixin from "../../../src/parser/features/DDBFeatureMixin";
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

// ids from the Order of the Lycan fixture
const FEATURE_ID = 1670004;
const FEATURE_ENTITY_TYPE_ID = 12168134;
const OPTION_ENTITY_TYPE_ID = 258900837;
const OPTION_IDS = [718170, 718195, 718196];

interface IOptionSpec {
  id: number;
  name?: string;
  modifier?: Record<string, any>;
}

const unarmedBonus = (optionId: number, extra: Record<string, any> = {}): any => ({
  type: "bonus",
  subType: "unarmed-attacks",
  value: 1,
  fixedValue: 1,
  isGranted: true,
  restriction: "",
  statId: null,
  dice: null,
  bonusTypes: [],
  modifierTypeId: null,
  componentId: optionId,
  componentTypeId: OPTION_ENTITY_TYPE_ID,
  ...extra,
});

/** The feature's own DDB modifier, owned directly rather than borrowed from an option. */
const speedBonus = (): any => ({
  type: "bonus",
  subType: "speed",
  value: 10,
  fixedValue: 10,
  isGranted: true,
  restriction: "",
  statId: null,
  dice: null,
  bonusTypes: [],
  modifierTypeId: null,
  componentId: FEATURE_ID,
  componentTypeId: FEATURE_ENTITY_TYPE_ID,
});

interface IDataSpec {
  featureName: string;
  options: IOptionSpec[];
  className?: string;
  ownModifiers?: any[];
}

/**
 * ddbData with one class whose class feature FEATURE_ID (named `featureName`) has the given
 * options hanging off it; each option's modifier lands in character.modifiers.class exactly as
 * DDB ships it (componentId = the option's own definition id).
 */
function makeDdbData({ featureName, options, className, ownModifiers = [] }: IDataSpec): any {
  const feature = makeDdbFeature({ id: FEATURE_ID, name: featureName, requiredLevel: 7 });
  const klass = makeDdbClass({
    level: 20,
    classFeatures: [feature],
    ...(className ? { definition: { name: className } } : {}),
  });
  return makeDdbCharacterData({
    character: {
      classes: [klass],
      inventory: [],
      options: {
        class: options.map((o) => ({
          componentId: FEATURE_ID,
          componentTypeId: FEATURE_ENTITY_TYPE_ID,
          definition: { id: o.id, entityTypeId: OPTION_ENTITY_TYPE_ID, name: o.name ?? `Option ${o.id}` },
        })),
        race: [],
        feat: [],
      },
      modifiers: {
        class: [...ownModifiers, ...options.map((o) => o.modifier ?? unarmedBonus(o.id))],
        race: [], background: [], item: [], feat: [], condition: [],
      },
    },
  });
}

function makeParentFeature(spec: IDataSpec): any {
  const ddbData = makeDdbData(spec);
  return new DDBFeature({
    ddbData,
    ddbDefinition: ddbData.character.classes[0].classFeatures[0],
    type: "class",
    rawCharacter: makeRawCharacter(),
    // the class enricher resolves by class name; without one only the generic path is reachable
    ...(spec.className ? { extraFlags: { ddbimporter: { class: spec.className } } } : {}),
  } as any);
}

const lycanOptions = (): IOptionSpec[] => OPTION_IDS.map((id) => ({ id, name: "Improved Predatory Strikes" }));

const ownedModifiers = (feature: any): any[] => feature._getFeatModifierItem(undefined, "class").definition.grantedModifiers;

describe("DDBFeatureMixin suppressed choice modifier ownership", () => {
  it("carries the unarmed attack bonuses of a NO_CHOICE_BUILD parent's options onto the parent", () => {
    const parent = makeParentFeature({ featureName: "Stalker's Prowess", options: lycanOptions() });
    expect(parent.suppressesChoiceBuild).toBe(true);

    const owned = ownedModifiers(parent);
    expect(owned.map((m: any) => m.componentId).sort()).toEqual([...OPTION_IDS].sort());
    expect(new Set(owned).size).toBe(owned.length);
  });

  it("does not use the exception for a parent that builds its children", () => {
    // the option modifiers reach the child documents through the ordinary choice match instead
    const parent = makeParentFeature({ featureName: "Test Feature", options: lycanOptions() });
    expect(parent.suppressesChoiceBuild).toBe(false);
    expect(ownedModifiers(parent)).toEqual([]);
  });

  it("uses the same predicate as the choice builder, so an enricher noChoiceBuild parent is carried too", () => {
    const parent = makeParentFeature({ featureName: "Test Feature", options: lycanOptions() });
    vi.spyOn(parent.enricher, "noChoiceBuild", "get").mockReturnValue(true);
    expect(parent.suppressesChoiceBuild).toBe(true);
    expect(ownedModifiers(parent)).toHaveLength(3);
  });

  it("refuses the carry when the parent's enricher automates its own options", () => {
    // Stalker's Prowess opts out this way: Improved Predatory Strikes is hybrid form only, so the
    // bonus is banded onto the Hybrid Transformation strikes instead
    const parent = makeParentFeature({ featureName: "Stalker's Prowess", options: lycanOptions() });
    vi.spyOn(parent.enricher, "noSuppressedChoiceModifiers", "get").mockReturnValue(true);
    expect(parent.suppressesChoiceBuild).toBe(true);
    expect(ownedModifiers(parent)).toEqual([]);
  });

  it("keeps the modifiers DDB grants the parent directly when the carry is refused", () => {
    const parent = makeParentFeature({
      featureName: "Stalker's Prowess",
      options: lycanOptions(),
      ownModifiers: [speedBonus()],
    });
    vi.spyOn(parent.enricher, "noSuppressedChoiceModifiers", "get").mockReturnValue(true);
    expect(ownedModifiers(parent).map((m: any) => m.subType)).toEqual(["speed"]);
  });

  it("ignores option modifiers outside SUPPRESSED_CHOICE_EFFECT_MODIFIERS", () => {
    // Charger is NO_CHOICE_BUILD as well; only the listed subtypes may cross the boundary,
    // because many suppressed parents have enrichers that already automate their options
    expect(DDBFeatureMixin.SUPPRESSED_CHOICE_EFFECT_MODIFIERS).toEqual([{ type: "bonus", subType: "unarmed-attacks" }]);
    const parent = makeParentFeature({
      featureName: "Charger",
      options: [{ id: 5001, modifier: unarmedBonus(5001, { type: "bonus", subType: "melee-attacks" }) }],
    });
    expect(parent.suppressesChoiceBuild).toBe(true);
    expect(ownedModifiers(parent)).toEqual([]);
  });

  it("leaves a restricted modifier for a reviewed condition", () => {
    const parent = makeParentFeature({
      featureName: "Stalker's Prowess",
      options: [{ id: 718170, modifier: unarmedBonus(718170, { restriction: "while in hybrid form" }) }],
    });
    expect(ownedModifiers(parent)).toEqual([]);
  });

  it("only matches options whose parent is this feature", () => {
    const ddbData = makeDdbData({ featureName: "Stalker's Prowess", options: lycanOptions() });
    // re-parent one option to a different feature id; its modifier must not be picked up
    ddbData.character.options.class[0].componentId = 999999;
    const parent = new DDBFeature({
      ddbData,
      ddbDefinition: ddbData.character.classes[0].classFeatures[0],
      type: "class",
      rawCharacter: makeRawCharacter(),
    } as any);
    expect(ownedModifiers(parent).map((m: any) => m.componentId).sort()).toEqual([718195, 718196]);
  });
});

describe("DDBFeature build with suppressed choice modifiers", () => {
  // build() swallows errors via try/catch and logs them; rethrow from the logger
  // so a broken pipeline fails these tests loudly.
  beforeEach(async () => {
    const { logger } = await import("../../../src/lib/_module");
    vi.spyOn(logger as any, "error").mockImplementation((...args: any[]) => {
      throw args[1] instanceof Error ? args[1] : new Error(JSON.stringify(args));
    });
  });

  // the fixture class is "Testclass", so no class enricher resolves here and this pins the
  // generic mechanism rather than the Blood Hunter outcome
  it("emits one cumulative unarmed attack rule on a carrying parent's transfer effect", async () => {
    const parent = makeParentFeature({ featureName: "Stalker's Prowess", options: lycanOptions() });
    await parent.loadEnricher();
    await parent.build();

    const rules = (parent.data.effects as any[])
      .flatMap((effect) => (effect.system?.changes ?? []).map((change: any) => ({ effect, change })))
      .filter(({ change }) => change.key === "attack" && change.type === "dnd5e.bonus");
    expect(rules).toHaveLength(1);
    const [{ effect, change }] = rules;
    expect(effect.transfer).toBe(true);
    expect(change.value).toBe("1 + 1 + 1");
    expect(change.priority).toBe(20);
    // the gate is on the change, evaluated against the attack actually rolled; an effect-level
    // condition would suppress the whole effect at data prep
    expect(JSON.parse(change.conditions)).toEqual({ k: "roll.attack.classification", o: "in", v: ["unarmed", "natural"] });
    expect(effect.system?.conditions ?? "").toBeFalsy();
  });

  it("gives the real Blood Hunter Stalker's Prowess no attack rule, keeping its speed bonus", async () => {
    const parent = makeParentFeature({
      featureName: "Stalker's Prowess",
      className: "Blood Hunter",
      options: lycanOptions(),
      ownModifiers: [speedBonus()],
    });
    await parent.loadEnricher();
    expect(parent.enricher.loadedEnricher?.constructor?.name).toBe("StalkersProwess");
    await parent.build();

    const changes = (parent.data.effects as any[]).flatMap((effect) => effect.system?.changes ?? []);
    expect(changes.filter((change: any) => change.key === "attack" && change.type === "dnd5e.bonus")).toEqual([]);
    expect(changes.filter((change: any) => String(change.key).includes("movement")).length).toBeGreaterThan(0);
    expect(parent.data.system.description.value).toContain("Improved Predatory Strikes attack bonus");
  });
});
