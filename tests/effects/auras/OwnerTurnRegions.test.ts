import { setMockSettings } from "../../_setup/foundryMocks";

beforeEach(() => setMockSettings({ "enable-ddb-macro-region-behaviors": true }));

import OwnerTurnRegions from "../../../src/effects/auras/OwnerTurnRegions";
import RegionAutomations from "../../../src/effects/auras/RegionAutomations";
import RegionTargetPrompt from "../../../src/effects/auras/RegionTargetPrompt";
import logger from "../../../src/lib/Logger";

interface ITestScene {
  uuid: string;
  tokens: Map<string, ITestToken>;
  regions: ITestRegion[];
}
interface ITestToken {
  id: string;
  uuid: string;
  actor: { uuid: string; statuses?: Set<string>; testUserPermission?: () => boolean };
  parent: ITestScene;
  disposition?: number;
  testInsideRegion: (region: ITestRegion) => boolean;
}
interface ITestRegion {
  id: string;
  uuid: string;
  name: string;
  parent: ITestScene;
  hidden: boolean;
  tokens: Set<ITestToken>;
  getFlag: (scope: string, key: string) => string;
  delete: ReturnType<typeof vi.fn<() => Promise<void>>>;
  behaviors: ITestBehavior[];
}
interface ITestBehavior {
  id: string;
  parent: ITestRegion;
  disabled: boolean;
  readonly active: boolean;
  flags: { ddbimporter: { ownerTurn: { events: string[]; args: Record<string, unknown> }; ownerTurnState: object } };
  update: ReturnType<typeof vi.fn<(update: Record<string, unknown>) => Promise<void>>>;
}

/** Document updates merge objects and apply v14's explicit deletion values. */
function mergeUpdate(behavior: object, update: Record<string, unknown>): void {
  const values = { ...update };
  for (const [path, value] of Object.entries(update)) {
    if (value !== _del) continue;
    const parts = path.split(".");
    const key = parts.pop()!;
    const parent = foundry.utils.getProperty(behavior, parts.join(".")) as Record<string, unknown> | undefined;
    if (parent) delete parent[key];
    delete values[path];
  }
  foundry.utils.mergeObject(behavior, values);
}

