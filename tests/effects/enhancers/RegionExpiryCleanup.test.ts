import RegionExpiryCleanup from "../../../src/effects/enhancers/Regions/RegionExpiryCleanup";
import { setMockSettings, resetMockSettings } from "../../_setup/foundryMocks";

// the real dialog extends dnd5e.applications.api.Dialog5e at evaluation time; the scan's
// dynamic import resolves to this instead. Confirms every offered template by default.
const promptMock = vi.fn(async (entries: any[]) => entries.map((entry) => entry.uuid));
vi.mock("../../../src/effects/enhancers/Regions/RegionExpiryDialog", () => ({
  default: { prompt: (entries: any[]) => promptMock(entries) },
}));

function makeCollection<T extends { id?: string }>(items: T[]) {
  return {
    [Symbol.iterator]: () => items[Symbol.iterator](),
    has: (id: string) => items.some((i) => i.id === id),
    get: (id: string) => items.find((i) => i.id === id),
  };
}

function makeScene({ regions = [] as any[], tokens = [] as any[], uuid = "Scene.s1", id = "s1" } = {}) {
  const scene: any = { uuid, id, grid: { units: "ft" } };
  // viewing a scene is what makes it the canvas scene, which the scan relies on
  scene.view = vi.fn(async () => {
    (globalThis as any).canvas = { scene };
  });
  scene.regions = makeCollection(regions);
  scene.tokens = tokens;
  for (const region of regions) region.parent = scene;
  return scene;
}

function makeRegion({
  id = "reg1",
  activity = null as string | null,
  item = null as string | null,
  origin = null as string | null,
  behaviors = [] as any[],
  name = "Zone",
  timer = null as any,
} = {}) {
  const flags: Record<string, any> = { activity, item, origin };
  return {
    id,
    uuid: `Scene.s1.Region.${id}`,
    name,
    behaviors,
    shapes: [],
    getFlag: (_scope: string, key: string) => flags[key],
    flags: { dnd5e: flags, ddbimporter: timer ? { regionExpiry: timer } : {} },
    parent: null as any,
  };
}

function makeEffect({
  id = "eff1",
  flags = {} as Record<string, any>,
  system = {} as Record<string, any>,
  origin = null as string | null,
  expired = false,
  sourceActor = undefined as any,
} = {}) {
  const effect: any = { id, flags: { dnd5e: flags }, system, origin, duration: { expired }, parent: null };
  if (sourceActor !== undefined) effect.getSourceActor = () => sourceActor;
  return effect;
}

function makeActor(effects: any[] = [], uuid = "Actor.a1") {
  return { uuid, img: "actor.png", effects: makeCollection(effects) };
}

