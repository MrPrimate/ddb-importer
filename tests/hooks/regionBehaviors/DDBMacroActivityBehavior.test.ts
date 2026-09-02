const getDispositions = vi.hoisted(() => vi.fn());

vi.mock("../../../src/hooks/regionBehaviors/baseActivityBehavior", () => ({
  default: class MockBaseActivityBehavior {
    constructor(data: Record<string, unknown> = {}) {
      Object.assign(this, data);
    }

    getDispositions(target: unknown, options: unknown) {
      return getDispositions(target, options);
    }
  },
}));

import DDBMacroActivityBehavior from "../../../src/hooks/regionBehaviors/DDBMacroActivityBehavior";

describe("DDBMacroActivityBehavior.createBehaviorData", () => {
  beforeEach(() => {
    getDispositions.mockReset();
  });

  function behavior() {
    return new DDBMacroActivityBehavior({
      function: "useActivity",
      events: new Set(["tokenEnter"]),
      oncePerTurn: true,
      excludeSelf: false,
      scale: true,
      autoRoll: false,
      macroParameters: {},
      args: {},
    } as any);
  }

  it("serializes target dispositions relative to the token that placed the region", () => {
    const target = { affects: { type: "enemy" } };
    const activity = {
      target,
      actor: {
        token: { disposition: 0 },
        prototypeToken: { disposition: 1 },
      },
    };
    getDispositions.mockReturnValue(new Set([-1]));

    const data = behavior().createBehaviorData(activity, { token: { disposition: 1 } }) as any;

    expect(getDispositions).toHaveBeenCalledWith(target, { relativeTo: 1 });
    expect(data.system.source).toContain("\"dispositions\":[-1]");
  });

  it("falls back to the actor token and preserves an empty disposition set as unfiltered", () => {
    const target = { affects: { type: "creature" } };
    const activity = {
      target,
      actor: {
        token: { disposition: 0 },
        prototypeToken: { disposition: 1 },
      },
    };
    getDispositions.mockReturnValue(new Set());

    const data = behavior().createBehaviorData(activity) as any;

    expect(getDispositions).toHaveBeenCalledWith(target, { relativeTo: 0 });
    expect(data.system.source).toContain("\"dispositions\":[]");
  });

  it("takes the dispositions from the sibling activity a behavior fires, not the placing one", () => {
    // Conjure Celestial: the Cast targets creatures, Healing Light allies, Searing Light enemies
    const castTarget = { affects: { type: "creature" } };
    const healTarget = { affects: { type: "ally" } };
    const activity = {
      target: castTarget,
      item: { system: { activities: { get: (id: string) => (id === "actHeal0000" ? { target: healTarget } : undefined) } } },
      actor: { token: { disposition: 1 } },
    };
    getDispositions.mockReturnValue(new Set([1]));

    const sibling = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenEnter"]), activity: "actHeal0000", args: {},
    } as any);
    sibling.createBehaviorData(activity, { token: { disposition: 1 } });
    expect(getDispositions).toHaveBeenCalledWith(healTarget, { relativeTo: 1 });

    // enrichers name the sibling in the arguments (ids are generated at parse), matched
    // exact-then-prefix like the trigger-time handler
    const activities = [{ name: "Healing Light", target: healTarget }, { name: "Searing Light (Dex)", target: castTarget }];
    const byName = {
      ...activity,
      item: { system: { activities: { get: () => undefined, find: (fn: (a: any) => boolean) => activities.find(fn) } } },
    };
    const named = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenEnter"]), activity: "", args: { activityName: "Healing Light" },
    } as any);
    named.createBehaviorData(byName, { token: { disposition: 1 } });
    expect(getDispositions).toHaveBeenLastCalledWith(healTarget, { relativeTo: 1 });
    const prefixed = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenEnter"]), activity: "", args: { activityName: "Searing Light" },
    } as any);
    prefixed.createBehaviorData(byName, { token: { disposition: 1 } });
    expect(getDispositions).toHaveBeenLastCalledWith(castTarget, { relativeTo: 1 });

    // an id that resolves to nothing falls back to the placing activity's target
    const missing = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenEnter"]), activity: "actGone0000", args: {},
    } as any);
    missing.createBehaviorData(activity, { token: { disposition: 1 } });
    expect(getDispositions).toHaveBeenLastCalledWith(castTarget, { relativeTo: 1 });
  });
});
