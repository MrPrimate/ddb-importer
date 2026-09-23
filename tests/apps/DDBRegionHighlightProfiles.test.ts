import DDBRegionHighlightProfiles from "../../src/apps/DDBRegionHighlightProfiles";
import { BUILTIN_REGION_HIGHLIGHT_PROFILES } from "../../src/config/regionHighlightProfiles";

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
});
