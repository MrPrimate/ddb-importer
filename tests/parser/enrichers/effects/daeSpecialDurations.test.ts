import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";
import AutoEffects from "../../../../src/parser/enrichers/effects/AutoEffects";

describe("EffectGenerator.applyDaeSpecialDurations", () => {
  // since the DAE_TO_NATIVE_EXPIRY retirement this writes FLAGS only - every
  // producer of a natively-mappable token also computes the native expiry
  // (DDBDescriptions.nextTurnExpiry), so translation here would be dead weight

  it("keeps DAE-only specials and REJECTS natively covered tokens with an error", () => {
    // turnStartSource has native coverage (sourceStart) - passing it here is an
    // authoring error: it is dropped from the flag and logged, never translated
    const effect: any = { name: "Test Effect" };
    EffectGenerator.applyDaeSpecialDurations(effect, ["turnStartSource", "1Attack", "isSave"] as any);
    expect(effect.flags.dae.specialDuration).toEqual(["1Attack", "isSave"]);
    expect(effect.duration.expiry).toBeUndefined();
  });

  it("filters every natively covered turn token out of the flag", () => {
    for (const banned of ["turnStart", "turnEnd", "turnStartSource", "turnEndSource", "combatEnd", "sourceStart", "targetEnd"]) {
      const effect: any = { name: "Test Effect" };
      EffectGenerator.applyDaeSpecialDurations(effect, [banned, "1Attack"] as any);
      expect(effect.flags.dae.specialDuration).toEqual(["1Attack"]);
    }
  });

  it("nulls the duration value when the effect already carries a pseudo expiry", () => {
    const effect: any = { duration: { value: 60, units: "seconds", expiry: "sourceStart" } };
    EffectGenerator.applyDaeSpecialDurations(effect, ["1Attack" as any]);
    expect(effect.duration.value).toBeNull();

    const counted: any = { duration: { value: 60, units: "seconds", expiry: "turnStart" } };
    EffectGenerator.applyDaeSpecialDurations(counted, ["1Attack" as any]);
    expect(counted.duration.value).toBe(60);
  });
});

describe("daeSpecialDurations hint typing", () => {
  it("rejects natively covered tokens at the type level", () => {
    // the field takes TDAEOnlySpecialDuration; a turn-edge token belongs in options.expiry
    const good: IDDBEffectHint = { daeSpecialDurations: ["1Attack", "isSave"] };
    // @ts-expect-error turnEnd is natively covered and excluded from the hint union
    const bad: IDDBEffectHint = { daeSpecialDurations: ["turnEnd"] };
    expect(good).toBeTruthy();
    expect(bad).toBeTruthy();
  });
});

describe("EffectGenerator.applyNativeExpiry", () => {
  it.each([
    ["sourceStart", null],
    ["targetEnd", null],
    ["shortRest", null],
    ["longRest", null],
    ["combatEnd", 60],
    ["turnStart", 60],
  ])("stamps %s and leaves the value as %s", (expiry, value) => {
    const effect: any = { duration: { value: 60, units: "seconds" } };
    EffectGenerator.applyNativeExpiry(effect, expiry as any);
    expect(effect.duration).toMatchObject({ expiry, value });
  });

  it("clears the expiry without touching the duration when passed null", () => {
    const effect: any = { duration: { value: 60, units: "seconds", expiry: "turnStart" } };
    EffectGenerator.applyNativeExpiry(effect, null);
    expect(effect.duration).toMatchObject({ expiry: null, value: 60 });
  });

  it("creates the duration object on a bare effect", () => {
    const effect: any = {};
    EffectGenerator.applyNativeExpiry(effect, "sourceEnd");
    expect(effect.duration).toEqual({ expiry: "sourceEnd", value: null });
  });
});

describe("auto-parsed status conditions get a native expiry", () => {
  // WP-C translated the EffectGenerator path only; AutoEffects.getStatusConditionEffect
  // set a DAE flag and no duration.expiry, so 344 documents (mostly monsters) never
  // expired without DAE installed.

  it("translates a prose turn edge into duration.expiry", () => {
    const effect = AutoEffects.getStatusConditionEffect({
      text: "[[/save con 13 format=long]] or be &Reference[poisoned]{Poisoned} until the end of its next turn.",
    });
    expect(effect?.duration?.expiry).toBe("targetEnd");
    // natively covered tokens are stripped from the DAE flag by the translator
    expect(effect?.flags?.dae?.specialDuration ?? []).not.toContain("turnEnd");
  });

  it("anchors a caster-worded edge on the source", () => {
    const effect = AutoEffects.getStatusConditionEffect({
      text: "[[/save wis 15 format=long]] or be &Reference[frightened]{Frightened} until the start of your next turn.",
    });
    expect(effect?.duration?.expiry).toBe("sourceStart");
  });
});
