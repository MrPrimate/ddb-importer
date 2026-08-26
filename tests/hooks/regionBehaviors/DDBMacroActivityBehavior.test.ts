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
    expect(data.system.source).toContain('"dispositions":[-1]');
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
    expect(data.system.source).toContain('"dispositions":[]');
  });
});
