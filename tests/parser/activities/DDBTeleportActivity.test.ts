// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBBasicActivity from "../../../src/parser/activities/DDBBasicActivity";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

function makeFactory(documentType = "feat"): any {
  return Object.assign(Object.create(DDBActivityFactoryMixin.prototype), {
    activityGenerator: DDBBasicActivity,
    activityTypes: [],
    data: {
      name: "Test Teleport",
      system: {
        description: { value: "" },
      },
    },
    documentType,
    isAction: false,
    type: "feature",
  });
}

describe("DDBActivityFactoryMixin teleport activities", () => {
  it("dispatches teleport through the native activity factory with a stable id prefix", () => {
    const factory = makeFactory();
    const activity = factory.getActivity({
      typeOverride: "teleport",
      name: "Teleport",
      nameIdPostfix: "test",
    }, {
      generateConsumption: false,
      generateDuration: false,
      generateEffects: false,
      generateTarget: false,
      rangeOverride: {
        value: "30",
        units: "ft",
        special: "",
      },
    });

    expect(activity).toBeDefined();
    expect(activity.data).toMatchObject({
      _id: expect.stringMatching(/^teleport/),
      type: "teleport",
      range: {
        override: true,
        value: "30",
        units: "ft",
      },
      teleport: {
        override: false,
        value: "",
        units: "ft",
      },
    });
    expect(factory.activityTypes).toEqual(["teleport"]);
    expect(activity.data).not.toHaveProperty("attack");
    expect(activity.data).not.toHaveProperty("damage");
    expect(activity.data).not.toHaveProperty("roll");
    expect(activity.data).not.toHaveProperty("save");
  });

  it("keeps custom native teleport data on the existing data-merge path", () => {
    const factory = makeFactory("spell");
    const activity = factory.getActivity({ typeOverride: "teleport", name: "Custom Teleport" }, {
      data: {
        teleport: {
          override: true,
          value: "120",
          units: "ft",
        },
      },
      generateConsumption: false,
      generateDuration: false,
      generateEffects: false,
      generateRange: false,
      generateTarget: false,
    });

    expect(activity.data.teleport).toEqual({
      override: true,
      value: "120",
      units: "ft",
    });
  });
});
