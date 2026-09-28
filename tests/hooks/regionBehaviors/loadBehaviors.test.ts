vi.mock("../../../src/hooks/regionBehaviors/baseActivityBehavior", () => ({ default: class {} }));

import addRegionBehaviorHooks, { restoreSwitchedOffBehaviors } from "../../../src/hooks/regionBehaviors/loadBehaviors";
import OwnerTurnRegions from "../../../src/effects/auras/OwnerTurnRegions";
import RegionTargetPrompt from "../../../src/effects/auras/RegionTargetPrompt";
import RegionAutomations from "../../../src/effects/auras/RegionAutomations";
import { pruneRegionTurnFlags } from "../../../src/hooks/ready/pruneRegionFlags";
import type { DDBSocket } from "../../../src/hooks/socket/sockets";
import { setMockSettings } from "../../_setup/foundryMocks";

beforeEach(() => vi.stubGlobal("Hooks", { on: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("region automation registration", () => {
  it.each([true, false])("master off registers no behavior, hooks or chooser sockets (add=%s)", async (add) => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": false, "add-ddb-macro-region-behaviors": add });
    const native = { difficultTerrain: {}, applyActiveEffect: {} };
    vi.stubGlobal("CONFIG", { ...CONFIG, DND5E: { ...CONFIG.DND5E, activityBehaviorTypes: { ...native } } });
    vi.stubGlobal("game", { ...game, user: { isActiveGM: true } });
    const on = vi.spyOn(Hooks, "on");
    const register = vi.fn();
    const prune = vi.spyOn(RegionAutomations, "pruneTurnFlags");
    addRegionBehaviorHooks();
    OwnerTurnRegions.registerHooks();
    RegionTargetPrompt.registerSocket({ register } as unknown as DDBSocket);
    await pruneRegionTurnFlags();
    // the appearance behavior is not automation and registers regardless of the automation master switch
    expect(Object.keys(CONFIG.DND5E.activityBehaviorTypes).sort()).toEqual(["applyActiveEffect", "ddbDisplay", "difficultTerrain"]);
    expect(on).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
    expect(prune).not.toHaveBeenCalled();
  });

  it.each([true, false])("master on registers runtime independently of imports (add=%s)", (add) => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": true, "add-ddb-macro-region-behaviors": add });
    vi.stubGlobal("CONFIG", { ...CONFIG, DND5E: { ...CONFIG.DND5E, activityBehaviorTypes: {} } });
    const on = vi.spyOn(Hooks, "on");
    const register = vi.fn();
    addRegionBehaviorHooks();
    RegionTargetPrompt.registerSocket({ register } as unknown as DDBSocket);
    expect(CONFIG.DND5E.activityBehaviorTypes).toHaveProperty("ddbMacro");
    expect(CONFIG.DND5E.activityBehaviorTypes).toHaveProperty("ddbDisplay");
    expect(on).toHaveBeenCalledWith("combatTurnChange", expect.any(Function));
    expect(on).toHaveBeenCalledWith("dnd5e.preCreateCombatMessage", expect.any(Function));
    expect(on).toHaveBeenCalledWith("deleteRegion", expect.any(Function));
    expect(register).toHaveBeenCalledWith("regionTargetPrompt", expect.any(Function));
    expect(register).toHaveBeenCalledWith("cancelRegionTargetPrompt", expect.any(Function));
  });

  it("leaves the appearance behavior out when the display profiles are switched off", () => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": true, "enable-region-display-profiles": false });
    vi.stubGlobal("CONFIG", { ...CONFIG, DND5E: { ...CONFIG.DND5E, activityBehaviorTypes: {} } });
    addRegionBehaviorHooks();
    expect(Object.keys(CONFIG.DND5E.activityBehaviorTypes)).toEqual(["ddbMacro"]);
  });
});

/**
 * dnd5e rebuilds an activity's behaviors from its sheet form, keyed by index, and renders only
 * registered types; a DDB behavior whose switch is off must survive the save.
 */
describe("switched-off DDB behaviors survive an activity sheet save", () => {
  const source = [
    { _id: "a", type: "difficultTerrain", config: {} },
    { _id: "b", type: "ddbMacro", config: { function: "useActivity" } },
    { _id: "c", type: "ddbDisplay", config: { profile: "aura" } },
    { _id: "d", type: "someOtherModule", config: {} },
  ];

  it("restores unregistered DDB behaviors at their own index and leaves the rest alone", () => {
    vi.stubGlobal("CONFIG", { ...CONFIG, DND5E: { ...CONFIG.DND5E, activityBehaviorTypes: { difficultTerrain: {} } } });
    const submitData: Record<string, any> = { behaviors: { 0: { _id: "a", type: "difficultTerrain", config: { edited: true } } } };
    restoreSwitchedOffBehaviors(submitData, source);
    expect(submitData.behaviors).toEqual({ 0: { _id: "a", type: "difficultTerrain", config: { edited: true } }, 1: source[1], 2: source[2] });
  });

  it("never overrides a submitted entry or a registered type the user removed", () => {
    vi.stubGlobal("CONFIG", { ...CONFIG, DND5E: { ...CONFIG.DND5E, activityBehaviorTypes: { ddbMacro: {}, ddbDisplay: {} } } });
    const submitData: Record<string, any> = { behaviors: { 1: { _id: "b", type: "ddbMacro", config: { function: "notify" } } } };
    restoreSwitchedOffBehaviors(submitData, source);
    expect(submitData.behaviors).toEqual({ 1: { _id: "b", type: "ddbMacro", config: { function: "notify" } } });
  });

  it("does nothing when the form carried no behaviors", () => {
    const submitData: Record<string, any> = { name: "Cast" };
    restoreSwitchedOffBehaviors(submitData, source);
    expect(submitData).toEqual({ name: "Cast" });
  });

  it("wraps the activity sheet's submit data preparation", () => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": false, "enable-region-display-profiles": false });
    vi.stubGlobal("CONFIG", { ...CONFIG, DND5E: { ...CONFIG.DND5E, activityBehaviorTypes: {} } });
    class ActivitySheet {
      activity = { toObject: () => ({ behaviors: source }) };
      _prepareSubmitData(): Record<string, any> {
        return { behaviors: {} };
      }
    }
    vi.stubGlobal("dnd5e", { ...(globalThis as any).dnd5e, applications: { activity: { ActivitySheet } } });
    addRegionBehaviorHooks();
    const submitData = new ActivitySheet()._prepareSubmitData();
    expect(Object.keys(submitData.behaviors)).toEqual(["1", "2"]);
  });
});
