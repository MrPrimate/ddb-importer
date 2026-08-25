// _activityBehaviorNaming gives every ddbMacro region behavior a name once all the
// sibling activities its `activity` id might point at exist. The native behavior
// types are named by BehaviorHelper at build time instead.

// CharacterFeatureFactory must load first, it initialises the activity/feature class chain
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBActivityFactoryMixin from "../../../src/parser/activities/mixins/DDBActivityFactoryMixin";

function nameBehaviors(activities: Record<string, any>): Record<string, any> {
  const data = { system: { activities } };
  (DDBActivityFactoryMixin.prototype as any)._activityBehaviorNaming.call({ data });
  return activities;
}

function macroBehavior({ activity = "", args = {}, name = "" } = {}): any {
  return { _id: "abc", name, type: "ddbMacro", config: { function: "useActivity", events: ["tokenEnter"], activity, args } };
}

describe("_activityBehaviorNaming", () => {
  it("names a behavior after the sibling activity its id points at", () => {
    const activities = nameBehaviors({
      ddbMoonbeamSpSav: { name: "Cast", behaviors: [macroBehavior({ activity: "ddbMoonbeamZone1" })] },
      ddbMoonbeamZone1: { name: "Ongoing Save", behaviors: [] },
    });
    expect(activities.ddbMoonbeamSpSav.behaviors[0].name).toBe("Ongoing Save");
  });

  it("falls back to the activity name in args when no id was given", () => {
    const activities = nameBehaviors({
      cast: { name: "Cast", behaviors: [macroBehavior({ args: { activityName: "Damage" } })] },
    });
    expect(activities.cast.behaviors[0].name).toBe("Damage");
  });

  it("falls back to the activity the behavior hangs off", () => {
    const activities = nameBehaviors({ cast: { name: "Cast and Save", behaviors: [macroBehavior()] } });
    expect(activities.cast.behaviors[0].name).toBe("Cast and Save");
  });

  it("leaves an existing name and the native behavior types alone", () => {
    const activities = nameBehaviors({
      cast: {
        name: "Cast",
        behaviors: [
          macroBehavior({ activity: "zone", name: "Sear" }),
          { _id: "def", name: "", type: "difficultTerrain", config: { types: ["plants"] } },
        ],
      },
      zone: { name: "Ongoing Save", behaviors: [] },
    });
    expect(activities.cast.behaviors[0].name).toBe("Sear");
    expect(activities.cast.behaviors[1].name).toBe("");
  });

  it("is a no-op for documents with no activities", () => {
    expect(() => (DDBActivityFactoryMixin.prototype as any)._activityBehaviorNaming.call({ data: {} })).not.toThrow();
  });
});