describe("RegionExpiryCleanup.findTemplatesForEffect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubWorld(scene: any, uuidMap: Record<string, any> = {}) {
    vi.stubGlobal("canvas", { scene });
    (globalThis as any).game.combats = [];
    vi.stubGlobal("fromUuidSync", (uuid: string) => uuidMap[uuid] ?? null);
  }

  it("matches a region by activity uuid from a plain string flag", () => {
    const region = makeRegion({ activity: "Actor.a1.Item.i1.Activity.act1" });
    stubWorld(makeScene({ regions: [region] }));
    const effect = makeEffect({ flags: { activity: "Actor.a1.Item.i1.Activity.act1" } });

    expect(RegionExpiryCleanup.findTemplatesForEffect(effect)).toEqual([region]);
  });

  it("matches when the effect flag is a concentration-style {type, id, uuid} object", () => {
    const region = makeRegion({ activity: "Actor.a1.Item.i1.Activity.act1" });
    stubWorld(makeScene({ regions: [region] }));
    const effect = makeEffect({
      flags: { activity: { type: "utility", id: "act1", uuid: "Actor.a1.Item.i1.Activity.act1" } },
    });

    expect(RegionExpiryCleanup.findTemplatesForEffect(effect)).toEqual([region]);
  });

  it("matches via system.origin.activity when no flag is present", () => {
    const region = makeRegion({ activity: "Actor.a1.Item.i1.Activity.act1" });
    stubWorld(makeScene({ regions: [region] }));
    const effect = makeEffect({ system: { origin: { activity: "Actor.a1.Item.i1.Activity.act1" } } });

    expect(RegionExpiryCleanup.findTemplatesForEffect(effect)).toEqual([region]);
  });

  it("falls back to item uuid matching gated on the casting token's actor", () => {
    const caster = makeActor([], "Actor.caster");
    const other = makeActor([], "Actor.other");
    // real activity regions always carry an activity flag; the item fallback is for effects
    // that only know their item
    const region = makeRegion({
      activity: "Actor.caster.Item.i1.Activity.actX",
      item: "Actor.caster.Item.i1",
      origin: "Scene.s1.Token.t1",
    });
    stubWorld(makeScene({ regions: [region] }), { "Scene.s1.Token.t1": { actor: caster } });

    const casterEffect = makeEffect({ flags: { item: "Actor.caster.Item.i1" }, sourceActor: caster });
    expect(RegionExpiryCleanup.findTemplatesForEffect(casterEffect)).toEqual([region]);

    const otherEffect = makeEffect({ flags: { item: "Actor.caster.Item.i1" }, sourceActor: other });
    expect(RegionExpiryCleanup.findTemplatesForEffect(otherEffect)).toEqual([]);
  });

  it("returns nothing for an effect with no activity or item linkage", () => {
    const region = makeRegion({ activity: "Actor.a1.Item.i1.Activity.act1" });
    stubWorld(makeScene({ regions: [region] }));

    expect(RegionExpiryCleanup.findTemplatesForEffect(makeEffect())).toEqual([]);
  });

  it("scans an extra scene alongside the viewed one", () => {
    const region = makeRegion({ activity: "Actor.a1.Item.i1.Activity.act1" });
    const combatScene = makeScene({ regions: [region], uuid: "Scene.s2" });
    stubWorld(makeScene());
    const effect = makeEffect({ flags: { activity: "Actor.a1.Item.i1.Activity.act1" } });

    expect(RegionExpiryCleanup.findTemplatesForEffect(effect, combatScene)).toEqual([region]);
  });
});

describe("RegionExpiryCleanup.sweepScene", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("offers regions whose governing effect is gone or expired, keeps live ones", () => {
    const liveEffect = makeEffect({ id: "live", flags: { activity: "A.live" } });
    const expiredEffect = makeEffect({ id: "dead", flags: { activity: "A.dead" }, expired: true });
    const caster = makeActor([liveEffect, expiredEffect], "Actor.caster");

    const liveRegion = makeRegion({ id: "regLive", activity: "A.live", origin: "Scene.s1.Token.t1" });
    const expiredRegion = makeRegion({ id: "regDead", activity: "A.dead", origin: "Scene.s1.Token.t1" });
    const orphanRegion = makeRegion({ id: "regOrphan", activity: "A.orphan", origin: "Scene.s1.Token.t1" });
    const scene = makeScene({ regions: [liveRegion, expiredRegion, orphanRegion] });
    vi.stubGlobal("fromUuidSync", (uuid: string) => (uuid === "Scene.s1.Token.t1" ? { actor: caster } : null));

    const swept = RegionExpiryCleanup.sweepScene(scene);
    expect(swept.map((r: any) => r.id).sort()).toEqual(["regDead", "regOrphan"]);
  });

  it("ignores regions without an activity flag", () => {
    const plainRegion = makeRegion({ id: "plain" });
    const scene = makeScene({ regions: [plainRegion] });
    vi.stubGlobal("fromUuidSync", () => null);

    expect(RegionExpiryCleanup.sweepScene(scene)).toEqual([]);
  });
});

