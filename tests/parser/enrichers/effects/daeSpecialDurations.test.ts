import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";

describe("EffectGenerator.applyDaeSpecialDurations", () => {
  it.each([
    ["turnStartSource", "sourceStart"],
    ["turnEndSource", "sourceEnd"],
    ["turnStart", "targetStart"],
    ["turnEnd", "targetEnd"],
    ["combatEnd", "combatEnd"],
    ["sourceStart", "sourceStart"],
    ["targetEnd", "targetEnd"],
  ])("maps %s to the native %s expiry", (special, expiry) => {
    const effect: any = {};
    EffectGenerator.applyDaeSpecialDurations(effect, [special as any]);
    expect(effect.duration.expiry).toBe(expiry);
  });

  it("nulls the duration value for live-evaluated pseudo expiries", () => {
    const effect: any = { duration: { value: 60, units: "seconds" } };
    EffectGenerator.applyDaeSpecialDurations(effect, ["turnStartSource" as any]);
    expect(effect.duration).toMatchObject({ value: null, expiry: "sourceStart" });

    const combat: any = { duration: { value: 60, units: "seconds" } };
    EffectGenerator.applyDaeSpecialDurations(combat, ["combatEnd" as any]);
    expect(combat.duration.value).toBe(60);
  });

  it("keeps DAE-only specials in the flag and drops none of the legacy source tokens", () => {
    const effect: any = {};
    EffectGenerator.applyDaeSpecialDurations(effect, ["turnStartSource", "1Attack", "isSave"] as any);
    expect(effect.duration.expiry).toBe("sourceStart");
    expect(effect.flags.dae.specialDuration).toEqual(["turnStartSource", "1Attack", "isSave"]);
  });

  it("lets explicit source/target specials outrank legacy turn tokens", () => {
    const effect: any = {};
    EffectGenerator.applyDaeSpecialDurations(effect, ["turnStart", "sourceEnd"] as any);
    expect(effect.duration.expiry).toBe("sourceEnd");
  });
});
