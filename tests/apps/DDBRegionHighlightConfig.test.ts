import DDBRegionHighlightConfig, { activityBehaviorHighlightTarget, regionHighlightTarget } from "../../src/apps/DDBRegionHighlightConfig";
import { behaviorConfigFromFlag, describeHighlightFlag, flagFromBehaviorConfig } from "../../src/hooks/canvas/regionHighlightSummary";
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

describe("highlight targets", () => {
  it("reads and writes a region's flag through the document", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const region = { uuid: "Scene.a.Region.b", name: "Fire", color: "#00ff00", flags: { ddbimporter: { highlight: { profile: "aura", opacity: 0.8 } } }, update };
    const target = regionHighlightTarget(region);
    expect(target.key).toBe("Scene.a.Region.b");
    expect(target.title).toBe("Region Texture: Fire");
    expect(target.color).toBe("#00ff00");
    expect(target.read()).toEqual({ profile: "aura", opacity: 0.8 });
    await target.write({ profile: "damage" });
    expect(update).toHaveBeenCalledWith({ "flags.ddbimporter.highlight.profile": "damage", "flags.ddbimporter.highlight.-=opacity": null });
  });

  it("reads and writes an activity behavior by id, rebuilding the behaviors array", async () => {
    const behaviors = [
      { _id: "aaa", type: "applyActiveEffect", config: { effects: [] } },
      { _id: "bbb", type: "ddbHighlight", config: { profile: "aura", pattern: "", opacity: null, spacing: 0.5, dashed: "dashed", border: "", color: null } },
    ];
    const update = vi.fn().mockResolvedValue(undefined);
    const activity = { uuid: "Item.x.Activity.y", name: "Aura", item: { name: "Aura of Protection" }, toObject: () => ({ behaviors: foundry.utils.deepClone(behaviors) }), update };
    const target = activityBehaviorHighlightTarget(activity, "bbb");
    expect(target.key).toBe("Item.x.Activity.y.behavior.bbb");
    expect(target.title).toBe("Region Texture: Aura of Protection: Aura");
    expect(target.read()).toEqual({ profile: "aura", spacing: 0.5, dashed: "dashed" });
    await target.write({ profile: "status", pattern: "diamonds", opacity: 0, color: "#123456" });
    const written = update.mock.calls[0][0].behaviors;
    expect(written[0]).toEqual(behaviors[0]);
    expect(written[1]).toEqual({ _id: "bbb", type: "ddbHighlight", config: {
      profile: "status", pattern: "diamonds", color: "#123456", dashed: "", border: "",
      opacity: 0, gapOpacity: null, borderOpacity: null, spacing: null, thickness: null, edgeWidth: null, dashLength: null, angle: null, borderWidth: null,
    } });
    await expect(activityBehaviorHighlightTarget(activity, "zzz").write({ profile: "aura" })).rejects.toThrow("zzz");
  });

  it("round-trips a flag through the behavior config, dropping blanks", () => {
    const flag = { profile: "damage", pattern: "dots" as const, dashed: "continuous" as const, border: "border" as const, angle: 30, color: "#abcdef" };
    const config = behaviorConfigFromFlag(flag);
    expect(config).toMatchObject({ profile: "damage", pattern: "dots", dashed: "continuous", border: "border", angle: 30, color: "#abcdef", opacity: null });
    expect(flagFromBehaviorConfig(config)).toEqual(flag);
    expect(flagFromBehaviorConfig({ profile: "aura", dashed: true, border: false, opacity: "0.5", pattern: "nope" })).toEqual({ profile: "aura", dashed: true, border: false, opacity: "0.5" });
    expect(behaviorConfigFromFlag({ profile: "aura", dashed: true, border: false })).toMatchObject({ dashed: "dashed", border: "none" });
    expect(flagFromBehaviorConfig(undefined)).toEqual({ profile: "" });
  });
});
