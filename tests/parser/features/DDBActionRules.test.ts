// @vitest-environment jsdom
/**
 * A DDB action carries no classId/className of its own, so the ruleset version
 * has to come from the class feature it hangs off. Without that, a legacy
 * subclass served under the 2024 rules (DDB names it "Path of the Beast
 * (TCoE)") produced actions stamped 2014 from their source book while the
 * feature documents beside them were 2024 - which, among other things, sent
 * the generated natural weapons to the compendium root.
 */
// CharacterFeatureFactory must load first, it initialises the feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBAction from "../../../src/parser/features/DDBAction";
import DDBAttackAction from "../../../src/parser/features/DDBAttackAction";
import { makeDdbAction, makeDdbCharacterData, makeDdbClass, makeDdbFeature, makeRawCharacter } from "../../_fixtures/ddb/factories";

// real source ids from the shipped fallback config: PHB (2), TCoE (67), PHB-2024 (145)
const PHB_2014 = { sourceId: 2, sourceType: 1, pageNumber: null };
const PHB_2024 = { sourceId: 145, sourceType: 1, pageNumber: null };
const TCOE = { sourceId: 67, sourceType: 1, pageNumber: null };

const PARENT_FEATURE_ID = 10292446;

function makeData({ classSources, subclassName }: { classSources: any[]; subclassName: string }) {
  const parentFeature = makeDdbFeature({
    id: PARENT_FEATURE_ID,
    name: "Form of the Beast",
    sources: [TCOE],
    classId: 2190897,
    requiredLevel: 3,
  });

  const klass = makeDdbClass({
    definition: { id: 2190897 - 1, name: "Barbarian", sources: classSources, classFeatures: [] },
    subclassDefinition: { id: 2190897, name: subclassName, sources: [TCOE], classFeatures: [] },
    classFeatures: [parentFeature],
  });

  return makeDdbCharacterData({ character: { classes: [klass] } });
}

function buildAction(ActionClass: typeof DDBAction, ddbData: any) {
  return new ActionClass({
    ddbData,
    // the action itself has no class information, only the parent componentId
    ddbDefinition: makeDdbAction({
      name: "Form of the Beast: Claws",
      componentId: PARENT_FEATURE_ID,
      componentTypeId: 12168134,
      sources: null,
      displayAsAttack: true,
    }),
    rawCharacter: makeRawCharacter(),
    type: "class",
    documentType: "weapon",
  } as any);
}

describe.each([
  ["DDBAction", DDBAction],
  ["DDBAttackAction", DDBAttackAction],
])("%s ruleset version", (_name, ActionClass) => {
  it("follows the 2024 class for a legacy book subclass", () => {
    const ddbData = makeData({ classSources: [PHB_2024], subclassName: "Path of the Beast (TCoE)" });
    const action = buildAction(ActionClass as typeof DDBAction, ddbData);

    expect(action.data.system.source?.rules).toBe("2024");
    expect(action.data.flags.ddbimporter?.is2014).toBe(false);
  });

  it("stays 2014 for the 2014 class", () => {
    const ddbData = makeData({ classSources: [PHB_2014], subclassName: "Path of the Beast" });
    const action = buildAction(ActionClass as typeof DDBAction, ddbData);

    expect(action.data.system.source?.rules).toBe("2014");
    expect(action.data.flags.ddbimporter?.is2014).toBe(true);
  });

  it("falls back to the source book when no parent class feature is found", () => {
    const ddbData = makeDdbCharacterData({ character: { classes: [] } });
    const action = buildAction(ActionClass as typeof DDBAction, ddbData);

    expect(action.data.system.source?.rules).toBe("2014");
  });
});
