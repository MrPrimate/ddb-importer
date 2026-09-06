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
      name: "Test D20 Activity",
      system: {
        description: { value: "" },
      },
    },
    documentType,
    isAction: false,
    type: "feature",
  });
}

const quietBuild = {
  generateConsumption: false,
  generateDuration: false,
  generateEffects: false,
  generateRange: false,
  generateTarget: false,
};

describe("DDBActivityFactoryMixin check/save activities", () => {
  it("retains native-stub check defaults and a stable id prefix", () => {
    const factory = makeFactory();
    const activity = factory.getActivity({
      typeOverride: "check",
      name: "Test Check",
      nameIdPostfix: "test",
    }, quietBuild);

    expect(activity.data).toMatchObject({
      _id: expect.stringMatching(/^check/),
      type: "check",
      check: {
        bonus: "",
        visible: true,
      },
    });
    expect(factory.activityTypes).toEqual(["check"]);
    expect(activity.data).not.toHaveProperty("attack");
    expect(activity.data).not.toHaveProperty("damage");
    expect(activity.data).not.toHaveProperty("save");
  });

  it("leaves omitted save fields to native schema defaults", () => {
    const factory = makeFactory("spell");
    const activity = factory.getActivity({
      typeOverride: "save",
      name: "Test Save",
      nameIdPostfix: "test",
    }, quietBuild);

    expect(activity.data).toMatchObject({
      _id: expect.stringMatching(/^save/),
      type: "save",
    });
    expect(activity.data.save).not.toHaveProperty("bonus");
    expect(activity.data.save).not.toHaveProperty("visible");
    expect(activity.data.save.dc).not.toHaveProperty("bonus");
  });

  it("preserves check bonus and visibility overrides", () => {
    const factory = makeFactory();
    const activity = factory.getActivity({ typeOverride: "check", name: "Bonus Check" }, {
      ...quietBuild,
      checkOverride: {
        ability: "cha",
        associated: ["itm", "per", "prf"],
        bonus: "1d8",
        dc: { calculation: "", formula: "15" },
        visible: false,
      },
    });

    expect(activity.data.check).toEqual({
      ability: "cha",
      associated: ["itm", "per", "prf"],
      bonus: "1d8",
      dc: { calculation: "", formula: "15" },
      visible: false,
    });
  });

  it("preserves save overrides and lets the existing data merge win", () => {
    const factory = makeFactory("spell");
    const activity = factory.getActivity({ typeOverride: "save", name: "Bonus Save" }, {
      ...quietBuild,
      saveOverride: {
        ability: ["dex"],
        bonus: "@scale.test.die",
        dc: { calculation: "spellcasting", formula: "" },
        visible: false,
      },
      data: {
        save: {
          bonus: "2d4",
          visible: true,
        },
      },
    });

    expect(activity.data.save).toEqual({
      ability: ["dex"],
      bonus: "2d4",
      dc: { calculation: "spellcasting", formula: "" },
      visible: true,
    });
    expect(activity.data.save.dc).not.toHaveProperty("bonus");
  });
});