describe("RegionExpiryCleanup.removeTemplates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (foundry.documents as any).modifyBatch;
  });

  function stubBatch() {
    const modifyBatch = vi.fn().mockResolvedValue([]);
    (foundry as any).documents ??= {};
    (foundry.documents as any).modifyBatch = modifyBatch;
    vi.stubGlobal("ui", { notifications: { info: vi.fn() } });
    return modifyBatch;
  }

  function entryFor(region: any): any {
    return { region, uuid: region.uuid, reason: "test" };
  }

  it("deletes the region and behavior-applied effects in one grouped batch", async () => {
    const modifyBatch = stubBatch();
    const behavior = { id: "b1", uuid: "Scene.s1.Region.reg1.RegionBehavior.b1" };
    const applied = makeEffect({ id: "applied1", origin: behavior.uuid });
    const bystander = makeEffect({ id: "other", origin: "elsewhere" });
    const actor = makeActor([applied, bystander]);
    const region = makeRegion({ id: "reg1", activity: "A.x", behaviors: [behavior] });
    makeScene({ regions: [region], tokens: [{ actor }] });

    await RegionExpiryCleanup.removeTemplates([entryFor(region)]);

    expect(modifyBatch).toHaveBeenCalledTimes(1);
    const batch = modifyBatch.mock.calls[0][0];
    expect(batch).toHaveLength(2);
    const regionOp = batch.find((op: any) => op.documentName === "Region");
    const effectOp = batch.find((op: any) => op.documentName === "ActiveEffect");
    expect(regionOp).toMatchObject({ action: "delete", ids: ["reg1"] });
    expect(effectOp).toMatchObject({ action: "delete", ids: ["applied1"], parent: actor });
  });

  it("also matches applied effects by system.origin.behavior", async () => {
    const modifyBatch = stubBatch();
    const behavior = { id: "b1", uuid: "Scene.s1.Region.reg1.RegionBehavior.b1" };
    const applied = makeEffect({ id: "applied1", system: { origin: { behavior: behavior.uuid } } });
    const actor = makeActor([applied]);
    const region = makeRegion({ id: "reg1", activity: "A.x", behaviors: [behavior] });
    makeScene({ regions: [region], tokens: [{ actor }] });

    await RegionExpiryCleanup.removeTemplates([entryFor(region)]);

    const batch = modifyBatch.mock.calls[0][0];
    const effectOp = batch.find((op: any) => op.documentName === "ActiveEffect");
    expect(effectOp?.ids).toEqual(["applied1"]);
  });

  it("leaves effects from self-cleaning behaviors out of the batch", async () => {
    // dnd5e's applyActiveEffect deletes its own effects on the TOKEN_EXIT that the region
    // deletion fires; including them raced the transactional batch and cancelled everything.
    const modifyBatch = stubBatch();
    const native = { id: "b1", uuid: "Scene.s1.Region.reg1.RegionBehavior.b1", type: "dnd5e.applyActiveEffect" };
    const macro = { id: "b2", uuid: "Scene.s1.Region.reg1.RegionBehavior.b2", type: "executeScript" };
    const nativeApplied = makeEffect({ id: "nativeEffect", origin: native.uuid });
    const macroApplied = makeEffect({ id: "macroEffect", origin: macro.uuid });
    const actor = makeActor([nativeApplied, macroApplied]);
    const region = makeRegion({ id: "reg1", activity: "A.x", behaviors: [native, macro] });
    makeScene({ regions: [region], tokens: [{ actor }] });

    await RegionExpiryCleanup.removeTemplates([entryFor(region)]);

    const batch = modifyBatch.mock.calls[0][0];
    const effectOp = batch.find((op: any) => op.documentName === "ActiveEffect");
    expect(effectOp?.ids).toEqual(["macroEffect"]);
  });

  it("retries with the regions alone when the transactional batch is rejected", async () => {
    const modifyBatch = stubBatch();
    modifyBatch.mockRejectedValueOnce(new Error("ActiveEffect \"gone\" does not exist!"));
    const behavior = { id: "b1", uuid: "Scene.s1.Region.reg1.RegionBehavior.b1", type: "executeScript" };
    const applied = makeEffect({ id: "applied1", origin: behavior.uuid });
    const actor = makeActor([applied]);
    const region = makeRegion({ id: "reg1", activity: "A.x", behaviors: [behavior] });
    makeScene({ regions: [region], tokens: [{ actor }] });

    await RegionExpiryCleanup.removeTemplates([entryFor(region)]);

    expect(modifyBatch).toHaveBeenCalledTimes(2);
    const retry = modifyBatch.mock.calls[1][0];
    expect(retry).toHaveLength(1);
    expect(retry[0]).toMatchObject({ documentName: "Region", ids: ["reg1"] });
  });

  it("recomputes at removal time, skipping regions deleted while the prompt was open", async () => {
    const modifyBatch = stubBatch();
    const region = makeRegion({ id: "gone", activity: "A.x" });
    const scene = makeScene({ regions: [region] });
    scene.regions = makeCollection([]);

    await RegionExpiryCleanup.removeTemplates([entryFor(region)]);

    expect(modifyBatch).not.toHaveBeenCalled();
  });
});


