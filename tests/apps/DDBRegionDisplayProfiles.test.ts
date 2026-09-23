import DDBRegionDisplayProfiles from "../../src/apps/DDBRegionDisplayProfiles";
import { BUILTIN_REGION_DISPLAY_PROFILES, REGION_DISPLAY_DEFAULTS } from "../../src/config/regionDisplayProfiles";
import RegionDisplayProfiles from "../../src/lib/RegionDisplayProfiles";
import { setMockSettings } from "../_setup/foundryMocks";

const aura = { ...BUILTIN_REGION_DISPLAY_PROFILES[0] };

describe("DDBRegionDisplayProfiles.draftFromForm", () => {
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
