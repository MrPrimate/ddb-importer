// A monster feature derives ONE target from its whole description and every activity of the
// feature reads it. An eye ray table's Disintegration Ray would otherwise put its "10-foot cube"
// on every ray, and an enricher blanking one activity's template would blank its siblings.

// CharacterFeatureFactory must load first, it initialises the activity/feature class chain.
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBMonsterFeatureActivity from "../../../src/parser/activities/DDBMonsterFeatureActivity";

function makeActivity(): any {
  return Object.assign(Object.create(DDBMonsterFeatureActivity.prototype), {
    name: "Eye Rays",
    data: {},
    actionData: {
      target: {
        template: { count: "", contiguous: false, type: "cube", size: "10", width: "", height: "", units: "ft" },
        affects: { count: "", type: "creature", choice: false, special: "" },
        prompt: true,
        override: false,
      },
    },
  });
}

describe("DDBMonsterFeatureActivity._generateTarget", () => {
  it("copies the feature target rather than sharing it", () => {
    const activity = makeActivity();
    activity._generateTarget();

    expect(activity.data.target).toEqual(activity.actionData.target);
    expect(activity.data.target).not.toBe(activity.actionData.target);
    // an enricher override blanking this activity's template must not reach the feature
    activity.data.target.template.type = "";
    expect(activity.actionData.target.template.type).toBe("cube");
  });

  it("takes a per-section target override over the feature target", () => {
    const activity = makeActivity();
    const override = {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    };
    activity._generateTarget({ targetOverride: override });

    expect(activity.data.target).toEqual(override);
    expect(activity.data.target).not.toBe(override);
  });
});

describe("monster mode activation", () => {
  it("isolates mode conditions and honors the complete activation override", () => {
    const shared: I5eActivityActivation = { type: "action", value: 1, condition: "" };
    const normal = Object.create(DDBMonsterFeatureActivity.prototype) as DDBMonsterFeatureActivity;
    const variant = Object.create(DDBMonsterFeatureActivity.prototype) as DDBMonsterFeatureActivity;
    Object.assign(normal, { data: {}, actionData: { activation: shared } });
    Object.assign(variant, { data: {}, actionData: { activation: shared } });
    normal._generateActivation();
    variant._generateActivation({ activationCondition: "The attack had Advantage" });
    expect(normal.data.activation?.condition).toBe("");
    expect(shared.condition).toBe("");
    expect(variant.data.activation?.condition).toBe("The attack had Advantage");
    const override: I5eActivityActivation = { type: "bonus", value: 1, condition: "Original" };
    variant._generateActivation({ activationOverride: override, activationCondition: "New condition" });
    expect(variant.data.activation).toEqual({ type: "bonus", value: 1, condition: "New condition" });
    expect(override.condition).toBe("Original");
  });
});
