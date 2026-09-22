import { setMockSettings } from "../../_setup/foundryMocks";

beforeEach(() => setMockSettings({ "enable-ddb-macro-region-behaviors": true }));

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

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates no behavior from an existing activity when the master is off", () => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": false, "add-ddb-macro-region-behaviors": true });
    expect(behavior().createBehaviorData({ target: {} })).toBe(false);
    expect(getDispositions).not.toHaveBeenCalled();
  });

  it("still creates a behavior from an existing activity when only imports are off", () => {
    setMockSettings({ "add-ddb-macro-region-behaviors": false });
    getDispositions.mockReturnValue(new Set());
    expect(behavior().createBehaviorData({ target: {} })).toMatchObject({ type: "executeScript" });
  });

  it("serializes owner dispatch metadata without native events and preserves its finite lifetime", () => {
    vi.stubGlobal("game", { ...game, time: { worldTime: 100 } });
    getDispositions.mockReturnValue(new Set());
    const owner = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenTurnStart"]), ownerTurn: true,
      ownerTurnTargets: "none", fireOnPlacement: true, deleteAfterUse: true, args: {},
    } as any);
    expect(owner.createBehaviorData({ target: {}, duration: { units: "minute", value: "1" } })).toMatchObject({
      system: { events: [], source: "" },
      flags: { ddbimporter: { ownerTurn: {
        events: ["tokenTurnStart"],
        args: { ownerTurn: true, ownerTurnTargets: "none", fireOnPlacement: true, deleteAfterUse: true, expiresAt: 160 },
      } } },
    });
  });

  it.each([false, true])("gives a one-shot its fallback clock and originating combat (started=%s)", (started) => {
    const token = { uuid: "Scene.origin.Token.owner" };
    const combat = { id: "originCombat", started, combatants: [{ token }] };
    vi.stubGlobal("game", { ...game, time: { worldTime: 100 }, combats: [combat], combat: { id: "viewedElsewhere" } });
    getDispositions.mockReturnValue(new Set());
    const owner = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenTurnStart"]), ownerTurn: true,
      deleteAfterUse: true, args: { fallbackDuration: 6 },
    } as any);
    const data = owner.createBehaviorData({ target: {}, duration: { units: "spec" } }, { token });
    expect(data).toMatchObject({ flags: { ddbimporter: { ownerTurn: { args: { fallbackExpiresAt: 106 } } } } });
    if (!data) throw new Error("Missing owner-turn behavior");
    expect(foundry.utils.getProperty(data, "flags.ddbimporter.ownerTurn.args.placementCombatId")).toBe(started ? combat.id : undefined);
  });

  function behavior() {
    return new DDBMacroActivityBehavior({
      function: "useActivity",
      events: new Set(["tokenEnter"]),
      oncePerTurn: true,
      excludeSelf: false,
      scale: true,
      autoRoll: false,
      groupTargets: true,
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

  it("serializes the target grouping switch, the structured field winning over the arguments JSON", () => {
    const activity = { target: {}, actor: { token: { disposition: 1 } } };
    getDispositions.mockReturnValue(new Set());

    const grouped = behavior().createBehaviorData(activity) as any;
    expect(grouped.system.source).toContain("\"groupTargets\":true");

    const perToken = new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenEnter"]), groupTargets: false, args: { groupTargets: true },
    } as any);
    expect((perToken.createBehaviorData(activity) as any).system.source).toContain("\"groupTargets\":false");
  });

  it("serializes autoRoll from the checkbox or from the arguments JSON", () => {
    const activity = { target: {}, actor: { token: { disposition: 1 } } };
    getDispositions.mockReturnValue(new Set());
    const source = (data: Record<string, unknown>) => (new DDBMacroActivityBehavior({
      function: "useActivity", events: new Set(["tokenEnter"]), ...data,
    } as any).createBehaviorData(activity) as any).system.source;

    expect(source({ autoRoll: false, args: {} })).toContain("\"autoRoll\":false");
    expect(source({ autoRoll: true, args: {} })).toContain("\"autoRoll\":true");
    // the schema default must not switch off a hand-written argument
    expect(source({ autoRoll: false, args: { autoRoll: true } })).toContain("\"autoRoll\":true");
  });
});
