import RegionAutomations from "../../../src/effects/auras/RegionAutomations";
import DDBEffectHelper from "../../../src/effects/DDBEffectHelper";
import { DDBSimpleMacro } from "../../../src/lib/_module";

function makeContext(handler: string, { args = {} as Record<string, unknown> } = {}): any {
  return {
    scene: { uuid: "Scene.s" },
    region: { id: "reg1", uuid: "Scene.s.Region.reg1", name: "Test Region", getFlag: vi.fn() },
    behavior: { uuid: "Scene.s.Region.reg1.RegionBehavior.b1", id: "b1" },
    event: { name: "tokenEnter", data: { token: { id: "tok1", name: "Bob", uuid: "Scene.s.Token.tok1", actor: {} } }, region: {}, user: {} },
    handler,
    args,
  };
}

describe("RegionAutomations.handleRegionEvent", () => {
  const originalUser = (globalThis as any).game.user;

  afterEach(() => {
    (globalThis as any).game.user = originalUser;
    delete RegionAutomations.handlers.testHandler;
  });

  it("dispatches to the registered handler on the active GM", async () => {
    (globalThis as any).game.user = { isActiveGM: true };
    const handler = vi.fn();
    RegionAutomations.register("testHandler", handler);
    const context = makeContext("testHandler");

    await RegionAutomations.handleRegionEvent(context);

    expect(handler).toHaveBeenCalledWith(context, RegionAutomations);
  });

  it("does nothing on clients that are not the active GM", async () => {
    (globalThis as any).game.user = { isActiveGM: false };
    const handler = vi.fn();
    RegionAutomations.register("testHandler", handler);

    await RegionAutomations.handleRegionEvent(makeContext("testHandler"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("tolerates an unknown handler and a throwing handler", async () => {
    (globalThis as any).game.user = { isActiveGM: true };
    await expect(RegionAutomations.handleRegionEvent(makeContext("nope"))).resolves.toBeUndefined();
    RegionAutomations.register("testHandler", () => {
      throw new Error("boom");
    });
    await expect(RegionAutomations.handleRegionEvent(makeContext("testHandler"))).resolves.toBeUndefined();
  });
});

describe("RegionAutomations.useActivityHandler", () => {
  const originalUser = (globalThis as any).game.user;
  const originalCombat = (globalThis as any).game.combat;
  const originalModules = (globalThis as any).game.modules;
  const originalFromUuid = (globalThis as any).fromUuid;

  function makeActivity(name: string, id: string, item: any = null) {
    const activity: any = { _id: id, name, use: vi.fn().mockResolvedValue({}) };
    activity.item = item;
    return activity;
  }

  function setup({ combat = null as any, spellLevel = undefined as number | undefined } = {}) {
    const placing = makeActivity("Cast", "actCast000");
    const sibling = makeActivity("Damage", "actDamage0");
    const activities = {
      get: (id: string) => [placing, sibling].find((a) => a._id === id),
      find: (fn: (a: any) => boolean) => [placing, sibling].find(fn),
    };
    const item = { name: "Moonbeam", system: { level: 2, activities } };
    placing.item = item;
    sibling.item = item;

    (globalThis as any).game.user = { isActiveGM: true, targets: [] };
    (globalThis as any).canvas = { tokens: { setTargets: vi.fn() } };
    (globalThis as any).game.combat = combat;
    (globalThis as any).game.modules = { get: () => undefined };
    (globalThis as any).fromUuid = vi.fn().mockResolvedValue(placing);

    const context = makeContext("useActivity");
    context.region.getFlag = vi.fn((_scope: string, key: string) => {
      if (key === "activity") return "Actor.a.Item.b.Activity.actCast000";
      if (key === "spellLevel") return spellLevel;
      return undefined;
    });
    return { context, placing, sibling };
  }

  afterEach(() => {
    (globalThis as any).game.user = originalUser;
    (globalThis as any).game.combat = originalCombat;
    (globalThis as any).game.modules = originalModules;
    (globalThis as any).fromUuid = originalFromUuid;
    vi.restoreAllMocks();
  });

  it("uses the placing activity against the event token with no consumption or dialog", async () => {
    const { context, placing } = setup();

    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).toHaveBeenCalledWith(
      expect.objectContaining({
        create: false,
        consume: { action: false, resource: false, spellSlot: false },
        scaling: 0,
        // the spell is already up: a region tick must not re-begin concentration,
        // which would drop and recreate the caster's effect
        concentration: { begin: false },
        // damage/attack activities keep their chat buttons unless autoRoll opts in
        subsequentActions: false,
        ddbRegionContext: {
          regionUuid: "Scene.s.Region.reg1",
          regionName: "Test Region",
          sceneUuid: "Scene.s",
          behaviorUuid: "Scene.s.Region.reg1.RegionBehavior.b1",
          eventName: "tokenEnter",
          tokenUuid: "Scene.s.Token.tok1",
          args: {},
        },
      }),
      { configure: false },
      // the triggering token is recorded on the card, so Apply does not fall back
      // to whatever is selected (usually the caster)
      { data: { system: { targets: [expect.objectContaining({ token: "Scene.s.Token.tok1" })] } } },
    );
    const setTargets = (globalThis as any).canvas.tokens.setTargets;
    expect(setTargets).toHaveBeenNthCalledWith(1, ["tok1"], { mode: "replace" });
    expect(setTargets).toHaveBeenLastCalledWith([], { mode: "replace" });
  });

  it("resolves a sibling activity by name and applies upcast scaling from the region flag", async () => {
    const { context, placing, sibling } = setup({ spellLevel: 4 });
    context.args = { activityName: "Damage" };

    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).not.toHaveBeenCalled();
    expect(sibling.use).toHaveBeenCalledWith(
      expect.objectContaining({ scaling: 2 }),
      { configure: false },
      expect.objectContaining({ data: expect.anything() }),
    );
  });

  it("autoRoll opts back into rolling via subsequent actions", async () => {
    const { context, placing } = setup();
    context.args = { autoRoll: true };

    await RegionAutomations.useActivityHandler(context);

    const config = placing.use.mock.calls[0][0];
    expect(config.subsequentActions).toBeUndefined();
  });

  it("never suppresses subsequent actions for ddbmacro activities", async () => {
    const { context, placing } = setup();
    placing.type = "ddbmacro";

    await RegionAutomations.useActivityHandler(context);

    const config = placing.use.mock.calls[0][0];
    expect(config.subsequentActions).toBeUndefined();
  });

  it("passes a macro parameters override through the usage config", async () => {
    const { context, placing } = setup();
    context.args = { macroParameters: { save: "ddbSpellStormSa1", upcast: 2 } };

    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).toHaveBeenCalledWith(
      expect.objectContaining({ ddbMacroParameters: "{\"save\":\"ddbSpellStormSa1\",\"upcast\":2}" }),
      { configure: false },
      expect.objectContaining({ data: expect.anything() }),
    );

    context.args = { macroParameters: "already=string" };
    await RegionAutomations.useActivityHandler(context);
    expect(placing.use).toHaveBeenLastCalledWith(
      expect.objectContaining({ ddbMacroParameters: "already=string" }),
      { configure: false },
      expect.objectContaining({ data: expect.anything() }),
    );
  });

  // setFlag really goes out over the socket and only lands on the actor once the
  // update round trips, so the write is deferred here rather than applied inline
  function trackFlags(): Record<string, any> {
    const flags: Record<string, any> = {};
    vi.spyOn(DDBEffectHelper, "getFlag").mockImplementation((_a: any, id: string) => flags[id]);
    vi.spyOn(DDBEffectHelper, "setFlag").mockImplementation(async (_a: any, id: string, value: any) => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      flags[id] = value;
      return undefined as any;
    });
    return flags;
  }

  it("skips a token that already triggered this behavior during the current combat turn", async () => {
    const flags = trackFlags();
    const { context, placing } = setup({ combat: { started: true, id: "c1", round: 1, turn: 2 } });

    await RegionAutomations.useActivityHandler(context);
    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).toHaveBeenCalledTimes(1);
    expect(Object.keys(flags)).toEqual(["regionreg1b1tok1Turn"]);
  });

  it("shares the limit across every event on one behavior", async () => {
    trackFlags();
    const combat = { started: true, id: "c1", round: 1, turn: 2 };
    const { context, placing } = setup({ combat });

    // enters the region on its own turn, then ends that turn inside it: the turn
    // event fires after the combat document has already advanced to turn 3
    await RegionAutomations.useActivityHandler(context);
    combat.turn = 3;
    context.event = { ...context.event, name: "tokenTurnEnd", data: { ...context.event.data, combat, round: 1, turn: 2 } };
    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).toHaveBeenCalledTimes(1);

    // and fires again on the next turn it ends there
    combat.turn = 4;
    context.event = { ...context.event, data: { ...context.event.data, round: 1, turn: 3 } };
    await RegionAutomations.useActivityHandler(context);
    expect(placing.use).toHaveBeenCalledTimes(2);
  });

  it("tracks sibling behaviors on one region independently", async () => {
    trackFlags();
    const { context, placing } = setup({ combat: { started: true, id: "c1", round: 1, turn: 2 } });

    await RegionAutomations.useActivityHandler(context);

    // Hunger of Hadar's turn-start cold damage and turn-end acid save must both land
    const other = makeContext("useActivity");
    other.region.getFlag = context.region.getFlag;
    other.behavior = { uuid: "Scene.s.Region.reg1.RegionBehavior.b2", id: "b2" };
    await RegionAutomations.useActivityHandler(other);

    expect(placing.use).toHaveBeenCalledTimes(2);
  });

  it("tracks two tokens sharing one linked actor apart", async () => {
    trackFlags();
    const actor = {};
    const { context, placing } = setup({ combat: { started: true, id: "c1", round: 1, turn: 2 } });
    context.event.data.token.actor = actor;

    await RegionAutomations.useActivityHandler(context);

    const other = makeContext("useActivity");
    other.region.getFlag = context.region.getFlag;
    other.event.data.token = { id: "tok2", name: "Bob 2", uuid: "Scene.s.Token.tok2", actor };
    await RegionAutomations.useActivityHandler(other);

    expect(placing.use).toHaveBeenCalledTimes(2);
  });

  it("collapses the several events one movement raises, out of combat", async () => {
    const flags = trackFlags();
    const { context, placing } = setup();
    context.event.data.movement = { id: "mv1" };

    // core fires tokenEnter and tokenMoveIn back to back for a single move
    await RegionAutomations.useActivityHandler(context);
    context.event = { ...context.event, name: "tokenMoveIn" };
    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).toHaveBeenCalledTimes(1);
    // recorded with a null combat id, so pruneTurnFlags sweeps it at world load
    expect(Object.values(flags)).toEqual([{ id: null, round: null, turn: null, key: "movementmv1" }]);

    // a later, deliberate move back in is a new trigger
    context.event = { ...context.event, name: "tokenEnter", data: { ...context.event.data, movement: { id: "mv2" } } };
    await RegionAutomations.useActivityHandler(context);
    expect(placing.use).toHaveBeenCalledTimes(2);
  });

  it("collapses concurrently dispatched events of one movement", async () => {
    trackFlags();
    const { context, placing } = setup({ combat: { started: true, id: "c1", round: 1, turn: 2 } });
    context.event.data.movement = { id: "mv1" };
    const moveIn = { ...context, event: { ...context.event, name: "tokenMoveIn" } };

    // core awaits neither, so both handlers are in flight at once
    await Promise.all([
      RegionAutomations.useActivityHandler(context),
      RegionAutomations.useActivityHandler(moveIn),
    ]);

    expect(placing.use).toHaveBeenCalledTimes(1);
  });

  it("skips the token the region originates from when excludeSelf is set", async () => {
    trackFlags();
    const { context, placing } = setup();
    context.region.getFlag = vi.fn((_scope: string, key: string) => {
      if (key === "activity") return "Actor.a.Item.b.Activity.actCast000";
      if (key === "origin") return "Scene.s.Token.tok1";
      return undefined;
    });
    (globalThis as any).fromUuidSync = vi.fn(() => ({ id: "tok1", uuid: "Scene.s.Token.tok1" }));
    context.args = { excludeSelf: true };

    await RegionAutomations.useActivityHandler(context);
    expect(placing.use).not.toHaveBeenCalled();

    // a different token in the same emanation still triggers
    context.event = {
      ...context.event,
      data: { token: { id: "tok2", name: "Ally", uuid: "Scene.s.Token.tok2", actor: {} } },
    };
    await RegionAutomations.useActivityHandler(context);
    expect(placing.use).toHaveBeenCalledTimes(1);

    delete (globalThis as any).fromUuidSync;
  });

  it("ignores the limit for an event with neither a turn nor a movement", async () => {
    trackFlags();
    const { context, placing } = setup();

    await RegionAutomations.useActivityHandler(context);
    await RegionAutomations.useActivityHandler(context);

    expect(placing.use).toHaveBeenCalledTimes(2);
  });
});

