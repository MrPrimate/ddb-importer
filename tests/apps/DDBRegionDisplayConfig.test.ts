import DDBRegionDisplayConfig, { activityBehaviorDisplayTarget, regionDisplayTarget } from "../../src/apps/DDBRegionDisplayConfig";
import { behaviorConfigFromFlag, describeDisplayFlag, flagFromBehaviorConfig } from "../../src/hooks/canvas/regionDisplaySummary";
import { setMockSettings } from "../_setup/foundryMocks";
import { useEnLocalization } from "../_fixtures/enLocalize";

// summaries and titles are asserted in the words users see
let restoreLocalization: () => void;
beforeEach(() => {
  restoreLocalization = useEnLocalization();
});
afterEach(() => restoreLocalization());

describe("DDBRegionDisplayConfig.flagFromForm", () => {
  it("round-trips shape overrides, clears blanks and retains controls hidden by another pattern", () => {
    const draft: IRegionDisplayFlag = { profile: "status", pattern: "waves", crossLength: 2, waveAmplitude: 0.5, waveLength: 2 };
    const flag = DDBRegionDisplayConfig.flagFromForm({ waveAmplitude: "0", waveLength: "", crossLength: "3" }, draft, "#ffffff").flag;
    expect(flag).toEqual({ profile: "status", pattern: "waves", waveAmplitude: 0, crossLength: 3 });
    expect(flagFromBehaviorConfig(behaviorConfigFromFlag(flag))).toEqual(flag);
    expect(DDBRegionDisplayConfig.updateData(draft, flag)).toMatchObject({
      "flags.ddbimporter.display.waveAmplitude": 0,
      "flags.ddbimporter.display.crossLength": 3,
      "flags.ddbimporter.display.waveLength": _del,
    });
    expect(DDBRegionDisplayConfig.flagFromForm({ pattern: "dots" }, flag, "#ffffff").flag)
      .toEqual({ ...flag, pattern: "dots" });
  });

  it.each(["waves", "chevrons"] as const)("keeps %s overrides through form, behavior and document saves", (pattern) => {
    const flag = DDBRegionDisplayConfig.flagFromForm(
      { pattern, angle: "0", dashed: "dashed", dashLength: "0.4", gapOpacity: "0" },
      { profile: "status" }, "#ffffff",
    ).flag;
    expect(flag).toEqual({ profile: "status", pattern, angle: 0, dashed: "dashed", dashLength: 0.4, gapOpacity: 0 });
    expect(flagFromBehaviorConfig(behaviorConfigFromFlag(flag))).toEqual(flag);
    expect(DDBRegionDisplayConfig.updateData({}, flag)["flags.ddbimporter.display.pattern"]).toBe(pattern);
    expect(describeDisplayFlag(flag)).toContain(pattern);
  });

  it("inherits blank cross rotation but retains zero and hidden overrides through form and document updates", () => {
    const draft = { profile: "status", pattern: "crosses" as const, crossRotation: 45 };
    const zero = DDBRegionDisplayConfig.flagFromForm({ crossRotation: "0" }, draft, "#ffffff").flag;
    expect(zero.crossRotation).toBe(0);
    expect(DDBRegionDisplayConfig.updateData(draft, zero)["flags.ddbimporter.display.crossRotation"]).toBe(0);
    const inherited = DDBRegionDisplayConfig.flagFromForm({ crossRotation: "" }, draft, "#ffffff").flag;
    expect(inherited.crossRotation).toBeUndefined();
    expect(DDBRegionDisplayConfig.updateData(draft, inherited)["flags.ddbimporter.display.crossRotation"]).toBe(_del);
    const hidden = DDBRegionDisplayConfig.flagFromForm({ pattern: "checkerboard" }, draft, "#ffffff").flag;
    expect(hidden.crossRotation).toBe(45);
    expect(flagFromBehaviorConfig(behaviorConfigFromFlag(hidden))).toEqual(hidden);
    expect(describeDisplayFlag(draft)).toBe("Status Effect, crosses, cross rotation 45°");
  });

  it("keeps only filled overrides, clamped, and drops blanks", () => {
    const { flag } = DDBRegionDisplayConfig.flagFromForm(
      // Foundry's form reader gives a blank number input as null and a cleared text input as ""
      { profile: "damage", pattern: "", dashed: "dashed", border: "", opacity: "0.25", spacing: "", thickness: 9, angle: null as any, useProfileColor: true },
      { profile: "aura", pattern: "dots", spacing: 0.5, angle: 90, color: "#123456" },
      "#abcdef",
    );
    expect(flag).toEqual({ profile: "damage", dashed: "dashed", opacity: 0.25, thickness: 1 });
  });

  it("falls back to the draft for fields the form does not show", () => {
    const { flag } = DDBRegionDisplayConfig.flagFromForm(
      { profile: "status" },
      { profile: "aura", pattern: "dots", border: "border", spacing: 0.5, color: "#123456" },
      "#abcdef",
    );
    expect(flag).toEqual({ profile: "status", pattern: "dots", border: "border", spacing: 0.5, color: "#123456" });
  });

  it("keeps the symbol size while checkerboard hides thickness and restores it when switching back", () => {
    const checker = DDBRegionDisplayConfig.flagFromForm(
      { pattern: "checkerboard", spacing: 0.25 },
      { profile: "status", pattern: "crosses", thickness: 0.6, gapOpacity: 0, borderOpacity: 0.8 },
      "#abcdef",
    ).flag;
    expect(checker).toMatchObject({ pattern: "checkerboard", thickness: 0.6, spacing: 0.25 });
    const crosses = DDBRegionDisplayConfig.flagFromForm({ pattern: "crosses" }, checker, "#abcdef").flag;
    expect(flagFromBehaviorConfig(behaviorConfigFromFlag(crosses)))
      .toEqual({ profile: "status", pattern: "crosses", thickness: 0.6, spacing: 0.25, gapOpacity: 0, borderOpacity: 0.8 });
  });

  it("remembers the custom colour across the profile-colour box", () => {
    const unticked = DDBRegionDisplayConfig.flagFromForm({ profile: "aura", useProfileColor: false }, { profile: "aura" }, "#abcdef");
    expect(unticked.flag.color).toBe("#abcdef");
    const picked = DDBRegionDisplayConfig.flagFromForm({ profile: "aura", useProfileColor: false, color: " #00ff00 " }, unticked.flag, unticked.lastCustomColor);
    expect(picked.flag.color).toBe("#00ff00");
    const ticked = DDBRegionDisplayConfig.flagFromForm({ profile: "aura", useProfileColor: true }, picked.flag, picked.lastCustomColor);
    expect(ticked.flag.color).toBeUndefined();
    expect(ticked.lastCustomColor).toBe("#00ff00");
  });
});

