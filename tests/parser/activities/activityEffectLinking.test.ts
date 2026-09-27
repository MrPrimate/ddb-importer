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

const ids = (activity: any) => activity.effects.map((e: any) => e._id);

describe("DDBActivityFactoryMixin._activityEffectLinking by activity type", () => {
  const typed = (_id: string, ddbimporter: Record<string, unknown>) => ({ _id, name: _id, transfer: false, flags: { ddbimporter } });

  it("links every activity of the first preferred type present", () => {
    const data = link({
      activities: {
        hit: { name: "Attack", type: "attack", effects: [] },
        save: { name: "Save", type: "save", effects: [] },
        save2: { name: "Other Save", type: "save", effects: [] },
      },
      effects: [typed("woundTracker0000", { activityTypesMatch: ["save", "attack"] })],
    });

    expect(ids(data.system.activities.hit)).toEqual([]);
    expect(ids(data.system.activities.save)).toEqual(["woundTracker0000"]);
    expect(ids(data.system.activities.save2)).toEqual(["woundTracker0000"]);
  });

  it("falls back to the next type when the first is absent", () => {
    const data = link({
      activities: { hit: { name: "Attack", type: "attack", effects: [] } },
      effects: [typed("woundTracker0000", { activityTypesMatch: ["save", "attack"] })],
    });

    expect(ids(data.system.activities.hit)).toEqual(["woundTracker0000"]);
  });

  it("does not resolve a type from noeffect, excluded or already-linked activities", () => {
    const data = link({
      activities: {
        extra: { name: "Tick", type: "save", effects: [], flags: { ddbimporter: { noeffect: true } } },
        second: { _id: "ddbSecondSave001", name: "Second Save", type: "save", effects: [] },
        linked: { name: "Linked", type: "save", effects: [{ _id: "other" }] },
        hit: { name: "Attack", type: "attack", effects: [] },
      },
      effects: [typed("firstFailure0000", { activityTypesMatch: ["save", "attack"], activityIdsExclude: ["ddbSecondSave001"] })],
    });

    expect(ids(data.system.activities.extra)).toEqual([]);
    expect(ids(data.system.activities.second)).toEqual([]);
    expect(ids(data.system.activities.linked)).toEqual(["other"]);
    expect(ids(data.system.activities.hit)).toEqual(["firstFailure0000"]);
  });

  it("links nothing when no listed type is present", () => {
    const data = link({
      activities: { util: { name: "Use", type: "utility", effects: [] } },
      effects: [typed("woundTracker0000", { activityTypesMatch: ["save"] })],
    });

    expect(ids(data.system.activities.util)).toEqual([]);
  });

  it("requires a name match too when both are set", () => {
    const data = link({
      activities: {
        a: { name: "Bite", type: "attack", effects: [] },
        b: { name: "Claw", type: "attack", effects: [] },
        s: { name: "Claw", type: "save", effects: [] },
      },
      effects: [typed("clawEffect000000", { activityMatch: "Claw", activityTypesMatch: ["attack"] })],
    });

    expect(ids(data.system.activities.a)).toEqual([]);
    expect(ids(data.system.activities.b)).toEqual(["clawEffect000000"]);
    expect(ids(data.system.activities.s)).toEqual([]);
  });

  it("assigns a missing effect id and keeps the level", () => {
    const tracker: any = typed("", { activityTypesMatch: ["save"], effectIdLevel: { min: 5, max: null } });
    delete tracker._id;
    const data = link({ activities: { save: { name: "Save", type: "save", effects: [] } }, effects: [tracker] });

    const [linked] = data.system.activities.save.effects;
    expect(tracker._id).toEqual(expect.any(String));
    expect(linked).toMatchObject({ _id: tracker._id, level: { min: 5, max: null } });
  });
});
