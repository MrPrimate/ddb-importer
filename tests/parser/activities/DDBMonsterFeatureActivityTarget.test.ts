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

describe("monster attack type", () => {
  // A "Melee or Ranged" weapon left at "ranged" made AC5e treat every swing as a ranged attack
  // in melee; Default lets dnd5e pick melee, and ranged from the Thrown attack mode.
  function attackType(parent: Record<string, any>): string | undefined {
    const activity = Object.create(DDBMonsterFeatureActivity.prototype) as DDBMonsterFeatureActivity;
    Object.assign(activity, {
      data: {},
      actionData: {},
      ddbParent: { name: "Light Hammer", spellAttack: false, templateType: "weapon", ...parent },
    });
    activity._generateAttack();
    return activity.data.attack?.type?.value;
  }

  it("leaves a melee or ranged weapon at the default type", () => {
    expect(attackType({ meleeAttack: true, rangedAttack: true })).toBe("");
  });

  it("keeps single-range weapons explicit", () => {
    expect(attackType({ meleeAttack: true, rangedAttack: false })).toBe("melee");
    expect(attackType({ meleeAttack: false, rangedAttack: true })).toBe("ranged");
  });

  it("keeps melee or ranged feats ranged", () => {
    expect(attackType({ templateType: "feat", meleeAttack: true, rangedAttack: true })).toBe("ranged");
  });
});