describe("DDBRegionDisplayConfig.updateData", () => {
  it("sets the kept keys and deletes the dropped ones", () => {
    const update = DDBRegionDisplayConfig.updateData(
      { profile: "aura", opacity: 0.8, spacing: 0.5, color: "#123456" },
      { profile: "damage", opacity: 0.25, dashed: "dashed" },
    );
    expect(update).toEqual({
      "flags.ddbimporter.display.profile": "damage",
      "flags.ddbimporter.display.opacity": 0.25,
      "flags.ddbimporter.display.dashed": "dashed",
      "flags.ddbimporter.display.spacing": _del,
      "flags.ddbimporter.display.color": _del,
    });
  });

  it("removes the whole flag without a profile, and deletes nothing that was never set", () => {
    expect(DDBRegionDisplayConfig.updateData({ profile: "aura" }, {})).toEqual({ "flags.ddbimporter.display": _del });
    expect(DDBRegionDisplayConfig.updateData(undefined, { profile: "aura", angle: "" }))
      .toEqual({ "flags.ddbimporter.display.profile": "aura" });
  });
});

describe("describeDisplayFlag", () => {
  it("names the profile and each override, or the Foundry default", () => {
    setMockSettings({ "region-display-profiles": {} });
    expect(describeDisplayFlag(undefined)).toBe("None (Foundry default)");
    expect(describeDisplayFlag({ profile: "" })).toBe("None (Foundry default)");
    expect(describeDisplayFlag({ profile: "gone" })).toBe("Unknown profile \"gone\" (Foundry default)");
    expect(describeDisplayFlag({ profile: "aura" })).toBe("Aura");
    expect(describeDisplayFlag({ profile: "status", pattern: "hollowDots", border: "border", borderOpacity: "0.4", spacing: 9 }))
      .toBe("Status Effect, hollow dots, border, border opacity 0.4, spacing 4");
    // overrides left behind by a control another pattern hid do not draw, so they are not listed
    expect(describeDisplayFlag({ profile: "status", pattern: "dots", angle: 120, dashed: "dashed", dashLength: 0.4, spacing: 0.5 }))
      .toBe("Status Effect, dots, spacing 0.5");
  });
});

describe("region display targets", () => {
  it("reads and writes a region's flag through the document", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const region = { uuid: "Scene.a.Region.b", name: "Fire", color: "#00ff00", flags: { ddbimporter: { display: { profile: "aura", opacity: 0.8 } } }, update };
    const target = regionDisplayTarget(region);
    expect(target.key).toBe("Scene.a.Region.b");
    expect(target.title).toBe("Region Display: Fire");
    expect(target.color).toBe("#00ff00");
    expect(target.read()).toEqual({ profile: "aura", opacity: 0.8 });
    await target.write({ profile: "damage" });
    expect(update).toHaveBeenCalledWith({ "flags.ddbimporter.display.profile": "damage", "flags.ddbimporter.display.opacity": _del });
  });

  it("reads and writes an activity behavior by id, rebuilding the behaviors array", async () => {
    const behaviors = [
      { _id: "aaa", type: "applyActiveEffect", config: { effects: [] } },
      { _id: "bbb", type: "ddbDisplay", config: { profile: "aura", pattern: "", opacity: null, spacing: 0.5, dashed: "dashed", border: "", color: null } },
    ];
    const update = vi.fn().mockResolvedValue(undefined);
    const activity = { uuid: "Item.x.Activity.y", name: "Aura", item: { name: "Aura of Protection" }, toObject: () => ({ behaviors: foundry.utils.deepClone(behaviors) }), update };
    const target = activityBehaviorDisplayTarget(activity, "bbb");
    expect(target.key).toBe("Item.x.Activity.y.behavior.bbb");
    expect(target.title).toBe("Region Display: Aura of Protection: Aura");
    expect(target.read()).toEqual({ profile: "aura", spacing: 0.5, dashed: "dashed" });
    await target.write({ profile: "status", pattern: "diamonds", opacity: 0, color: "#123456" });
    const written = update.mock.calls[0][0].behaviors;
    expect(written[0]).toEqual(behaviors[0]);
    expect(written[1]).toEqual({ _id: "bbb", type: "ddbDisplay", config: {
      profile: "status", pattern: "diamonds", color: "#123456", dashed: "", border: "",
      opacity: 0, gapOpacity: null, borderOpacity: null, spacing: null, thickness: null, edgeWidth: null, dashLength: null, angle: null, crossRotation: null, crossLength: null, waveAmplitude: null, waveLength: null, offset: null, borderWidth: null,
    } });
    await expect(activityBehaviorDisplayTarget(activity, "zzz").write({ profile: "aura" })).rejects.toThrow("zzz");
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