function setup(args: Record<string, unknown> = {}) {
  const actor = { uuid: "Actor.owner", statuses: new Set<string>(), testUserPermission: () => true };
  const tokens = new Map<string, ITestToken>();
  const regions: ITestRegion[] = [];
  Object.defineProperty(regions, "size", { get: () => regions.length });
  const scene: ITestScene = { uuid: "Scene.local", tokens, regions };
  const owner: ITestToken = { id: "owner", uuid: "Scene.local.Token.owner", actor, parent: scene,
    testInsideRegion(region) {
      return region.tokens.has(this);
    } };
  const target: ITestToken = { id: "target", uuid: "Scene.local.Token.target", actor: { uuid: "Actor.target" }, parent: scene, disposition: -1,
    testInsideRegion(region) {
      return region.tokens.has(this);
    } };
  tokens.set(owner.id, owner);
  tokens.set(target.id, target);
  const activity = { id: "tick", uuid: "Actor.owner.Item.item.Activity.tick", name: "Tick", type: "damage",
    activation: { type: "turnStart" as I5eActivityActivation["type"] },
    target: { affects: { type: "creature" as const, choice: false, count: "" } } };
  const alternate = { ...activity, id: "other", uuid: "Actor.owner.Item.item.Activity.other", name: "Other" };
  const placing = { item: { system: { activities: {
    get: (id: string) => [activity, alternate].find((a) => a.id === id),
    find: (fn: (a: typeof activity) => boolean) => [activity, alternate].find(fn),
  } } } };
  const combat = { id: "combat", started: true, combatants: new Map([
    ["source", { token: owner }], ["victim", { token: target }],
  ]) };
  Object.assign(combat.combatants, { some: (predicate: (entry: { token: ITestToken }) => boolean) => [...combat.combatants.values()].some(predicate) });
  vi.stubGlobal("game", { ...game, user: { isActiveGM: true }, time: { worldTime: 100 },
    combats: Object.assign([combat], { get: (id: string) => id === combat.id ? combat : undefined }),
    combat: { id: "unrelated", round: 90, turn: 90 }, scenes: [scene],
  });
  vi.stubGlobal("fromUuidSync", (uuid: string) => uuid === "activity" ? placing : uuid === owner.uuid ? owner
    : [activity, alternate].find((entry) => entry.uuid === uuid || uuid === `.Item.item.Activity.${entry.id}`) ?? null);
  vi.spyOn(RegionAutomations, "getActivity").mockResolvedValue(placing);
  const use = vi.spyOn(RegionAutomations, "useActivityOnTokens").mockResolvedValue({});
  function makeRegion(id = "region"): ITestRegion {
    const metadata = { events: ["tokenTurnStart"], args: { ownerTurn: true, activityName: "Tick", excludeSelf: true, ...args } };
    const region: ITestRegion = {
      id, uuid: `Scene.local.Region.${id}`, name: id, parent: scene, hidden: false,
      tokens: new Set([owner, target]),
      getFlag: (_scope: string, key: string) => key === "origin" ? owner.uuid : "activity",
      delete: vi.fn(async () => {
        regions.splice(regions.indexOf(region), 1);
      }),
      behaviors: [],
    };
    const behavior: ITestBehavior = {
      id: `${id}behavior`, parent: region, disabled: false,
      flags: { ddbimporter: { ownerTurn: metadata, ownerTurnState: {} } },
      get active() {
        return !this.disabled && !region.hidden && regions.includes(region) && region.behaviors.includes(this);
      },
      update: vi.fn(async (update: Record<string, unknown>) => {
        mergeUpdate(behavior, update);
      }),
    };
    region.behaviors.push(behavior);
    regions.push(region);
    return region;
  }
  const region = makeRegion();
  const behavior = region.behaviors[0];
  const turn = async (round = 1, priorTurn: number | null = null, turn = 0, source = "source") => OwnerTurnRegions.onTurn(
    combat as unknown as Combat.Implementation,
    { round: priorTurn === null ? 0 : round, turn: priorTurn, combatantId: priorTurn === null ? null : "victim" },
    { round, turn, combatantId: source },
  );
  return { scene, combat, owner, target, region, behavior, activity, alternate, use, turn, makeRegion, tokens };
}

function reminder(s: ReturnType<typeof setup>, periods = ["turnStart"]) {
  const config: Parameters<Hooks.Function<"dnd5e.preCreateCombatMessage">>[1] = {
    create: true,
    data: {
      type: "turn", rolls: [], speaker: { token: s.owner.id }, whisper: [],
      system: { periods, activations: [".Item.item.Activity.tick"], deltas: {},
        origin: { combat: s.combat.id, combatant: "source" } },
    },
  };
  const combatant = { token: s.owner, actor: s.owner.actor, parent: s.combat };
  return {
    config, combatant,
    filter: () => OwnerTurnRegions.filterTurnReminder(combatant as unknown as Combatant.Implementation, config),
  };
}

afterEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("owner-turn native reminders", () => {
  it.each(["turnStart", "turnEnd"] as const)("suppresses only the covered %s reminder without executing or claiming", (period) => {
    const s = setup();
    s.activity.activation.type = period;
    s.behavior.flags.ddbimporter.ownerTurn.events = [period === "turnStart" ? "tokenTurnStart" : "tokenTurnEnd"];
    const r = reminder(s, [period]);
    expect(r.filter()).toBeUndefined();
    expect(r.config.data.system.activations).toEqual([]);
    expect(r.config.create).toBe(false);
    expect(s.behavior.update).not.toHaveBeenCalled();
    expect(s.use).not.toHaveBeenCalled();
    expect(s.region.delete).not.toHaveBeenCalled();
  });

  it("preserves another activity, even one with the same name on another item", () => {
    const s = setup();
    s.alternate.name = s.activity.name;
    s.alternate.uuid = "Actor.owner.Item.different.Activity.tick";
    const r = reminder(s);
    r.config.data.system.activations!.push(s.alternate.uuid, "missing-activity");
    r.filter();
    expect(r.config.create).toBe(true);
    expect(r.config.data.system.activations).toEqual([s.alternate.uuid, "missing-activity"]);
  });

  it.each(["deltas", "rolls", "content", "flavor", "flags", "customSystem"])("preserves %s beside removed reminders", (kind) => {
    const s = setup();
    const r = reminder(s);
    if (kind === "deltas") r.config.data.system.deltas = { actor: [{ keyPath: "system.resources.legact.spent", delta: -1 }] };
    else if (kind === "rolls") r.config.data.rolls = [{}];
    else if (kind === "customSystem") r.config.data.system.customNotice = "Other module notice";
    else r.config.data[kind] = kind === "flags" ? { otherModule: { notice: true } } : "Other module notice";
    r.filter();
    expect(r.config.data.system.activations).toEqual([]);
    expect(r.config.create).toBe(true);
  });

  it("does not reverse an earlier hook's suppression", () => {
    const r = reminder(setup());
    r.config.create = false;
    r.config.data.content = "Notice";
    r.filter();
    expect(r.config.create).toBe(false);
  });

  it.each(["noRegion", "disabled", "hidden", "missingOrigin", "missingPlacer", "missingActivity", "expired", "failedOneShot", "victimTurn", "wrongEdge", "wrongActivityEdge", "endedCombat"])("retains the reminder for %s", (kind) => {
    const s = setup(kind === "expired" ? { expiresAt: 99 } : {});
    const metadata = s.behavior.flags.ddbimporter.ownerTurn;
    if (kind === "noRegion") s.scene.regions.length = 0;
    if (kind === "disabled") s.behavior.disabled = true;
    if (kind === "hidden") s.region.hidden = true;
    if (kind === "missingOrigin") s.region.getFlag = () => "";
    if (kind === "missingPlacer") s.region.getFlag = (_scope, key) => key === "origin" ? s.owner.uuid : "missing";
    if (kind === "missingActivity") metadata.args.activityName = "Removed activity";
    if (kind === "expired") expect(game.time.worldTime).toBe(100);
    if (kind === "failedOneShot") s.behavior.flags.ddbimporter.ownerTurnState = { oneShotClaimed: true };
    if (kind === "victimTurn") metadata.args.ownerTurn = false;
    if (kind === "wrongEdge") metadata.events = ["tokenTurnEnd"];
    if (kind === "wrongActivityEdge") s.activity.activation.type = "turnEnd";
    if (kind === "endedCombat") s.combat.started = false;
    const r = reminder(s);
    r.filter();
    expect(r.config.create).toBe(true);
    expect(r.config.data.system.activations).toEqual([".Item.item.Activity.tick"]);
  });

  it("matches the origin token, independently of actor sharing and attachment", () => {
    const s = setup();
    s.target.actor = s.owner.actor;
    Object.assign(s.region, { attachment: { token: s.target } });
    const r = reminder(s);
    r.combatant.token = s.target;
    r.filter();
    expect(r.config.create).toBe(true);
    r.combatant.token = s.owner;
    r.filter();
    expect(r.config.create).toBe(false);
  });

  it("uses the combatant's scene and combat even when another scene/combat is viewed", () => {
    const s = setup();
    const r = reminder(s);
    const secondScene: ITestScene = { uuid: "Scene.other", tokens: new Map(), regions: [] };
    r.combatant.token = { ...s.owner, uuid: "Scene.other.Token.owner", parent: secondScene };
    r.filter();
    expect(r.config.create).toBe(true);
    r.combatant.token = s.owner;
    r.filter();
    expect(r.config.create).toBe(false);
  });

  it("does not inspect occupants or suppression conditions, including an empty distant area", () => {
    const s = setup({ skipOriginStatuses: ["incapacitated"] });
    s.owner.actor.statuses!.add("incapacitated");
    s.region.tokens.clear();
    Object.defineProperty(s.region, "tokens", {
      get: () => {
        throw new Error("Reminder read occupants");
      },
    });
    const r = reminder(s);
    r.filter();
    expect(r.config.create).toBe(false);
  });

  it("filters exact, prefix and id-resolved alternatives through the dispatch resolver", () => {
    const s = setup({ activityChoices: ["Tick", "Other", "Missing"] });
    s.alternate.name = "Other (Strength DC)";
    const r = reminder(s);
    r.config.data.system.activations!.push(s.alternate.uuid);
    r.filter();
    expect(r.config.create).toBe(false);
    const byId = reminder(s);
    Object.assign(s.behavior.flags.ddbimporter.ownerTurn.args, { activityChoices: [], activityId: s.activity.id, activityName: "Ignored" });
    byId.filter();
    expect(byId.config.create).toBe(false);
  });

  it.each([true, false])("gates suppression on Enable independently of Add=%s", (add) => {
    const s = setup();
    const r = reminder(s);
    setMockSettings({ "enable-ddb-macro-region-behaviors": false, "add-ddb-macro-region-behaviors": add });
    r.filter();
    expect(r.config.create).toBe(true);
    setMockSettings({ "enable-ddb-macro-region-behaviors": true });
    r.filter();
    expect(r.config.create).toBe(false);
  });

  it("short-circuits empty scenes and resolves only this owner's behaviors among twenty regions", () => {
    const s = setup();
    const resolve = vi.fn(fromUuidSync);
    vi.stubGlobal("fromUuidSync", resolve);
    s.scene.regions.length = 0;
    reminder(s).filter();
    expect(resolve).not.toHaveBeenCalled();
    s.scene.regions.push(s.region);
    for (let i = 1; i < 20; i++) {
      const region = s.makeRegion(`other-${i}`);
      region.getFlag = () => `Scene.local.Token.other-${i}`;
    }
    const r = reminder(s);
    r.filter();
    expect(r.config.create).toBe(false);
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(s.use).not.toHaveBeenCalled();
    expect(s.behavior.update).not.toHaveBeenCalled();
  });
});

