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

  it("does not use the exception for a parent that builds its children", () => {
    // the option modifiers reach the child documents through the ordinary choice match instead
    const parent = makeParentFeature({ featureName: "Test Feature", options: lycanOptions() });
    expect(parent.suppressesChoiceBuild).toBe(false);
    expect(ownedModifiers(parent)).toEqual([]);
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

  it("leaves a restricted modifier for a reviewed condition", () => {
    const parent = makeParentFeature({
      featureName: "Stalker's Prowess",
      options: [{ id: 718170, modifier: unarmedBonus(718170, { restriction: "while in hybrid form" }) }],
    });
    expect(ownedModifiers(parent)).toEqual([]);
  });

});

