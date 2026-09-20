// Foundry v13 has no `duration.expiry`, so the shared enrichers' native expiry points are
// translated to DAE special durations. A hint may also declare its own DAE tokens, and the two are
// alternative expiry conditions: DAE ends the effect on the first to fire, so both must survive.
// Guiding Bolt regressed here - the translated "turnEndSource" replaced "isAttacked", leaving it
// granting advantage on every attack until the caster's turn ended instead of only the first.

import {
  expiryToDaeSpecialDurations,
  resolveDaeSpecialDurations,
  resolveExpiryFallback,
} from "../../../../src/parser/enrichers/effects/EffectExpiryHelpers";

describe("expiryToDaeSpecialDurations", () => {

  it("translates the expiry points that have a DAE equivalent", () => {
    expect(expiryToDaeSpecialDurations("sourceEnd")).toEqual(["turnEndSource"]);
    expect(expiryToDaeSpecialDurations("sourceStart")).toEqual(["turnStartSource"]);
    expect(expiryToDaeSpecialDurations("targetEnd")).toEqual(["turnEnd"]);
    expect(expiryToDaeSpecialDurations("targetStart")).toEqual(["turnStart"]);
    expect(expiryToDaeSpecialDurations("combatEnd")).toEqual(["combatEnd"]);
  });

  it("returns nothing for a timed expiry DAE cannot express, or for none at all", () => {
    // left to times-up via the counted duration
    expect(expiryToDaeSpecialDurations("roundEnd" as any)).toEqual([]);
    expect(expiryToDaeSpecialDurations(null)).toEqual([]);
    expect(expiryToDaeSpecialDurations(undefined)).toEqual([]);
  });

});

describe("resolveDaeSpecialDurations", () => {

  it("keeps a hint's own tokens alongside the translated expiry", () => {
    // Guiding Bolt: expires on the first attack against the target, or at the caster's turn end
    expect(resolveDaeSpecialDurations({
      daeSpecialDurations: ["isAttacked"],
      expiry: "sourceEnd",
      hasExpiry: true,
    })).toEqual(["isAttacked", "turnEndSource"]);
  });

  it("keeps every declared token, not just the first", () => {
    // Frostbite
    expect(resolveDaeSpecialDurations({
      daeSpecialDurations: ["1Attack:rwak", "1Attack:mwak"],
      expiry: "targetEnd",
      hasExpiry: true,
    })).toEqual(["1Attack:rwak", "1Attack:mwak", "turnEnd"]);
  });

  it("does not repeat a token the expiry translates to as well", () => {
    // SpiritsFromBeyond declares turnStartSource and an expiry that also produces it
    expect(resolveDaeSpecialDurations({
      daeSpecialDurations: ["turnStartSource"],
      expiry: "sourceStart",
      hasExpiry: true,
    })).toEqual(["turnStartSource"]);
  });

  it("uses the expiry alone when the hint declares no tokens", () => {
    expect(resolveDaeSpecialDurations({ expiry: "longRest", hasExpiry: true })).toEqual(["longRest"]);
  });

  it("uses the hint's tokens alone when it declares no expiry", () => {
    expect(resolveDaeSpecialDurations({ daeSpecialDurations: ["isSave"] })).toEqual(["isSave"]);
  });

  it("clears for an explicit null expiry, so the enricher owns expiry", () => {
    expect(resolveDaeSpecialDurations({ expiry: null, hasExpiry: true })).toEqual([]);
  });

});

// Timed expiries (turnEnd, roundStart...) have no DAE token, so times-up gets a counted stand-in.
// A spell effect has already inherited the spell's duration by the time the stand-in is decided,
// and whether that inherited duration survives depends on what the hint declared.
describe("resolveExpiryFallback", () => {

  const tenMinutes = { seconds: 600, rounds: 100, turns: null };

  it("replaces an inherited duration when the hint declares no counted duration", () => {
    const result = resolveExpiryFallback({
      effectOptions: { durationSeconds: null, expiry: "turnEnd" },
      inherited: tenMinutes,
    });
    expect(result).toEqual({ seconds: null, rounds: null, turns: 1 });
  });

  it("keeps an inherited duration when the hint leaves durationSeconds undeclared", () => {
    expect(resolveExpiryFallback({ effectOptions: { expiry: "turnStart" }, inherited: { seconds: 60 } })).toBeNull();
  });

  it("fills an effect that has no duration at all", () => {
    expect(resolveExpiryFallback({ effectOptions: { expiry: "roundEnd" }, inherited: {} }))
      .toEqual({ seconds: null, rounds: 1, turns: null });
    expect(resolveExpiryFallback({ effectOptions: { expiry: "turnEnd" }, inherited: null }))
      .toEqual({ seconds: null, rounds: null, turns: 1 });
  });

  it("leaves a hint with its own counted duration alone", () => {
    expect(resolveExpiryFallback({ effectOptions: { durationRounds: 2, expiry: "turnEnd" }, inherited: {} })).toBeNull();
    expect(resolveExpiryFallback({ effectOptions: { durationSeconds: 60, expiry: "turnStart" }, inherited: tenMinutes }))
      .toBeNull();
  });

  it("ignores expiries that DAE tokens already cover, and hints with none", () => {
    expect(resolveExpiryFallback({ effectOptions: { durationSeconds: null, expiry: "sourceEnd" }, inherited: tenMinutes }))
      .toBeNull();
    expect(resolveExpiryFallback({ effectOptions: { durationSeconds: null, expiry: null }, inherited: tenMinutes }))
      .toBeNull();
    expect(resolveExpiryFallback({ effectOptions: {}, inherited: {} })).toBeNull();
  });

});
