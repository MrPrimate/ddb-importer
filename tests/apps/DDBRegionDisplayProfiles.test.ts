import logger from "../../src/lib/Logger";
import DDBRegionDisplayProfiles, { DDBRegionDisplayProfilesMenu } from "../../src/apps/DDBRegionDisplayProfiles";
import { BUILTIN_REGION_DISPLAY_PROFILES, REGION_DISPLAY_DEFAULTS } from "../../src/config/regionDisplayProfiles";
import RegionDisplayProfiles from "../../src/lib/RegionDisplayProfiles";
import { setMockSettings } from "../_setup/foundryMocks";

const aura = { ...BUILTIN_REGION_DISPLAY_PROFILES[0] };

describe("DDBRegionDisplayProfiles.draftFromForm", () => {
  it.each(["stretch", "contain"] as const)("saves and reopens Fill Image sizing %s", async (textureFit) => {
    const { draft } = DDBRegionDisplayProfiles.draftFromForm({
      pattern: "imageStretch", textureFit, textureSrc: "systems/dnd5e/icons/svg/damage/fire.svg", textureColorMode: "region",
    }, { ...aura, id: "image" }, "#ff4500");
    const write = vi.spyOn(game.settings, "set");
    await RegionDisplayProfiles.save(draft);
    setMockSettings({ "region-display-profiles": write.mock.calls.at(-1)![2] });
    expect(RegionDisplayProfiles.get("image")).toMatchObject({ pattern: "imageStretch", textureFit, textureSrc: draft.textureSrc });
    expect(DDBRegionDisplayProfiles.draftFromForm({ pattern: "dots" }, draft, "#ff4500").draft.textureFit).toBe(textureFit);
    write.mockRestore();
  });

  it("unticking the region-colour box gives the draft the remembered custom colour", () => {
    // the colour picker is not in the form yet: it only renders once the box is unticked
    const { draft, lastCustomColor } = DDBRegionDisplayProfiles.draftFromForm({ useRegionColor: false }, aura, "#123456");
    expect(draft.color).toBe("#123456");
    expect(lastCustomColor).toBe("#123456");
  });

  it("ticking the box clears the colour but keeps the custom one for next time", () => {
    const { draft, lastCustomColor } = DDBRegionDisplayProfiles.draftFromForm(
      { useRegionColor: true, color: "#abcdef" }, { ...aura, color: "#abcdef" }, "#123456",
    );
    expect(draft.color).toBeNull();
    expect(lastCustomColor).toBe("#abcdef");
  });

  it("takes a picked colour and the numeric fields, clamping them", () => {
    const { draft } = DDBRegionDisplayProfiles.draftFromForm(
      { useRegionColor: false, color: " #00ff00 ", opacity: "0.3", spacing: 9, thickness: "", pattern: "dots", name: "Mine" },
      aura, "#123456",
    );
    expect(draft).toMatchObject({ name: "Mine", pattern: "dots", opacity: 0.3, spacing: 4, thickness: aura.thickness, color: "#00ff00", dashed: false });
    const dashed = DDBRegionDisplayProfiles.draftFromForm({ dashed: true, dashLength: "0.4", angle: 120, border: true, borderWidth: "0.5" }, aura, "#123456").draft;
    expect(dashed).toMatchObject({ dashed: true, dashLength: 0.4, angle: 120, border: true, borderWidth: 0.5 });
    // the per-square count is a transient control, not a profile field; the offset is stored
    const offset = DDBRegionDisplayProfiles.draftFromForm({ offset: "0.5", perSquare: 3 } as any, aura, "#123456").draft;
    expect(offset.offset).toBe(0.5);
    expect(offset).not.toHaveProperty("perSquare");
    expect(offset.spacing).toBe(aura.spacing);
    // a count-driven spacing puts the slider on a fine step, so every move it reports is real,
    // including ones within the coarse step of the current value
    const third = { ...aura, spacing: 0.3333 };
    expect(DDBRegionDisplayProfiles.draftFromForm({ spacing: 0.34 }, third, "#123456").draft.spacing).toBe(0.34);
    expect(DDBRegionDisplayProfiles.draftFromForm({ spacing: "0.36" }, third, "#123456").draft.spacing).toBe(0.36);
    expect(DDBRegionDisplayProfiles.draftFromForm({ spacing: "" }, third, "#123456").draft.spacing).toBe(0.3333);
    expect(DDBRegionDisplayProfiles.draftFromForm({}, third, "#123456").draft.spacing).toBe(0.3333);
    expect(DDBRegionDisplayProfiles.spacingStep(0.35)).toBe(0.05);
    expect(DDBRegionDisplayProfiles.spacingStep(0.3333)).toBe(0.0001);
  });

  it("unlinks borders at the current fill opacity and preserves independent zero across hidden controls", () => {
    const unlinked = DDBRegionDisplayProfiles.draftFromForm({ matchFillOpacity: false, opacity: 0.4 }, aura, "#123456").draft;
    expect(unlinked.borderOpacity).toBe(0.4);
    const hidden = DDBRegionDisplayProfiles.draftFromForm({ border: false, opacity: 0.8 }, { ...unlinked, borderOpacity: 0 }, "#123456").draft;
    expect(hidden.borderOpacity).toBe(0);
    const linked = DDBRegionDisplayProfiles.draftFromForm({ matchFillOpacity: true, borderOpacity: 0.9 }, hidden, "#123456").draft;
    expect(linked.borderOpacity).toBeNull();
  });

  it.each(["hollowDots", "diamonds", "crosses", "checkerboard", "waves", "chevrons"] as const)("saves and reopens %s with transparent gaps and an independent border", async (pattern) => {
    const { draft } = DDBRegionDisplayProfiles.draftFromForm({
      pattern, opacity: "0", gapOpacity: "0", border: true, matchFillOpacity: false, borderOpacity: "0.8",
      crossRotation: pattern === "crosses" ? "45" : "0",
      crossLength: "2.5", waveAmplitude: "0", waveLength: "0.5",
      angle: "30", dashed: true, dashLength: "0.4",
    }, { ...aura, id: "custom" }, "#123456");
    const set = vi.spyOn(game.settings, "set");
    await RegionDisplayProfiles.save(draft);
    const persisted = set.mock.calls.at(-1)![2];
    setMockSettings({ "region-display-profiles": persisted });
    const reopened = RegionDisplayProfiles.get("custom")!;
    expect(reopened).toMatchObject({ pattern, opacity: 0, gapOpacity: 0, borderOpacity: 0.8 });
    expect(reopened).toMatchObject({ angle: 30, dashed: true, dashLength: 0.4 });
    expect(reopened.crossRotation).toBe(pattern === "crosses" ? 45 : 0);
    expect(reopened).toMatchObject({ crossLength: 2.5, waveAmplitude: 0, waveLength: 0.5 });
    const switched = DDBRegionDisplayProfiles.draftFromForm({ pattern: "dots" }, reopened, "#123456").draft;
    expect(switched).toMatchObject({ crossLength: 2.5, waveAmplitude: 0, waveLength: 0.5 });
    const linked = DDBRegionDisplayProfiles.draftFromForm({ matchFillOpacity: true }, reopened, "#123456").draft;
    await RegionDisplayProfiles.save(linked);
    setMockSettings({ "region-display-profiles": set.mock.calls.at(-1)![2] });
    expect(RegionDisplayProfiles.get("custom")!.borderOpacity).toBeNull();
    expect(RegionDisplayProfiles.resolve({ profile: "custom", opacity: 0.25 })!.borderOpacity).toBe(0.25);
    set.mockRestore();
  });
});

