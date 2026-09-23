import RegionHighlightProfiles, { REGION_HIGHLIGHT_PROFILES_CHANGED } from "../../src/lib/RegionHighlightProfiles";
import { BUILTIN_REGION_HIGHLIGHT_PROFILES } from "../../src/config/regionHighlightProfiles";
import SETTINGS from "../../src/config/settings/settings";
import { setMockSettings } from "../_setup/foundryMocks";

const callAll = vi.hoisted(() => vi.fn());

beforeEach(() => {
  vi.stubGlobal("Hooks", { callAll, on: vi.fn() });
  callAll.mockReset();
  // the unset mock setting is the truthy "OFF" string, which the store must tolerate
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RegionHighlightProfiles store", () => {
  it("ships four built-ins in order and tolerates an unset setting", () => {
    const all = RegionHighlightProfiles.all();
    expect(all.map((profile) => profile.id)).toEqual(["aura", "damage", "status", "minimal"]);
    expect(all.every((profile) => profile.builtin)).toBe(true);
    expect(RegionHighlightProfiles.get("nope")).toBeNull();
    expect(RegionHighlightProfiles.get("")).toBeNull();
    expect(RegionHighlightProfiles.choices()).toEqual(all.map((profile) => ({ value: profile.id, label: profile.name })));
  });

  it("lets a stored profile replace a built-in and lists custom ones by name", () => {
    setMockSettings({
      "region-highlight-profiles": {
        aura: { name: "Aura", pattern: "solid", opacity: 0.9, spacing: 0.5, thickness: 0.15, edgeWidth: 0.25, color: null },
        zeta: { name: "Zeta", pattern: "dots", opacity: 0.3, spacing: 0.2, thickness: 0.4, edgeWidth: 0.25, color: "#00ff00" },
        alpha: { name: "Alpha", pattern: "edge", opacity: 0.6, spacing: 0.5, thickness: 0.5, edgeWidth: 0.3, color: null },
        junk: "not a profile",
      },
    });
    const all = RegionHighlightProfiles.all();
    expect(all.map((profile) => profile.id)).toEqual(["aura", "damage", "status", "minimal", "alpha", "zeta"]);
    expect(RegionHighlightProfiles.get("aura")).toMatchObject({ pattern: "solid", opacity: 0.9, builtin: true });
    expect(RegionHighlightProfiles.isOverriddenBuiltin("aura")).toBe(true);
    expect(RegionHighlightProfiles.isOverriddenBuiltin("damage")).toBe(false);
    expect(RegionHighlightProfiles.get("zeta")).toMatchObject({ builtin: false, color: "#00ff00" });
  });

  it("normalizes untrusted data into range", () => {
    const profile = RegionHighlightProfiles.normalize({
      name: "  Wild One  ", pattern: "swirl" as any, opacity: 7, spacing: "0.3", thickness: -1, edgeWidth: "x", color: " ",
    } as any);
    expect(profile.id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(profile).toEqual({
      id: profile.id, name: "Wild One", pattern: "hatch", opacity: 1, spacing: 0.3, thickness: 0.02, edgeWidth: 0.25,
      dashed: false, dashLength: 0.25, angle: 45, border: false, borderWidth: 0.1, color: null, builtin: false,
    });
    expect(RegionHighlightProfiles.normalize({ name: "Tilted", angle: 400, border: "border", borderWidth: "0.3" } as any))
      .toMatchObject({ angle: 180, border: true, borderWidth: 0.3 });
    expect(RegionHighlightProfiles.normalize({ name: "Dashes", dashed: "dashed", dashLength: "0.5" } as any)).toMatchObject({ dashed: true, dashLength: 0.5 });
    expect(RegionHighlightProfiles.normalize({ id: " kept ", name: "Kept" }).id).toBe("kept");
  });

  it("resolves a flag over its profile, inheriting blank overrides", () => {
    expect(RegionHighlightProfiles.resolve(undefined)).toBeNull();
    expect(RegionHighlightProfiles.resolve({ profile: "" })).toBeNull();
    expect(RegionHighlightProfiles.resolve({ profile: "missing", opacity: 1 })).toBeNull();
    const damage = BUILTIN_REGION_HIGHLIGHT_PROFILES[1];
    expect(RegionHighlightProfiles.resolve({ profile: "damage" })).toEqual({
      profile: "damage", pattern: damage.pattern, opacity: damage.opacity, spacing: damage.spacing,
      thickness: damage.thickness, edgeWidth: damage.edgeWidth, dashed: false, dashLength: 0.25, angle: 45, border: false, borderWidth: 0.1, color: null,
    });
    expect(RegionHighlightProfiles.resolve({
      profile: "damage", pattern: "dots", opacity: "0.75", spacing: null, thickness: "", edgeWidth: 9, dashed: "dashed", dashLength: "1", color: "#123456",
    })).toEqual({
      profile: "damage", pattern: "dots", opacity: 0.75, spacing: damage.spacing, thickness: damage.thickness, edgeWidth: 2,
      dashed: true, dashLength: 1, angle: 45, border: false, borderWidth: 0.1, color: "#123456",
    });
    expect(RegionHighlightProfiles.resolve({ profile: "damage", angle: "90", border: "border", borderWidth: 0.5 })).toMatchObject({ angle: 90, border: true, borderWidth: 0.5 });
    expect(RegionHighlightProfiles.resolve({ profile: "damage", border: "none" })!.border).toBe(false);
    expect(RegionHighlightProfiles.resolve({ profile: "damage", dashed: "continuous" })!.dashed).toBe(false);
    expect(RegionHighlightProfiles.resolve({ profile: "damage", dashed: "" })!.dashed).toBe(false);
    expect(RegionHighlightProfiles.resolve({ profile: "damage", dashed: true })!.dashed).toBe(true);
  });

  it("saves, removes and resets through the world setting and announces the change", async () => {
    const set = vi.spyOn(game.settings, "set");
    const saved = await RegionHighlightProfiles.save({ name: "Fog", pattern: "dots", opacity: 0.4 });
    expect(saved).toMatchObject({ name: "Fog", pattern: "dots", opacity: 0.4, builtin: false });
    expect(saved.id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(set).toHaveBeenCalledWith("ddb-importer", "region-highlight-profiles", { [saved.id]: expect.objectContaining({ name: "Fog" }) });
    expect(set.mock.calls[0][2]).not.toHaveProperty(`${saved.id}.builtin`);
    // the change reaches every client through the world setting's onChange, not a local call
    expect(callAll).not.toHaveBeenCalled();
    // the raw definition: the test mock's deepClone is a JSON round trip, which would drop the function
    const registered = (SETTINGS.DEFAULT_SETTINGS.EARLY as Record<string, { onChange?: () => void }>)["region-highlight-profiles"];
    registered.onChange?.();
    expect(callAll).toHaveBeenCalledWith(REGION_HIGHLIGHT_PROFILES_CHANGED);

    // a shipped id becomes a stored override that keeps the rest of the shipped values
    set.mockClear();
    const aura = await RegionHighlightProfiles.save({ id: "aura", opacity: 0.3 });
    expect(aura).toMatchObject({ id: "aura", name: "Aura", pattern: "hatch", opacity: 0.3, builtin: true });

    setMockSettings({ "region-highlight-profiles": { [saved.id]: { ...saved }, aura: { ...aura } } });
    set.mockClear();
    await RegionHighlightProfiles.remove("aura");
    expect(set).toHaveBeenCalledWith("ddb-importer", "region-highlight-profiles", { [saved.id]: expect.objectContaining({ name: "Fog" }) });
    set.mockClear();
    await RegionHighlightProfiles.remove("absent");
    expect(set).not.toHaveBeenCalled();
  });

  it("gives new profiles random document ids", () => {
    const a = RegionHighlightProfiles.newId();
    const b = RegionHighlightProfiles.newId();
    expect(a).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(a).not.toBe(b);
  });
});
