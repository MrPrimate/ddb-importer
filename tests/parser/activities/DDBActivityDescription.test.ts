// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBasicActivity from "../../../src/parser/activities/DDBBasicActivity";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

const quietBuild = {
  generateConsumption: false,
  generateDuration: false,
  generateEffects: false,
  generateRange: false,
  generateTarget: false,
};

function makeActivity({
  snippet = "A short DDB snippet.",
  description = "The complete DDB description.",
  isAction = false,
}: {
  snippet?: string | null;
  description?: string;
  isAction?: boolean;
} = {}) {
  const ddbParent: any = {
    ddbData: {
      character: {
        options: { race: [], class: [], feat: [] },
      },
    },
    rawCharacter: {
      type: "character",
      flags: { ddbimporter: { dndbeyond: { templateStrings: [] } } },
    },
    data: {
      name: "Test Feature",
      system: {
        chatFlavor: "Existing chat flavor",
        description: { value: "The imported document description." },
      },
    },
    ddbDefinition: {
      id: 1,
      entityTypeId: 1,
      componentId: 1,
      componentTypeId: 1,
      name: "Test Feature",
      description,
      snippet,
    },
    isAction,
  };
  return new DDBBasicActivity({
    type: "utility",
    name: "Use Feature",
    ddbParent,
  });
}

describe("DDB activity descriptions", () => {
  it.each([
    { snippet: "A {{fixedvalue:7}} point snippet.", isAction: false },
    { snippet: null, isAction: true },
  ])("does not copy parent text into an activity: %j", (options) => {
    const activity = makeActivity(options);
    activity.build(quietBuild);

    expect(activity.data.description?.value).toBeUndefined();
  });

  it("preserves the item's chat flavor", () => {
    const activity = makeActivity();
    activity.build({ ...quietBuild, generateDescription: true });

    expect(activity.data.description).toEqual({
      chatFlavor: "Existing chat flavor",
    });
  });
});
