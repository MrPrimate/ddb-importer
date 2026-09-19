// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";

function link({ activities, effects }: { activities: Record<string, any>; effects: any[] }) {
  const parser = Object.create(DDBActivityFactoryMixin.prototype);
  Object.assign(parser, {
    name: "Test Feature",
    data: { system: { activities }, effects, flags: {} },
  });
  parser._activityEffectLinking();
  return parser.data;
}

function effect(_id: string, { activityMatch, transfer = false }: { activityMatch?: string; transfer?: boolean } = {}) {
  return {
    _id,
    name: _id,
    transfer,
    flags: { ddbimporter: activityMatch ? { activityMatch } : {} },
  };
}

const ids = (activity: any) => activity.effects.map((e: any) => e._id);

describe("DDBActivityFactoryMixin._activityEffectLinking form-mode transforms", () => {
  it("offers only the effects that name the transform, in document order", () => {
    const data = link({
      activities: {
        form: { name: "Change Form", type: "transform", transform: { mode: "form" }, effects: [] },
        other: { name: "Howl", type: "utility", effects: [] },
      },
      effects: [
        effect("unmatchedEffect0"),
        effect("formEffectAlpha0", { activityMatch: "Change Form" }),
        effect("formEffectBeta00", { activityMatch: "Change Form" }),
      ],
    });

    expect(ids(data.system.activities.form)).toEqual(["formEffectAlpha0", "formEffectBeta00"]);
    expect(ids(data.system.activities.other)).toEqual(["unmatchedEffect0"]);
  });

  it("still links unmatched effects to a transform that replaces the actor", () => {
    const data = link({
      activities: {
        shape: { name: "Wild Shape", type: "transform", transform: { mode: "cr" }, effects: [] },
      },
      effects: [effect("unmatchedEffect0")],
    });

    expect(ids(data.system.activities.shape)).toEqual(["unmatchedEffect0"]);
  });

  it("never offers a transferred effect as a form, even one that names the transform", () => {
    const data = link({
      activities: {
        form: { name: "Change Form", type: "transform", transform: { mode: "form" }, effects: [] },
      },
      effects: [
        effect("trueFormEffect00", { activityMatch: "Change Form", transfer: true }),
        effect("formEffectAlpha0", { activityMatch: "Change Form" }),
      ],
    });

    expect(ids(data.system.activities.form)).toEqual(["formEffectAlpha0"]);
  });
});
