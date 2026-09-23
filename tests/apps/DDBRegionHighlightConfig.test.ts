import DDBRegionHighlightConfig, { describeHighlightFlag } from "../../src/apps/DDBRegionHighlightConfig";
import { setMockSettings } from "../_setup/foundryMocks";

describe("DDBRegionHighlightConfig.flagFromForm", () => {
  it("keeps only filled overrides, clamped, and drops blanks", () => {
    const { flag } = DDBRegionHighlightConfig.flagFromForm(
      // Foundry's form reader gives a blank number input as null and a cleared text input as ""
      { profile: "damage", pattern: "", dashed: "dashed", border: "", opacity: "0.25", spacing: "", thickness: 9, angle: null as any, useProfileColor: true },
      { profile: "aura", pattern: "dots", spacing: 0.5, angle: 90, color: "#123456" },
      "#abcdef",
    );
    expect(flag).toEqual({ profile: "damage", dashed: "dashed", opacity: 0.25, thickness: 1 });
  });

  it("falls back to the draft for fields the form does not show", () => {
    const { flag } = DDBRegionHighlightConfig.flagFromForm(
      { profile: "status" },
      { profile: "aura", pattern: "dots", border: "border", spacing: 0.5, color: "#123456" },
      "#abcdef",
    );
    expect(flag).toEqual({ profile: "status", pattern: "dots", border: "border", spacing: 0.5, color: "#123456" });
  });

  it("remembers the custom colour across the profile-colour box", () => {
    const unticked = DDBRegionHighlightConfig.flagFromForm({ profile: "aura", useProfileColor: false }, { profile: "aura" }, "#abcdef");
    expect(unticked.flag.color).toBe("#abcdef");
    const picked = DDBRegionHighlightConfig.flagFromForm({ profile: "aura", useProfileColor: false, color: " #00ff00 " }, unticked.flag, unticked.lastCustomColor);
    expect(picked.flag.color).toBe("#00ff00");
    const ticked = DDBRegionHighlightConfig.flagFromForm({ profile: "aura", useProfileColor: true }, picked.flag, picked.lastCustomColor);
    expect(ticked.flag.color).toBeUndefined();
    expect(ticked.lastCustomColor).toBe("#00ff00");
  });
});

describe("DDBRegionHighlightConfig.updateData", () => {
  it("sets the kept keys and deletes the dropped ones", () => {
    const update = DDBRegionHighlightConfig.updateData(
      { profile: "aura", opacity: 0.8, spacing: 0.5, color: "#123456" },
      { profile: "damage", opacity: 0.25, dashed: "dashed" },
    );
    expect(update).toEqual({
      "flags.ddbimporter.highlight.profile": "damage",
      "flags.ddbimporter.highlight.opacity": 0.25,
      "flags.ddbimporter.highlight.dashed": "dashed",
      "flags.ddbimporter.highlight.-=spacing": null,
      "flags.ddbimporter.highlight.-=color": null,
    });
  });

  it("removes the whole flag without a profile, and deletes nothing that was never set", () => {
    expect(DDBRegionHighlightConfig.updateData({ profile: "aura" }, {})).toEqual({ "flags.ddbimporter.-=highlight": null });
    expect(DDBRegionHighlightConfig.updateData(undefined, { profile: "aura", angle: "" }))
      .toEqual({ "flags.ddbimporter.highlight.profile": "aura" });
  });
});

describe("describeHighlightFlag", () => {
  it("names the profile and each override, or the Foundry default", () => {
    setMockSettings({ "region-highlight-profiles": {} });
    expect(describeHighlightFlag(undefined)).toBe("None (Foundry default)");
    expect(describeHighlightFlag({ profile: "" })).toBe("None (Foundry default)");
    expect(describeHighlightFlag({ profile: "gone" })).toBe("Unknown profile \"gone\" (Foundry default)");
    expect(describeHighlightFlag({ profile: "aura" })).toBe("Aura");
    expect(describeHighlightFlag({ profile: "status", pattern: "hollowDots", border: "border", borderOpacity: "0.4", spacing: 9 }))
      .toBe("Status Effect, hollow dots, border, border opacity 0.4, spacing 4");
  });
});