describe("RegionExpiryCleanup region-applied effects", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never treats an effect applied by a region behavior as a governor", () => {
    // dnd5e rewrites an applied effect's system.origin to the placing activity, so it otherwise
    // looks identical to a caster-side effect from that activity.
    const region = makeRegion({ activity: "Actor.a1.Item.i1.Activity.act1" });
    vi.stubGlobal("canvas", { scene: makeScene({ regions: [region] }) });
    (globalThis as any).game.combats = [];
    vi.stubGlobal("fromUuidSync", () => null);

    const applied = makeEffect({
      system: {
        origin: {
          activity: "Actor.a1.Item.i1.Activity.act1",
          behavior: "Scene.s1.Region.reg1.RegionBehavior.b1",
        },
      },
    });

    expect(RegionExpiryCleanup.findTemplatesForEffect(applied)).toEqual([]);
  });

  it("skips region-applied effects when resolving a region's governing effect", () => {
    const applied = makeEffect({
      id: "marker",
      system: { origin: { activity: "A.aura", behavior: "Scene.s1.Region.reg1.RegionBehavior.b1" } },
    });
    const caster = makeActor([applied], "Actor.caster");
    const region = makeRegion({ id: "reg1", activity: "A.aura", origin: "Scene.s1.Token.t1" });
    makeScene({ regions: [region] });
    vi.stubGlobal("fromUuidSync", (uuid: string) => (uuid === "Scene.s1.Token.t1" ? { actor: caster } : null));

    expect(RegionExpiryCleanup.governingEffect(region as any)).toBeNull();
  });
});

describe("RegionExpiryCleanup region timers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetMockSettings();
    delete (globalThis as any).game.time;
    delete (globalThis as any).game.combat;
  });

  function stubTime(worldTime: number, combats: any[] = []) {
    (globalThis as any).game.time = {
      worldTime,
      calendar: {
        // seconds per unit, enough for the units the system emits
        componentsToTime: (components: Record<string, number>) => {
          const perUnit: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400 };
          const [unit, value] = Object.entries(components)[0];
          return (perUnit[unit] ?? 0) * value;
        },
      },
    };
    (globalThis as any).game.combat = combats[0] ?? null;
    (globalThis as any).game.combats = Object.assign(combats, {
      get: (id: string) => combats.find((c) => c.id === id),
    });
    vi.stubGlobal("CONFIG", { ...(globalThis as any).CONFIG, time: { roundTime: 6, turnTime: 0 } });
  }

  it("stamps the placing activity's duration onto the region creation data", () => {
    setMockSettings({ "enable-region-expiry-cleanup": true });
    stubTime(1000);
    const activity = {
      uuid: "Actor.a1.Item.i1.Activity.act1",
      duration: { value: 10, units: "minute", getEffectData: () => ({ value: 10, units: "minutes" }) },
    };
    const regionData = [{ name: "Storm Aura" }] as any[];

    RegionExpiryCleanup.stampTemplateDurations(activity, regionData);

    expect(regionData[0].flags.ddbimporter.regionExpiry).toMatchObject({
      value: 10, units: "minutes", startTime: 1000, activity: activity.uuid,
    });
  });

  it("stamps nothing for an instantaneous or permanent activity", () => {
    setMockSettings({ "enable-region-expiry-cleanup": true });
    stubTime(1000);
    const regionData = [{}] as any[];

    RegionExpiryCleanup.stampTemplateDurations({ duration: { units: "inst", getEffectData: () => ({}) } }, regionData);

    expect(regionData[0].flags).toBeUndefined();
  });

  it("keeps a region alive while its own duration is still running, with no governing effect", () => {
    stubTime(1000);
    const region = makeRegion({
      id: "aura", activity: "A.aura", origin: "Scene.s1.Token.t1",
      timer: { value: 10, units: "minutes", startTime: 1000, combat: null, startRound: null, activity: "A.aura" },
    });
    const scene = makeScene({ regions: [region] });
    vi.stubGlobal("fromUuidSync", () => null);

    expect(RegionExpiryCleanup.regionExpiry(region as any).expired).toBe(false);
    expect(RegionExpiryCleanup.sweepScene(scene)).toEqual([]);
  });

  it("expires a region once its duration has elapsed", () => {
    stubTime(1000 + 601);
    const region = makeRegion({
      id: "aura", activity: "A.aura", origin: "Scene.s1.Token.t1",
      timer: { value: 10, units: "minutes", startTime: 1000, combat: null, startRound: null, activity: "A.aura" },
    });
    const scene = makeScene({ regions: [region] });
    vi.stubGlobal("canvas", { scene });
    vi.stubGlobal("fromUuidSync", () => null);

    const verdict = RegionExpiryCleanup.regionExpiry(region as any);
    expect(verdict.expired).toBe(true);
    expect(verdict.reason).toBe("duration elapsed");
    expect(RegionExpiryCleanup.timerExpiredRegions()).toEqual([region]);
  });

  it("measures a rounds duration against the combat it was placed in", () => {
    const combat = { id: "c1", round: 12 };
    stubTime(1000, [combat]);
    const timer = { value: 10, units: "rounds", startTime: 1000, combat: "c1", startRound: 1, activity: "A.x" };
    const region = makeRegion({ id: "r", activity: "A.x", origin: "Scene.s1.Token.t1", timer });
    makeScene({ regions: [region] });
    vi.stubGlobal("fromUuidSync", () => null);

    expect(RegionExpiryCleanup.regionExpiry(region as any).expired).toBe(true);

    combat.round = 5;
    expect(RegionExpiryCleanup.regionExpiry(region as any).expired).toBe(false);
  });

  it("still sweeps a timerless region with no governing effect", () => {
    stubTime(1000);
    const region = makeRegion({ id: "legacy", activity: "A.old", origin: "Scene.s1.Token.t1" });
    const scene = makeScene({ regions: [region] });
    vi.stubGlobal("fromUuidSync", () => null);

    expect(RegionExpiryCleanup.sweepScene(scene)).toEqual([region]);
  });
});

