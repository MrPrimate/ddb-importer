import RegionDisplayProfiles, { REGION_DISPLAY_PROFILES_CHANGED } from "../../src/lib/RegionDisplayProfiles";
import {
  BUILTIN_REGION_DISPLAY_PROFILES,
  REGION_DISPLAY_DEFAULTS,
  REGION_DISPLAY_FIELDS,
  REGION_DISPLAY_PATTERNS,
} from "../../src/config/regionDisplayProfiles";
import SETTINGS from "../../src/config/settings/settings";
import { setMockSettings } from "../_setup/foundryMocks";
import { enString, useEnLocalization } from "../_fixtures/enLocalize";

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

describe("RegionDisplayProfiles store", () => {
  it("fills missing cross and wave controls from the defaults without rewriting settings", () => {
    const raw = { old: { name: "Legacy", pattern: "waves", thickness: 0.4 } };
    setMockSettings({ "region-display-profiles": raw });
    const write = vi.spyOn(game.settings, "set");
    expect(RegionDisplayProfiles.get("old")).toMatchObject({ crossLength: 1, waveAmplitude: 0.25, waveLength: 1 });
    expect(raw.old).toEqual({ name: "Legacy", pattern: "waves", thickness: 0.4 });
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it("inherits and clamps shape controls, retaining a zero wave height", () => {
    setMockSettings({ "region-display-profiles": { custom: { crossLength: 2, waveAmplitude: 0.5, waveLength: 2 } } });
    for (const blank of [undefined, null, ""]) {
      expect(RegionDisplayProfiles.resolve({ profile: "custom", crossLength: blank, waveAmplitude: blank, waveLength: blank }))
        .toMatchObject({ crossLength: 2, waveAmplitude: 0.5, waveLength: 2 });
    }
    for (const zero of [0, "0"]) {
      expect(RegionDisplayProfiles.resolve({ profile: "custom", waveAmplitude: zero })!.waveAmplitude).toBe(0);
    }
    expect(RegionDisplayProfiles.resolve({ profile: "custom", crossLength: 99, waveAmplitude: -1, waveLength: 0 }))
      .toMatchObject({ crossLength: 3, waveAmplitude: 0, waveLength: 0.25 });
    expect(RegionDisplayProfiles.normalize({ crossLength: -1, waveAmplitude: 99, waveLength: 99 }))
      .toMatchObject({ crossLength: 1, waveAmplitude: 1, waveLength: 4 });
  });

  it("fills a missing cross rotation as upright and resolves/clamps rotation overrides independently of line angles", () => {
    setMockSettings({ "region-display-profiles": {
      legacy: { name: "Old Crosses", pattern: "crosses", angle: 45 },
      rotated: { name: "Rotated Crosses", pattern: "crosses", crossRotation: 30, angle: 90 },
    } });
    const set = vi.spyOn(game.settings, "set");
    expect(RegionDisplayProfiles.get("legacy")).toMatchObject({ crossRotation: 0, angle: 45 });
    for (const blank of [undefined, null, ""]) {
      expect(RegionDisplayProfiles.resolve({ profile: "rotated", crossRotation: blank }))
        .toMatchObject({ crossRotation: 30, angle: 90 });
    }
    for (const zero of [0, "0", -1]) {
      expect(RegionDisplayProfiles.resolve({ profile: "rotated", crossRotation: zero })!.crossRotation).toBe(0);
    }
    expect(RegionDisplayProfiles.resolve({ profile: "rotated", crossRotation: 200 })!.crossRotation).toBe(90);
    expect(RegionDisplayProfiles.normalize({ crossRotation: -5 }).crossRotation).toBe(0);
    expect(RegionDisplayProfiles.normalize({ crossRotation: 200 }).crossRotation).toBe(90);
    expect(set).not.toHaveBeenCalled();
  });

  it("ships four built-ins in order and tolerates an unset setting", () => {
    const all = RegionDisplayProfiles.all();
    expect(all.map((profile) => profile.id)).toEqual(["aura", "damage", "status", "minimal"]);
    expect(all.every((profile) => profile.builtin)).toBe(true);
    expect(all.every((profile) => profile.gapOpacity === 0 && profile.borderOpacity === null)).toBe(true);
    expect(RegionDisplayProfiles.get("nope")).toBeNull();
    expect(RegionDisplayProfiles.get("")).toBeNull();
    expect(RegionDisplayProfiles.choices()).toEqual(all.map((profile) => ({ value: profile.id, label: profile.name })));
  });

  it("lets a stored profile replace a built-in and lists custom ones by name", () => {
    setMockSettings({
      "region-display-profiles": {
        aura: { name: "Aura", pattern: "solid", opacity: 0.9, spacing: 0.5, thickness: 0.15, edgeWidth: 0.25, color: null },
        zeta: { name: "Zeta", pattern: "dots", opacity: 0.3, spacing: 0.2, thickness: 0.4, edgeWidth: 0.25, color: "#00ff00" },
        alpha: { name: "Alpha", pattern: "edge", opacity: 0.6, spacing: 0.5, thickness: 0.5, edgeWidth: 0.3, color: null },
        junk: "not a profile",
      },
    });
    const all = RegionDisplayProfiles.all();
    expect(all.map((profile) => profile.id)).toEqual(["aura", "damage", "status", "minimal", "alpha", "zeta"]);
    expect(RegionDisplayProfiles.get("aura")).toMatchObject({ pattern: "solid", opacity: 0.9, builtin: true });
    expect(RegionDisplayProfiles.isOverriddenBuiltin("aura")).toBe(true);
    expect(RegionDisplayProfiles.isOverriddenBuiltin("damage")).toBe(false);
    expect(RegionDisplayProfiles.get("zeta")).toMatchObject({ builtin: false, color: "#00ff00" });
  });

  it("normalizes untrusted data into range", () => {
    const profile = RegionDisplayProfiles.normalize({
      name: "  Wild One  ", pattern: "swirl" as any, opacity: 7, spacing: "0.3", thickness: -1, edgeWidth: "x", color: " ",
    } as any);
    expect(profile.id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(profile).toEqual({
      ...REGION_DISPLAY_DEFAULTS,
      id: profile.id, name: "Wild One", pattern: "hatch", opacity: 1, spacing: 0.3, thickness: 0.02, edgeWidth: 0.25,
      color: null, builtin: false,
    });
    expect(RegionDisplayProfiles.normalize({ name: "Tilted", angle: 400, border: "border", borderWidth: "0.3" } as any))
      .toMatchObject({ angle: 180, border: true, borderWidth: 0.3 });
    expect(RegionDisplayProfiles.normalize({ name: "Dashes", dashed: "dashed", dashLength: "0.5" } as any)).toMatchObject({ dashed: true, dashLength: 0.5 });
    expect(RegionDisplayProfiles.normalize({ id: " kept ", name: "Kept" }).id).toBe("kept");
  });

  it("resolves a flag over its profile, inheriting blank overrides", () => {
    expect(RegionDisplayProfiles.resolve(undefined)).toBeNull();
    expect(RegionDisplayProfiles.resolve({ profile: "" })).toBeNull();
    expect(RegionDisplayProfiles.resolve({ profile: "missing", opacity: 1 })).toBeNull();
    const damage = BUILTIN_REGION_DISPLAY_PROFILES[1];
    expect(RegionDisplayProfiles.resolve({ profile: "damage" })).toEqual({
      profile: "damage", pattern: damage.pattern, opacity: damage.opacity, spacing: damage.spacing,
      gapOpacity: 0, borderOpacity: damage.opacity,
      crossRotation: 0, crossLength: 1, waveAmplitude: 0.25, waveLength: 1, offset: 0,
      thickness: damage.thickness, edgeWidth: damage.edgeWidth, dashed: false, dashLength: 0.25, angle: 45, border: false, borderWidth: 0.1, color: null,
    });
    expect(RegionDisplayProfiles.resolve({
      profile: "damage", pattern: "dots", opacity: "0.75", spacing: null, thickness: "", edgeWidth: 9, dashed: "dashed", dashLength: "1", color: "#123456",
    })).toEqual({
      profile: "damage", pattern: "dots", opacity: 0.75, spacing: damage.spacing, thickness: damage.thickness, edgeWidth: 2,
      gapOpacity: 0, borderOpacity: 0.75,
      crossRotation: 0, crossLength: 1, waveAmplitude: 0.25, waveLength: 1, offset: 0,
      dashed: true, dashLength: 1, angle: 45, border: false, borderWidth: 0.1, color: "#123456",
    });
    expect(RegionDisplayProfiles.resolve({ profile: "damage", angle: "90", border: "border", borderWidth: 0.5 })).toMatchObject({ angle: 90, border: true, borderWidth: 0.5 });
    expect(RegionDisplayProfiles.resolve({ profile: "damage", border: "none" })!.border).toBe(false);
    expect(RegionDisplayProfiles.resolve({ profile: "damage", dashed: "continuous" })!.dashed).toBe(false);
    expect(RegionDisplayProfiles.resolve({ profile: "damage", dashed: "" })!.dashed).toBe(false);
    expect(RegionDisplayProfiles.resolve({ profile: "damage", dashed: true })!.dashed).toBe(true);
  });

  it("saves, removes and resets through the world setting and announces the change", async () => {
    const set = vi.spyOn(game.settings, "set");
    const saved = await RegionDisplayProfiles.save({ name: "Fog", pattern: "dots", opacity: 0.4 });
    expect(saved).toMatchObject({ name: "Fog", pattern: "dots", opacity: 0.4, builtin: false });
    expect(saved.id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(set).toHaveBeenCalledWith("ddb-importer", "region-display-profiles", { [saved.id]: expect.objectContaining({ name: "Fog" }) });
    expect(set.mock.calls[0][2]).not.toHaveProperty(`${saved.id}.builtin`);
    // the change reaches every client through the world setting's onChange, not a local call
    expect(callAll).not.toHaveBeenCalled();
    // the raw definition: the test mock's deepClone is a JSON round trip, which would drop the function
    const registered = (SETTINGS.DEFAULT_SETTINGS.EARLY as Record<string, { onChange?: () => void }>)["region-display-profiles"];
    registered.onChange?.();
    expect(callAll).toHaveBeenCalledWith(REGION_DISPLAY_PROFILES_CHANGED);

    // a shipped id becomes a stored override that keeps the rest of the shipped values
    set.mockClear();
    const aura = await RegionDisplayProfiles.save({ id: "aura", opacity: 0.3 });
    expect(aura).toMatchObject({ id: "aura", name: "Aura", pattern: "hatch", opacity: 0.3, builtin: true });

    setMockSettings({ "region-display-profiles": { [saved.id]: { ...saved }, aura: { ...aura } } });
    set.mockClear();
    await RegionDisplayProfiles.remove("aura");
    expect(set).toHaveBeenCalledWith("ddb-importer", "region-display-profiles", { [saved.id]: expect.objectContaining({ name: "Fog" }) });
    set.mockClear();
    await RegionDisplayProfiles.remove("absent");
    expect(set).not.toHaveBeenCalled();
  });

  it("gives new profiles random document ids", () => {
    const a = RegionDisplayProfiles.newId();
    const b = RegionDisplayProfiles.newId();
    expect(a).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(a).not.toBe(b);
  });

  it("fills partial stored profiles from Foundry's look, never a shipped profile's, without rewriting them", () => {
    const raw = { aura: { opacity: 0.6 }, custom: { name: "Old", opacity: 0.8 }, unnamed: { pattern: "dots" } };
    setMockSettings({ "region-display-profiles": raw });
    const set = vi.spyOn(game.settings, "set");
    for (const profile of ["aura", "custom"]) {
      expect(RegionDisplayProfiles.get(profile)).toMatchObject({ gapOpacity: 0.3333, borderOpacity: null });
      expect(RegionDisplayProfiles.resolve({ profile, opacity: 0.2 })).toMatchObject({ gapOpacity: 0.3333, borderOpacity: 0.2 });
    }
    expect(RegionDisplayProfiles.get("damage")!.gapOpacity).toBe(0);
    // the first shipped profile (Aura) draws a border at 135 degrees; a partial profile must not inherit that
    expect(RegionDisplayProfiles.get("unnamed")).toMatchObject({
      name: "New Profile", pattern: "dots", opacity: 0.5, spacing: 0.11, thickness: 0.5, angle: 45, border: false, dashed: false,
    });
    expect(raw.aura).not.toHaveProperty("gapOpacity");
    expect(set).not.toHaveBeenCalled();
  });

  it("inherits independent border opacity and handles blanks, zero and clamping", () => {
    setMockSettings({ "region-display-profiles": { custom: { name: "New", gapOpacity: 0.4, borderOpacity: 0.9 } } });
    for (const blank of [undefined, null, ""]) {
      expect(RegionDisplayProfiles.resolve({ profile: "custom", opacity: 0, gapOpacity: blank, borderOpacity: blank }))
        .toMatchObject({ opacity: 0, gapOpacity: 0.4, borderOpacity: 0.9 });
    }
    for (const zero of [0, "0", -5]) {
      expect(RegionDisplayProfiles.resolve({ profile: "custom", gapOpacity: zero, borderOpacity: zero }))
        .toMatchObject({ gapOpacity: 0, borderOpacity: 0 });
    }
    expect(RegionDisplayProfiles.resolve({ profile: "custom", gapOpacity: 3, borderOpacity: "2" }))
      .toMatchObject({ gapOpacity: 1, borderOpacity: 1 });
    const base = RegionDisplayProfiles.get("custom")!;
    expect(RegionDisplayProfiles.normalize({ gapOpacity: -1, borderOpacity: -1 }, base))
      .toMatchObject({ gapOpacity: 0, borderOpacity: 0 });
    expect(RegionDisplayProfiles.normalize({ gapOpacity: 5, borderOpacity: 5 }, base))
      .toMatchObject({ gapOpacity: 1, borderOpacity: 1 });
    expect(RegionDisplayProfiles.normalize({ borderOpacity: null }, base).borderOpacity).toBeNull();
    expect(RegionDisplayProfiles.normalize({}, base).borderOpacity).toBe(0.9);
    expect(RegionDisplayProfiles.resolve({ profile: "damage", opacity: 0 })).toMatchObject({ borderOpacity: 0 });
  });

  it("turns a count per square into an even spacing and back", () => {
    expect(RegionDisplayProfiles.spacingForCount(3)).toBe(0.3333);
    expect(RegionDisplayProfiles.spacingForCount("4")).toBe(0.25);
    expect(RegionDisplayProfiles.spacingForCount(2.6)).toBe(0.3333);
    expect(RegionDisplayProfiles.spacingForCount(1)).toBe(1);
    // more than twenty per square is below the spacing floor
    expect(RegionDisplayProfiles.spacingForCount(50)).toBe(0.05);
    for (const bad of [0, -1, "", "x", null, undefined]) expect(RegionDisplayProfiles.spacingForCount(bad)).toBeNull();
    expect(RegionDisplayProfiles.countForSpacing(0.3333)).toBe(3);
    expect(RegionDisplayProfiles.countForSpacing("0.25")).toBe(4);
    expect(RegionDisplayProfiles.countForSpacing(1)).toBe(1);
    // 0.35 is not a whole number of symbols per square, and 2 squares per symbol is not a count
    for (const off of [0.35, 2, 0, "", null]) expect(RegionDisplayProfiles.countForSpacing(off)).toBeNull();
  });

  it("carries the pattern offset through profiles and overrides, clamped to one period", () => {
    setMockSettings({ "region-display-profiles": { corner: { name: "Corner", pattern: "crosses", offset: 0.5 } } });
    expect(RegionDisplayProfiles.get("corner")!.offset).toBe(0.5);
    expect(RegionDisplayProfiles.get("aura")!.offset).toBe(0);
    expect(RegionDisplayProfiles.resolve({ profile: "corner" })!.offset).toBe(0.5);
    expect(RegionDisplayProfiles.resolve({ profile: "corner", offset: "" })!.offset).toBe(0.5);
    expect(RegionDisplayProfiles.resolve({ profile: "corner", offset: 0 })!.offset).toBe(0);
    expect(RegionDisplayProfiles.resolve({ profile: "corner", offset: "0.25" })!.offset).toBe(0.25);
    expect(RegionDisplayProfiles.resolve({ profile: "corner", offset: 3 })!.offset).toBe(1);
    expect(RegionDisplayProfiles.normalize({ offset: -1 }).offset).toBe(0);
  });
});

describe("RegionDisplayProfiles field rules", () => {
  const style = (pattern: TRegionDisplayPattern, extra: Partial<TRegionDisplayFieldContext> = {}) =>
    ({ pattern, dashed: false, border: false, ...extra });

  it("shows each field only for the patterns and toggles it applies to", () => {
    expect(RegionDisplayProfiles.fieldApplies("opacity", style("edge"))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("gapOpacity", style("solid"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("gapOpacity", style("dots"))).toBe(true);
    // solid has no pattern to space, size or shift
    for (const key of ["spacing", "thickness", "offset"] as const) {
      expect(RegionDisplayProfiles.fieldApplies(key, style("solid"))).toBe(false);
      expect(RegionDisplayProfiles.fieldApplies(key, style("dots"))).toBe(true);
    }
    expect(RegionDisplayProfiles.fieldApplies("opacity", style("solid"))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("spacing", style("edge"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("thickness", style("checkerboard"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("edgeWidth", style("edge"))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("edgeWidth", style("hatch"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("crossRotation", style("crosses"))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("crossRotation", style("dots"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("waveLength", style("waves"))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("waveLength", style("chevrons"))).toBe(false);
    for (const pattern of ["hatch", "crosshatch", "waves", "chevrons"] as const) {
      expect(RegionDisplayProfiles.fieldApplies("angle", style(pattern))).toBe(true);
      expect(RegionDisplayProfiles.toggleApplies("dashed", pattern)).toBe(true);
    }
    expect(RegionDisplayProfiles.fieldApplies("angle", style("dots"))).toBe(false);
    expect(RegionDisplayProfiles.toggleApplies("dashed", "dots")).toBe(false);
    // dash length needs dashes, border width a border, border opacity any band
    expect(RegionDisplayProfiles.fieldApplies("dashLength", style("hatch"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("dashLength", style("hatch", { dashed: true }))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("dashLength", style("dots", { dashed: true }))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("borderWidth", style("dots", { border: true }))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("borderWidth", style("edge", { border: true }))).toBe(false);
    expect(RegionDisplayProfiles.toggleApplies("border", "edge")).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("borderOpacity", style("dots"))).toBe(false);
    expect(RegionDisplayProfiles.fieldApplies("borderOpacity", style("dots", { border: true }))).toBe(true);
    expect(RegionDisplayProfiles.fieldApplies("borderOpacity", style("edge"))).toBe(true);
  });

  it("drops the overrides a resolved style cannot use and keeps the rest", () => {
    // aura is a bordered hatch, so a dots override loses the line and dash overrides but keeps its border width
    const flag: IRegionDisplayFlag = {
      profile: "aura", pattern: "dots", angle: 120, dashed: "dashed", dashLength: 0.4, crossRotation: 45,
      spacing: 0.5, borderWidth: 0.2, offset: 0.5, color: "#123456",
    };
    expect(RegionDisplayProfiles.applicable(flag)).toEqual({
      profile: "aura", pattern: "dots", spacing: 0.5, borderWidth: 0.2, offset: 0.5, color: "#123456",
    });
    expect(flag.angle).toBe(120);
    // a dash length only draws once the lines are dashed, by override or by the profile
    expect(RegionDisplayProfiles.applicable({ profile: "aura", dashLength: 0.4 })).toEqual({ profile: "aura" });
    expect(RegionDisplayProfiles.applicable({ profile: "aura", dashed: "dashed", dashLength: 0.4 }))
      .toEqual({ profile: "aura", dashed: "dashed", dashLength: 0.4 });
    expect(RegionDisplayProfiles.applicable({ profile: "aura", pattern: "solid", spacing: 1, thickness: 0.5, offset: 0.5, opacity: 0.3 }))
      .toEqual({ profile: "aura", pattern: "solid", opacity: 0.3 });
    // nothing to judge against without a profile
    expect(RegionDisplayProfiles.applicable({ profile: "gone", angle: 5 })).toEqual({ profile: "gone", angle: 5 });
  });

  describe("with en.json", () => {
    let restore: () => void;
    beforeEach(() => {
      restore = useEnLocalization();
    });
    afterEach(() => restore());

    it("reads labels and hints from en.json, with a pattern's own hint where it has one", () => {
      expect(RegionDisplayProfiles.fieldLabel("crossRotation")).toBe("Cross Rotation");
      expect(RegionDisplayProfiles.fieldHint("spacing", "hatch")).toBe("Distance between lines or symbols, in grid squares.");
      expect(RegionDisplayProfiles.fieldHint("spacing", "checkerboard")).toBe("Side length of each checkerboard square, in grid squares.");
      expect(RegionDisplayProfiles.fieldHint("thickness", "crosses")).toMatch(/^Base cross size/);
      expect(RegionDisplayProfiles.fieldHint("thickness", null)).toMatch(/^Line width or symbol diameter/);
      expect(RegionDisplayProfiles.patternLabel("hollowDots")).toBe("Hollow Dots");
    });
  });

  it("has an en.json entry for every field, pattern hint and pattern the table names", () => {
    const root = "ddb-importer.behaviors.display";
    for (const { key, patternHints = [] } of REGION_DISPLAY_FIELDS) {
      expect(enString(`${root}.FIELDS.${key}.label`), key).toBeTypeOf("string");
      expect(enString(`${root}.FIELDS.${key}.hint`), key).toBeTypeOf("string");
      for (const pattern of patternHints) expect(enString(`${root}.FIELDS.${key}.hints.${pattern}`), `${key}.${pattern}`).toBeTypeOf("string");
    }
    for (const pattern of REGION_DISPLAY_PATTERNS) expect(enString(`${root}.patterns.${pattern}`), pattern).toBeTypeOf("string");
    for (const key of ["noProfile", "unknownProfile", "profileDefault", "dashed", "continuous", "border", "noBorder", "summaryColor"]) {
      expect(enString(`${root}.${key}`), key).toBeTypeOf("string");
    }
  });
});
