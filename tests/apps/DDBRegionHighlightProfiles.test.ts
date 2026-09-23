import DDBRegionHighlightProfiles from "../../src/apps/DDBRegionHighlightProfiles";
import { BUILTIN_REGION_HIGHLIGHT_PROFILES } from "../../src/config/regionHighlightProfiles";
import RegionHighlightProfiles from "../../src/lib/RegionHighlightProfiles";
import { setMockSettings } from "../_setup/foundryMocks";

const aura = { ...BUILTIN_REGION_HIGHLIGHT_PROFILES[0] };

describe("DDBRegionHighlightProfiles.draftFromForm", () => {
  it("unticking the region-colour box gives the draft the remembered custom colour", () => {
    // the colour picker is not in the form yet: it only renders once the box is unticked
    const { draft, lastCustomColor } = DDBRegionHighlightProfiles.draftFromForm({ useRegionColor: false }, aura, "#123456");
    expect(draft.color).toBe("#123456");
    expect(lastCustomColor).toBe("#123456");
  });

  it("ticking the box clears the colour but keeps the custom one for next time", () => {
    const { draft, lastCustomColor } = DDBRegionHighlightProfiles.draftFromForm(
      { useRegionColor: true, color: "#abcdef" }, { ...aura, color: "#abcdef" }, "#123456",
    );
    expect(draft.color).toBeNull();
    expect(lastCustomColor).toBe("#abcdef");
  });

  it("takes a picked colour and the numeric fields, clamping them", () => {
    const { draft } = DDBRegionHighlightProfiles.draftFromForm(
      { useRegionColor: false, color: " #00ff00 ", opacity: "0.3", spacing: 9, thickness: "", pattern: "dots", name: "Mine" },
      aura, "#123456",
    );
    expect(draft).toMatchObject({ name: "Mine", pattern: "dots", opacity: 0.3, spacing: 4, thickness: aura.thickness, color: "#00ff00", dashed: false });
    const dashed = DDBRegionHighlightProfiles.draftFromForm({ dashed: true, dashLength: "0.4", angle: 120, border: true, borderWidth: "0.5" }, aura, "#123456").draft;
    expect(dashed).toMatchObject({ dashed: true, dashLength: 0.4, angle: 120, border: true, borderWidth: 0.5 });
  });

  it("unlinks borders at the current fill opacity and preserves independent zero across hidden controls", () => {
    const unlinked = DDBRegionHighlightProfiles.draftFromForm({ matchFillOpacity: false, opacity: 0.4 }, aura, "#123456").draft;
    expect(unlinked.borderOpacity).toBe(0.4);
    const hidden = DDBRegionHighlightProfiles.draftFromForm({ border: false, opacity: 0.8 }, { ...unlinked, borderOpacity: 0 }, "#123456").draft;
    expect(hidden.borderOpacity).toBe(0);
    const linked = DDBRegionHighlightProfiles.draftFromForm({ matchFillOpacity: true, borderOpacity: 0.9 }, hidden, "#123456").draft;
    expect(linked.borderOpacity).toBeNull();
  });

  it.each(["hollowDots", "diamonds"] as const)("saves and reopens %s with transparent gaps and an independent border", async (pattern) => {
    const { draft } = DDBRegionHighlightProfiles.draftFromForm({
      pattern, opacity: "0", gapOpacity: "0", border: true, matchFillOpacity: false, borderOpacity: "0.8",
    }, { ...aura, id: "custom" }, "#123456");
    const set = vi.spyOn(game.settings, "set");
    await RegionHighlightProfiles.save(draft);
    const persisted = set.mock.calls.at(-1)![2];
    setMockSettings({ "region-highlight-profiles": persisted });
    const reopened = RegionHighlightProfiles.get("custom")!;
    expect(reopened).toMatchObject({ pattern, opacity: 0, gapOpacity: 0, borderOpacity: 0.8 });
    const linked = DDBRegionHighlightProfiles.draftFromForm({ matchFillOpacity: true }, reopened, "#123456").draft;
    await RegionHighlightProfiles.save(linked);
    setMockSettings({ "region-highlight-profiles": set.mock.calls.at(-1)![2] });
    expect(RegionHighlightProfiles.get("custom")!.borderOpacity).toBeNull();
    expect(RegionHighlightProfiles.resolve({ profile: "custom", opacity: 0.25 })!.borderOpacity).toBe(0.25);
    set.mockRestore();
  });
});