describe("RegionExpiryCleanup.trackedRegions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).game.time;
  });

  it("offers still-running regions at combat end, but nothing it does not track", () => {
    // a live timer: would be caught later, so it is offered early
    const timed = makeRegion({
      id: "timed", activity: "A.aura",
      timer: { value: 10, units: "minutes", startTime: 0, combat: "c1", startRound: 1, activity: "A.aura" },
    });
    // a live governing effect: likewise
    const governed = makeRegion({ id: "governed", activity: "A.spell", origin: "Scene.s1.Token.t1" });
    // neither clock - sweepScene already treats this one as stale
    const untracked = makeRegion({ id: "untracked", activity: "A.orphan" });
    // not placed by an activity at all
    const handDrawn = makeRegion({ id: "handDrawn" });

    const scene = makeScene({ regions: [timed, governed, untracked, handDrawn] });
    (globalThis as any).game.time = { worldTime: 60 };
    (globalThis as any).game.combats = [];
    const caster = makeActor([makeEffect({ flags: { activity: "A.spell" } })], "Actor.caster");
    vi.stubGlobal("fromUuidSync", (uuid: string) => (uuid === "Scene.s1.Token.t1" ? { actor: caster } : null));

    expect(RegionExpiryCleanup.trackedRegions(scene).map((r: any) => r.id)).toEqual(["timed", "governed"]);
    expect(RegionExpiryCleanup.trackedRegions(null)).toEqual([]);
  });
});

describe("RegionExpiryCleanup.#candidateScenes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).game.users;
    delete (globalThis as any).game.scenes;
  });

  it("scans scenes connected players are viewing, and not every scene with a combat", () => {
    const viewed = makeRegion({ id: "viewed", activity: "A.x" });
    const playerSide = makeRegion({ id: "player", activity: "A.x" });
    const combatOnly = makeRegion({ id: "combatOnly", activity: "A.x" });
    const viewedScene = makeScene({ regions: [viewed], uuid: "Scene.viewed", id: "viewed" });
    const playerScene = makeScene({ regions: [playerSide], uuid: "Scene.player", id: "player" });
    const combatScene = makeScene({ regions: [combatOnly], uuid: "Scene.combat", id: "combat" });

    vi.stubGlobal("canvas", { scene: viewedScene });
    (globalThis as any).game.users = [
      { active: true, viewedScene: "player" },
      { active: false, viewedScene: "combat" },
    ];
    (globalThis as any).game.scenes = {
      get: (id: string) => [viewedScene, playerScene, combatScene].find((s) => s.id === id),
    };
    (globalThis as any).game.combats = [{ scene: combatScene }];
    vi.stubGlobal("fromUuidSync", () => null);

    const matched = RegionExpiryCleanup.findTemplatesForEffect(makeEffect({ flags: { activity: "A.x" } }));
    expect(matched.map((r: any) => r.id).sort()).toEqual(["player", "viewed"]);
  });
});

