// No vi.mock calls on purpose: this file proves the real barrels evaluate
// cleanly (no circular-import TDZ crash, no module-scope Foundry access beyond
// the shared foundryMocks stubs). If an import here starts throwing
// "Cannot access ... before initialization", a new import cycle was introduced.

describe("barrel smoke imports", () => {
  it("loads src/config/_module", async () => {
    const config = await import("../../src/config/_module");
    expect(config.SETTINGS.MODULE_ID).toBe("ddb-importer");
    expect(config.DICTIONARY).toBeDefined();
  });

  // 30s timeout: the lib barrel transitively transforms most of src on first
  // load; the canary is the TDZ crash, not speed.
  it("loads src/lib/_module", { timeout: 30_000 }, async () => {
    const lib = await import("../../src/lib/_module");
    expect(typeof lib.utils.getSetting).toBe("function");
    expect(lib.SystemHelpers).toBeDefined();
    expect(lib.MuncherSettings).toBeDefined();
  });

  it("loads src/parser/lib/_module", async () => {
    const parserLib = await import("../../src/parser/lib/_module");
    expect(parserLib.DDBDataUtils).toBeDefined();
    expect(parserLib.SystemHelpers).toBeDefined();
  });

  it("loads src/effects/_module", async () => {
    const effects = await import("../../src/effects/_module");
    expect(effects.DDBEffectHelper).toBeDefined();
    expect(effects.ExternalAutomations).toBeDefined();
  });
});