describe("owner-turn region dispatch", () => {
  it("master off blocks turns, activation and fallback cleanup without claiming or deleting", async () => {
    const s = setup({ fireOnPlacement: true, deleteAfterUse: true, fallbackExpiresAt: 90 });
    setMockSettings({ "enable-ddb-macro-region-behaviors": false, "add-ddb-macro-region-behaviors": true });
    await s.turn();
    await OwnerTurnRegions.onPlacement(s.behavior as unknown as RegionBehavior.Implementation);
    await OwnerTurnRegions.cleanupExpired();
    expect(s.use).not.toHaveBeenCalled();
    expect(s.behavior.update).not.toHaveBeenCalled();
    expect(s.region.delete).not.toHaveBeenCalled();
  });

  it("continues placed owner-turn behaviors when only imports are off", async () => {
    const s = setup();
    setMockSettings({ "add-ddb-macro-region-behaviors": false });
    await s.turn();
    expect(s.use).toHaveBeenCalledOnce();
  });

  it("does not use a selected activity after the master was disabled while choosing", async () => {
    const s = setup();
    vi.spyOn(OwnerTurnRegions, "selectActivity").mockImplementation(async () => {
      setMockSettings({ "enable-ddb-macro-region-behaviors": false });
      return { activity: s.activity, tokens: [s.target as unknown as TokenDocument.Implementation] };
    });
    await s.turn();
    expect(s.use).not.toHaveBeenCalled();
    expect(s.region.delete).not.toHaveBeenCalled();
  });

  it("cards occupants on combat start even when the source is outside and another combat is viewed", async () => {
    const s = setup();
    s.region.tokens.delete(s.owner);
    await s.turn();
    expect(s.use).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ event: expect.objectContaining({ name: "tokenTurnStart", data: expect.objectContaining({ combat: s.combat, round: 1, turn: 0 }) }) }),
      s.activity, expect.objectContaining({ ownerTurn: true }), [s.target],
    );
  });

  it("does not fire on the victim's turn or the attachment token's turn", async () => {
    const s = setup();
    Object.assign(s.region, { attachment: { token: s.target } });
    await s.turn(1, null, 0, "victim");
    expect(s.use).not.toHaveBeenCalled();
  });

  it("distinguishes tokens sharing one actor and independent combats in other scenes", async () => {
    const s = setup();
    s.target.actor = s.owner.actor;
    await s.turn(1, null, 0, "victim");
    expect(s.use).not.toHaveBeenCalled();
    const otherScene: ITestScene = { uuid: "Scene.other", tokens: new Map(), regions: [] };
    const otherOwner = { ...s.owner, uuid: "Scene.other.Token.owner", parent: otherScene };
    const otherCombat = { ...s.combat, id: "secondCombat", combatants: new Map([["source", { token: otherOwner }]]) };
    await OwnerTurnRegions.onTurn(otherCombat as unknown as Combat.Implementation,
      { round: 0, turn: null, combatantId: null }, { round: 1, turn: 0, combatantId: "source" });
    expect(s.use).not.toHaveBeenCalled();
    await s.turn();
    expect(s.use).toHaveBeenCalledOnce();
  });

  it("uses the outgoing turn context for end triggers", async () => {
    const s = setup();
    s.behavior.flags.ddbimporter.ownerTurn.events = ["tokenTurnEnd"];
    await OwnerTurnRegions.onTurn(s.combat as unknown as Combat.Implementation,
      { round: 1, turn: 0, combatantId: "source" }, { round: 2, turn: 0, combatantId: "victim" });
    expect(s.use.mock.calls[0][0].event.data).toMatchObject({ round: 1, turn: 0 });
  });

  it("claims duplicate events before any socket round trip and retains both turn edges", async () => {
    const s = setup();
    await Promise.all([s.turn(), s.turn()]);
    expect(s.use).toHaveBeenCalledTimes(1);
    await s.turn(2);
    await s.turn(1);
    expect(s.use).toHaveBeenCalledTimes(2);
  });

  it("retains serialized claims when behavior documents are reconstructed", async () => {
    const s = setup();
    await s.turn();
    s.region.behaviors[0] = { ...s.behavior, flags: JSON.parse(JSON.stringify(s.behavior.flags)) };
    s.use.mockClear();
    await s.turn();
    expect(s.use).not.toHaveBeenCalled();
    await s.turn(2);
    expect(s.use).toHaveBeenCalledOnce();
  });

  it.each(["inactiveGM", "hidden", "disabled", "missingOrigin", "missingActivity", "expired"])("skips %s", async (kind) => {
    const s = setup(kind === "expired" ? { expiresAt: 99 } : {});
    if (kind === "inactiveGM") Object.assign(game.user, { isActiveGM: false });
    if (kind === "hidden") s.region.hidden = true;
    if (kind === "disabled") s.behavior.disabled = true;
    if (kind === "missingOrigin") s.region.getFlag = () => "missing";
    if (kind === "missingActivity") vi.stubGlobal("fromUuidSync", () => null);
    await s.turn();
    expect(s.use).not.toHaveBeenCalled();
  });

  it("claims a source-condition exclusion before it can be replayed", async () => {
    const s = setup({ skipOriginStatuses: ["incapacitated"] });
    const actor = s.owner.actor as typeof s.owner.actor & { statuses: Set<string> };
    actor.statuses.add("incapacitated");
    await s.turn();
    actor.statuses.clear();
    await s.turn();
    expect(s.use).not.toHaveBeenCalled();
    await s.turn(2);
    expect(s.use).toHaveBeenCalledOnce();
  });

  it("applies recipient filters and claims an empty source turn", async () => {
    const s = setup({ dispositions: [1] });
    await s.turn();
    s.target.disposition = 1;
    await s.turn();
    expect(s.use).not.toHaveBeenCalled();
    await s.turn(2);
    expect(s.use).toHaveBeenCalledTimes(1);
  });

  it("handles two regions independently and posts recipient-free drift for empty regions", async () => {
    const s = setup({ ownerTurnTargets: "none" });
    s.region.tokens.clear();
    s.makeRegion("second").tokens.clear();
    await s.turn();
    expect(s.use).toHaveBeenCalledTimes(2);
    expect(s.use.mock.calls.map((call) => call[3])).toEqual([[], []]);
  });

  it.each([true, false])("ends a one-shot after its card, with occupants=%s", async (occupied) => {
    const s = setup({ deleteAfterUse: true });
    if (!occupied) s.region.tokens.clear();
    await s.turn();
    expect(s.region.delete).toHaveBeenCalledOnce();
    expect(s.use).toHaveBeenCalledTimes(occupied ? 1 : 0);
  });

  it.each([null, { aborted: true }])("retains a failed one-shot (%j) without replaying it", async (result) => {
    const s = setup({ deleteAfterUse: true });
    s.use.mockResolvedValue(result);
    await s.turn();
    await s.turn(2);
    expect(s.region.delete).not.toHaveBeenCalled();
    expect(s.use).toHaveBeenCalledOnce();
  });

  it("prunes deleted-combat claims with document merge semantics", async () => {
    const s = setup();
    s.behavior.flags.ddbimporter.ownerTurnState = { placement: true, turns: {
      deletedownertokenTurnStart: { round: 1, turn: 0 },
      combatownertokenTurnEnd: { round: 1, turn: 0 },
    } };
    await s.turn(2);
    expect(s.behavior.flags.ddbimporter.ownerTurnState).toEqual({ placement: true, turns: {
      combatownertokenTurnStart: { round: 2, turn: 0 },
      combatownertokenTurnEnd: { round: 1, turn: 0 },
    } });
  });

  it.each(["suppressed", "skip", "emptyChoice"])("completes a %s one-shot without stranding the region", async (reason) => {
    const s = setup({ deleteAfterUse: true, skipOriginStatuses: ["incapacitated"] });
    if (reason === "suppressed") s.owner.actor.statuses!.add("incapacitated");
    else {
      s.activity.target.affects.choice = true;
      vi.spyOn(RegionTargetPrompt, "choose").mockResolvedValue(reason === "skip" ? null : { activity: "tick", tokens: [] });
    }
    await s.turn();
    expect(s.region.delete).toHaveBeenCalledOnce();
    expect(s.use).not.toHaveBeenCalled();
  });

  it("releases a canceled one-shot prompt for a later turn without replaying the claimed edge", async () => {
    const s = setup({ deleteAfterUse: true });
    s.activity.target.affects.choice = true;
    const choose = vi.spyOn(RegionTargetPrompt, "choose").mockImplementationOnce((_request, _actor, signal) => new Promise((resolve) => {
      signal.addEventListener("abort", () => resolve(null));
    })).mockResolvedValue({ activity: "tick", tokens: [s.target.uuid] });
    const first = s.turn();
    await vi.waitFor(() => expect(choose).toHaveBeenCalledOnce());
    await s.turn(2);
    expect(choose).toHaveBeenCalledOnce();
    s.behavior.disabled = true;
    OwnerTurnRegions.cancelMissing();
    await first;
    expect(s.behavior.flags.ddbimporter.ownerTurnState).not.toHaveProperty("oneShotClaimed");
    s.behavior.disabled = false;
    await s.turn(3);
    expect(s.use).toHaveBeenCalledOnce();
    expect(s.region.delete).toHaveBeenCalledOnce();
  });

  it("does not consume a one-shot if its origin disappears during the claim write", async () => {
    const s = setup({ deleteAfterUse: true });
    s.behavior.update.mockImplementationOnce(async (update) => {
      mergeUpdate(s.behavior, update);
      s.tokens.delete(s.owner.id);
    });
    await s.turn();
    expect(s.behavior.flags.ddbimporter.ownerTurnState).not.toHaveProperty("oneShotClaimed");
    s.tokens.set(s.owner.id, s.owner);
    await s.turn(2);
    expect(s.region.delete).toHaveBeenCalledOnce();
  });

  it("uses copied history when core mutates previous during fast turn advances", async () => {
    const s = setup();
    s.behavior.flags.ddbimporter.ownerTurn.events = ["tokenTurnEnd"];
    const shared = { round: 1, turn: 0, combatantId: "source" };
    OwnerTurnRegions.remember(s.combat as unknown as Combat.Implementation, shared);
    Object.assign(shared, { turn: 1, combatantId: "victim" });
    const first = OwnerTurnRegions.onTurn(s.combat as unknown as Combat.Implementation, shared, { ...shared });
    Object.assign(shared, { turn: 2, combatantId: "source" });
    const second = OwnerTurnRegions.onTurn(s.combat as unknown as Combat.Implementation, shared, { ...shared });
    await Promise.all([first, second]);
    expect(s.use).toHaveBeenCalledOnce();
    expect(s.use.mock.calls[0][0].event.data).toMatchObject({ round: 1, turn: 0 });
  });

  it.each([false, true])("cleans up a Riptide fallback when combat is absent (placed in combat=%s)", async (placedInCombat) => {
    const s = setup({ deleteAfterUse: true, fallbackExpiresAt: 99, ...(placedInCombat ? { placementCombatId: "combat" } : {}) });
    // An elapsed wall clock must never win before the owner has their turn.
    await OwnerTurnRegions.cleanupExpired();
    expect(s.region.delete).not.toHaveBeenCalled();
    s.combat.started = false;
    await OwnerTurnRegions.cleanupExpired();
    expect(s.region.delete).toHaveBeenCalledOnce();
  });

  it("keeps a failed one-shot for recovery when its combat ends", async () => {
    const s = setup({ deleteAfterUse: true, fallbackExpiresAt: 106, placementCombatId: "combat" });
    s.use.mockResolvedValue(null);
    await s.turn();
    s.combat.started = false;
    await OwnerTurnRegions.cleanupExpired();
    expect(s.region.delete).not.toHaveBeenCalled();
  });

  it("coalesces overlapping expiry deletions while cleaning independent regions", async () => {
    const s = setup({ deleteAfterUse: true, fallbackExpiresAt: 99, placementCombatId: "combat" });
    const second = s.makeRegion("second");
    s.combat.started = false;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const remove = s.region.delete.getMockImplementation()!;
    s.region.delete.mockImplementation(async () => {
      await gate;
      await remove();
    });
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const cleanups = [OwnerTurnRegions.cleanupExpired(), OwnerTurnRegions.cleanupExpired(), OwnerTurnRegions.cleanupExpired()];
    await vi.waitFor(() => expect(s.region.delete).toHaveBeenCalledOnce());
    release();
    await Promise.all(cleanups);
    expect(s.region.delete).toHaveBeenCalledOnce();
    expect(second.delete).toHaveBeenCalledOnce();
    expect(s.scene.regions).toEqual([]);
    expect(error).not.toHaveBeenCalled();
  });

  it("releases a failed deletion so a later expiry event can retry", async () => {
    const s = setup({ deleteAfterUse: true, fallbackExpiresAt: 99, placementCombatId: "combat" });
    s.combat.started = false;
    s.region.delete.mockRejectedValueOnce(new Error("Temporary deletion failure"));
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    await OwnerTurnRegions.cleanupExpired();
    expect(s.scene.regions).toContain(s.region);
    await OwnerTurnRegions.cleanupExpired();
    expect(s.region.delete).toHaveBeenCalledTimes(2);
    expect(s.scene.regions).toEqual([]);
    expect(error).toHaveBeenCalledOnce();
  });

  it.each(["success", "failure", "regionRemoved"])("settles an in-flight one-shot after combat deletion: %s", async (outcome) => {
    const s = setup({ deleteAfterUse: true, fallbackExpiresAt: 106, placementCombatId: "combat" });
    let finish!: (result: object | null) => void;
    s.use.mockImplementation(() => new Promise((resolve) => {
      finish = resolve;
    }));
    const turn = s.turn();
    await vi.waitFor(() => expect(s.use).toHaveBeenCalledOnce());
    vi.stubGlobal("game", { ...game, combats: Object.assign([], { get: () => undefined }) });
    OwnerTurnRegions.cancelMissing();
    await OwnerTurnRegions.cleanupExpired();
    expect(s.region.delete).not.toHaveBeenCalled();
    if (outcome === "regionRemoved") s.scene.regions.length = 0;
    finish(outcome === "failure" ? null : {});
    await turn;
    expect(s.region.delete).toHaveBeenCalledTimes(outcome === "success" ? 1 : 0);
    expect(s.scene.regions.includes(s.region)).toBe(outcome === "failure");
  });

  it("fires placement only once and independently of the first turn", async () => {
    const s = setup({ fireOnPlacement: true });
    await OwnerTurnRegions.onPlacement(s.behavior as unknown as RegionBehavior.Implementation);
    await OwnerTurnRegions.onPlacement(s.behavior as unknown as RegionBehavior.Implementation);
    await s.turn();
    expect(s.use).toHaveBeenCalledTimes(2);
  });

  it("captures activation recipients before the asynchronous region-membership update", async () => {
    const s = setup({ fireOnPlacement: true });
    s.region.tokens.clear();
    s.target.testInsideRegion = () => true;
    await OwnerTurnRegions.onPlacement(s.behavior as unknown as RegionBehavior.Implementation);
    expect(s.use.mock.calls[0][3]).toEqual([s.target]);
  });

  it("allows a chosen activity and snapshots occupants while the choice is pending", async () => {
    const s = setup({ activityChoices: ["Tick", "Other"] });
    s.activity.target.affects.choice = true;
    s.activity.target.affects.count = "1";
    const choose = vi.spyOn(RegionTargetPrompt, "choose").mockImplementation(async (request) => {
      expect(request.max).toBe(1);
      s.region.tokens.clear();
      return { activity: "other", tokens: [s.target.uuid] };
    });
    await s.turn();
    expect(choose).toHaveBeenCalledOnce();
    expect(s.use.mock.calls[0][1]).toBe(s.alternate);
    expect(s.use.mock.calls[0][3]).toEqual([s.target]);
  });

  it.each(["source", "region", "behavior", "combat"])("cancels a pending choice when the %s disappears", async (document) => {
    const s = setup();
    s.activity.target.affects.choice = true;
    const choose = vi.spyOn(RegionTargetPrompt, "choose").mockImplementation((_request, _actor, signal) => new Promise((resolve) => {
      signal.addEventListener("abort", () => resolve(null));
    }));
    const job = s.turn();
    await vi.waitFor(() => expect(choose).toHaveBeenCalled());
    if (document === "source") s.tokens.delete(s.owner.id);
    if (document === "region") s.scene.regions.length = 0;
    if (document === "behavior") s.region.behaviors.length = 0;
    if (document === "combat") s.combat.started = false;
    OwnerTurnRegions.cancelMissing();
    await job;
    expect(s.use).not.toHaveBeenCalled();
  });

  it("ignores rewinds and intermediate skipped turns, and handles a same-slot combatant change", () => {
    expect(OwnerTurnRegions.edges({ round: 2, turn: 3, combatantId: "a" }, { round: 1, turn: 0, combatantId: "b" })).toEqual([]);
    const edges = OwnerTurnRegions.edges({ round: 1, turn: 0, combatantId: "a" }, { round: 4, turn: 2, combatantId: "b" });
    expect(edges.map((e) => e.state.combatantId)).toEqual(["a", "b"]);
    expect(OwnerTurnRegions.edges({ round: 1, turn: 0, combatantId: "a" }, { round: 1, turn: 0, combatantId: "b" })).toHaveLength(2);
  });
});