describe("RegionExpiryCleanup.scanAllScenes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    promptMock.mockClear();
    delete (globalThis as any).game.scenes;
    delete (globalThis as any).game.users;
    (globalThis as any).game.user = { id: "testUser", isGM: true };
    delete (foundry.documents as any).modifyBatch;
  });

  function stubWorldScenes(scenes: any[]) {
    (globalThis as any).game.scenes = Object.assign(scenes, {
      get: (id: string) => scenes.find((s) => s.id === id),
      has: (id: string) => scenes.some((s) => s.id === id),
    });
    (globalThis as any).game.users = [];
    (globalThis as any).game.combats = [];
    vi.stubGlobal("fromUuidSync", () => null);
    vi.stubGlobal("ui", { notifications: { info: vi.fn(), warn: vi.fn() } });
    (foundry as any).documents ??= {};
    (foundry.documents as any).modifyBatch = vi.fn().mockResolvedValue([]);
  }

  it("refuses to run for a non-GM", async () => {
    stubWorldScenes([]);
    (globalThis as any).game.user = { id: "player", isGM: false };

    expect(await RegionExpiryCleanup.scanAllScenes()).toMatchObject({ scanned: 0, offered: 0 });
    expect((ui as any).notifications.warn).toHaveBeenCalled();
  });

  it("views only the scenes that have candidates, prompts per scene, and returns home", async () => {
    const orphan = makeRegion({ id: "orphan", activity: "A.orphan" });
    const home = makeScene({ regions: [], uuid: "Scene.home", id: "home" });
    const empty = makeScene({ regions: [], uuid: "Scene.empty", id: "empty" });
    const stale = makeScene({ regions: [orphan], uuid: "Scene.stale", id: "stale" });
    stubWorldScenes([home, empty, stale]);
    vi.stubGlobal("canvas", { scene: home });

    const summary = await RegionExpiryCleanup.scanAllScenes();

    expect(summary).toMatchObject({ scanned: 3, offered: 1, removed: 1 });
    expect(empty.view).not.toHaveBeenCalled();
    expect(stale.view).toHaveBeenCalledTimes(1);
    // back to where the GM started
    expect(home.view).toHaveBeenCalledTimes(1);
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it("scans only the viewed scene, re-offering templates kept earlier", async () => {
    const orphan = makeRegion({ id: "orphan", activity: "A.orphan" });
    const elsewhere = makeRegion({ id: "elsewhere", activity: "A.other" });
    const here = makeScene({ regions: [orphan], uuid: "Scene.here", id: "here" });
    const there = makeScene({ regions: [elsewhere], uuid: "Scene.there", id: "there" });
    stubWorldScenes([here, there]);
    vi.stubGlobal("canvas", { scene: here });
    promptMock.mockImplementationOnce(async () => []);

    // first pass: the GM keeps it, so the automatic sweeps will not re-offer it
    await RegionExpiryCleanup.scanCurrentScene();
    const summary = await RegionExpiryCleanup.scanCurrentScene();

    expect(summary).toMatchObject({ scanned: 1, offered: 1, removed: 1 });
    expect(promptMock).toHaveBeenCalledTimes(2);
    // the other scene was never touched
    expect(there.view).not.toHaveBeenCalled();
    expect(promptMock.mock.calls.every(([entries]: any) => entries.every((e: any) => e.uuid.includes("Region.orphan"))))
      .toBe(true);
    RegionExpiryCleanup.forget();
  });

  it("warns when no scene is being viewed", async () => {
    stubWorldScenes([]);
    vi.stubGlobal("canvas", {});

    expect(await RegionExpiryCleanup.scanCurrentScene()).toMatchObject({ scanned: 0 });
    expect((ui as any).notifications.warn).toHaveBeenCalled();
  });

  it("re-offers templates kept earlier in the session", async () => {
    const orphan = makeRegion({ id: "orphan", activity: "A.orphan" });
    const scene = makeScene({ regions: [orphan], uuid: "Scene.only", id: "only" });
    stubWorldScenes([scene]);
    vi.stubGlobal("canvas", { scene });
    promptMock.mockImplementationOnce(async () => []);

    // first pass: the GM keeps it
    await RegionExpiryCleanup.scanAllScenes();
    // second pass: asked again anyway
    const summary = await RegionExpiryCleanup.scanAllScenes();

    expect(summary.offered).toBe(1);
    expect(promptMock).toHaveBeenCalledTimes(2);
    RegionExpiryCleanup.forget();
  });
});