describe("RegionAutomations.executeMacroHandler", () => {
  const originalUser = (globalThis as any).game.user;
  const originalMacros = (globalThis as any).game.macros;
  const originalFromUuid = (globalThis as any).fromUuid;

  afterEach(() => {
    (globalThis as any).game.user = originalUser;
    (globalThis as any).game.macros = originalMacros;
    (globalThis as any).fromUuid = originalFromUuid;
    vi.restoreAllMocks();
  });

  function setup() {
    (globalThis as any).game.user = { isActiveGM: true };
    (globalThis as any).game.combat = null;
    (globalThis as any).fromUuid = vi.fn().mockResolvedValue(null);
    const context = makeContext("executeMacro");
    context.region.getFlag = vi.fn(() => undefined);
    return context;
  }

  it("routes ddb.* functions through DDBSimpleMacro with the region context in scope", async () => {
    const context = setup();
    context.args = { macroFunction: "ddb.generic.light", macroParameters: { darkness: true } };
    const execute = vi.spyOn(DDBSimpleMacro, "execute").mockResolvedValue(undefined as any);

    await RegionAutomations.executeMacroHandler(context);

    expect(execute).toHaveBeenCalledWith("generic", "light", {},
      expect.objectContaining({ token: "Scene.s.Token.tok1" }),
      expect.objectContaining({
        parameters: "{\"darkness\":true}",
        targetUuids: ["Scene.s.Token.tok1"],
        regionContext: expect.objectContaining({ eventName: "tokenEnter", regionUuid: "Scene.s.Region.reg1" }),
      }));
  });

  it("runs a Foundry macro found by name with the triggering token", async () => {
    const context = setup();
    context.args = { macroFunction: "My World Macro" };
    const macro = { name: "My World Macro", execute: vi.fn() };
    (globalThis as any).game.macros = { find: (fn: any) => [macro].find(fn) };

    await RegionAutomations.executeMacroHandler(context);

    expect(macro.execute).toHaveBeenCalledWith(expect.objectContaining({
      token: "Scene.s.Token.tok1",
      regionContext: expect.objectContaining({ eventName: "tokenEnter" }),
    }));
  });

  it("warns and does nothing without a macroFunction or matching macro", async () => {
    const context = setup();
    context.args = {};
    await expect(RegionAutomations.executeMacroHandler(context)).resolves.toBeUndefined();

    context.args = { macroFunction: "Missing Macro" };
    (globalThis as any).game.macros = { find: () => undefined };
    await expect(RegionAutomations.executeMacroHandler(context)).resolves.toBeUndefined();
  });
});
