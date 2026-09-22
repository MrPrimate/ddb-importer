import RegionBehaviorSettings from "../../src/lib/RegionBehaviorSettings";
import utils from "../../src/lib/Utils";
import SETTINGS from "../../src/config/settings/settings";
import { setMockSettings } from "../_setup/foundryMocks";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("region behavior settings", () => {
  it.each([
    [true, true, true], [true, false, false], [false, true, false], [false, false, false],
  ])("master=%s, add=%s gives emission=%s", (enabled, add, emit) => {
    setMockSettings({ "enable-ddb-macro-region-behaviors": enabled, "add-ddb-macro-region-behaviors": add });
    expect(RegionBehaviorSettings.enabled).toBe(enabled);
    expect(RegionBehaviorSettings.add).toBe(emit);
  });

  it("registers an enabled-by-default master requiring reload, separate from the import preference", () => {
    const settings = SETTINGS.DEFAULT_SETTINGS.EARLY;
    expect(settings["enable-ddb-macro-region-behaviors"]).toMatchObject({
      type: Boolean, scope: "world", default: true, config: true, requiresReload: true,
    });
    expect(settings["add-ddb-macro-region-behaviors"]).toMatchObject({
      type: Boolean, scope: "world", default: true, config: false,
    });
  });

  function migrateSetup(enabled: boolean) {
    setMockSettings({ "enable-ddb-macro-region-behaviors": enabled });
    vi.stubGlobal("game", { ...game, user: { isActiveGM: true } });
    return vi.spyOn(utils, "setSetting").mockImplementation(async (key, value) => {
      setMockSettings({ [key]: value });
      return value;
    });
  }

  it.each([true, false])("copies the legacy preference %s without changing the master", async (enabled) => {
    const write = migrateSetup(enabled);
    expect(RegionBehaviorSettings.enabled).toBe(enabled);
    await RegionBehaviorSettings.migrate();
    expect(write.mock.calls).toEqual([["add-ddb-macro-region-behaviors", enabled]]);
    expect(RegionBehaviorSettings.enabled).toBe(enabled);
    expect(RegionBehaviorSettings.add).toBe(enabled);
    await RegionBehaviorSettings.migrate();
    expect(write).toHaveBeenCalledOnce();
  });

  it("preserves an explicitly saved import preference when the master differs", async () => {
    const write = migrateSetup(false);
    setMockSettings({ "add-ddb-macro-region-behaviors": true });
    await RegionBehaviorSettings.migrate();
    expect(write).not.toHaveBeenCalled();
    expect(RegionBehaviorSettings.enabled).toBe(false);
    expect(RegionBehaviorSettings.add).toBe(false);
    setMockSettings({ "enable-ddb-macro-region-behaviors": true });
    expect(RegionBehaviorSettings.add).toBe(true);
  });

  it("retries a failed copy without changing the master", async () => {
    const write = migrateSetup(false);
    write.mockRejectedValueOnce(new Error("write failed"));
    await expect(RegionBehaviorSettings.migrate()).rejects.toThrow("write failed");
    expect(RegionBehaviorSettings.enabled).toBe(false);
    await RegionBehaviorSettings.migrate();
    expect(write.mock.calls).toEqual([
      ["add-ddb-macro-region-behaviors", false], ["add-ddb-macro-region-behaviors", false],
    ]);
    expect(RegionBehaviorSettings.add).toBe(false);
  });

  it("does not write settings from a player or inactive GM", async () => {
    const write = migrateSetup(false);
    vi.stubGlobal("game", { ...game, user: { isActiveGM: false } });
    await RegionBehaviorSettings.migrate();
    expect(write).not.toHaveBeenCalled();
    expect(RegionBehaviorSettings.enabled).toBe(false);
  });
});
