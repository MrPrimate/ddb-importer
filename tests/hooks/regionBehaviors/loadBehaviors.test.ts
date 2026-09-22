vi.mock("../../../src/hooks/regionBehaviors/baseActivityBehavior", () => ({ default: class {} }));

import addRegionBehaviorHooks from "../../../src/hooks/regionBehaviors/loadBehaviors";
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
    expect(CONFIG.DND5E.activityBehaviorTypes).toEqual(native);
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
    expect(on).toHaveBeenCalledWith("combatTurnChange", expect.any(Function));
    expect(on).toHaveBeenCalledWith("dnd5e.preCreateCombatMessage", expect.any(Function));
    expect(on).toHaveBeenCalledWith("deleteRegion", expect.any(Function));
    expect(register).toHaveBeenCalledWith("regionTargetPrompt", expect.any(Function));
    expect(register).toHaveBeenCalledWith("cancelRegionTargetPrompt", expect.any(Function));
  });
});