describe("DDBRegionDisplayProfiles.createProfile", () => {
  it("starts a new profile from Foundry's own look", () => {
    const app = { draft: null, selectedId: "aura", render: vi.fn() } as unknown as DDBRegionDisplayProfiles;
    DDBRegionDisplayProfiles.createProfile.call(app);
    expect(app.draft).toMatchObject({ ...REGION_DISPLAY_DEFAULTS, name: "New Profile", builtin: false });
    expect(app.draft!.id).toMatch(/^[a-zA-Z0-9]{16}$/);
    expect(app.selectedId).toBeNull();
  });
});

describe("DDBRegionDisplayProfiles.open", () => {
  // the ApplicationV2 stub has no render; install one on the prototype for the calls to land on
  const proto = DDBRegionDisplayProfiles.prototype as unknown as Record<string, unknown>;
  const user = game.user as unknown as { can?: (permission: string) => boolean };

  beforeEach(() => {
    proto.render = vi.fn(async function (this: unknown) {
      return this;
    });
  });

  afterEach(() => {
    delete proto.render;
    delete user.can;
    foundry.applications.instances.delete("ddb-region-display-profiles");
  });

  it("refuses a user who cannot change world settings, whichever way they come in", () => {
    user.can = vi.fn(() => false);
    const warn = vi.spyOn(ui.notifications!, "warn");
    expect(DDBRegionDisplayProfiles.open({ profileId: "aura" })).toBeNull();
    expect(user.can).toHaveBeenCalledWith("SETTINGS_MODIFY");
    expect(warn).toHaveBeenCalledWith("ddb-importer.behaviors.display.profilesPermission");
    expect(proto.render).not.toHaveBeenCalled();
    // a window built directly is stopped at render with the same message
    const direct = new DDBRegionDisplayProfiles();
    expect(() => (direct as unknown as { _canRender(options: unknown): unknown })._canRender({}))
      .toThrow("ddb-importer.behaviors.display.profilesPermission");
    warn.mockRestore();
  });

  it("starts on a profile, adopts a window already open, and keeps one window across opens", () => {
    user.can = vi.fn(() => true);
    const direct = new DDBRegionDisplayProfiles();
    // built with no options, as Foundry builds a settings menu class, it is not empty
    expect(direct.draft?.id).toBe(RegionDisplayProfiles.all()[0].id);
    foundry.applications.instances.set("ddb-region-display-profiles", direct);
    const first = DDBRegionDisplayProfiles.open({ profileId: "status" });
    expect(first).toBe(direct);
    expect(first!.selectedId).toBe("status");
    expect(proto.render).toHaveBeenLastCalledWith({ force: true });
    // reopening without a profile keeps the draft; naming one moves to it, still in the same window
    expect(DDBRegionDisplayProfiles.open()).toBe(direct);
    expect(direct.selectedId).toBe("status");
    expect(DDBRegionDisplayProfiles.open({ profileId: "aura" })).toBe(direct);
    expect(direct.selectedId).toBe("aura");
  });

  it("logs a render that fails rather than leaving an unhandled rejection, and forgets that window", async () => {
    user.can = vi.fn(() => true);
    const refusal = new Error("template failed to render");
    proto.render = vi.fn(async () => {
      throw refusal;
    });
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    const first = DDBRegionDisplayProfiles.open();
    await vi.waitFor(() => expect(warn).toHaveBeenCalledWith("Region display profiles editor could not open", refusal));
    // the next open builds a fresh window instead of reusing the one that never opened
    proto.render = vi.fn(async function (this: unknown) {
      return this;
    });
    expect(DDBRegionDisplayProfiles.open()).not.toBe(first);
    warn.mockRestore();
  });

  it("gives the settings menu a stand-in that hands over to the one editor", async () => {
    const open = vi.spyOn(DDBRegionDisplayProfiles, "open").mockImplementation(() => null);
    const menu = new DDBRegionDisplayProfilesMenu();
    await expect(menu.render()).resolves.toBe(menu);
    expect(open).toHaveBeenCalledTimes(1);
    open.mockRestore();
  });
});
