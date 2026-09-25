import { describe, it, expect, afterEach } from "vitest";
import { setMockModules, resetMockModules } from "../../../_setup/foundryMocks";
import {
  applyDaeSpecialDurations,
  applyNativeExpiry,
  daeManagesTurnExpiry,
  expirySupportsDuration,
  nativeExpiry,
} from "../../../../src/parser/enrichers/effects/EffectExpiryHelpers";

// dnd5e 5.3 on Foundry v14: core supplies the combat-edge expiries, DAE registers the
// source/target turn edges below dnd5e 6.0, and nothing fires a rest expiry event.

function effectWith(duration: IEffectDuration = {}): I5eEffectData {
  return { name: "Test", duration: { ...duration }, flags: {} };
}

function withDae() {
  setMockModules({ dae: { active: true } });
}

describe("EffectExpiryHelpers on dnd5e 5.3", () => {
  afterEach(() => resetMockModules());

  it("only lets DAE manage the source/target edges when it is active", () => {
    expect(daeManagesTurnExpiry()).toBe(false);
    withDae();
    expect(daeManagesTurnExpiry()).toBe(true);
  });

  it("writes core timed expiries as they are and keeps the counted duration", () => {
    const effect = applyNativeExpiry(effectWith({ value: 6, units: "seconds" }), "turnEnd");
    expect(effect.duration?.expiry).toBe("turnEnd");
    expect(effect.duration?.value).toBe(6);
  });

  it("keeps a source/target expiry with DAE and drops the counted duration", () => {
    withDae();
    const effect = applyNativeExpiry(effectWith({ value: 60, units: "seconds" }), "sourceStart");
    expect(effect.duration?.expiry).toBe("sourceStart");
    expect(effect.duration?.value).toBeNull();
  });

  // core turn edges fire for the combatant whose turn it was when the effect was created (the
  // source) and do not skip that turn
  it("falls back to the source's next turn start without DAE", () => {
    expect(nativeExpiry("sourceStart")).toBe("turnStart");
    const effect = applyNativeExpiry(effectWith({ value: 12, units: "seconds" }), "sourceStart");
    expect(effect.duration?.expiry).toBe("turnStart");
    expect(effect.duration?.value).toBeNull();
  });

  it("keeps a sourceEnd effect past the turn it was applied on without DAE", () => {
    const effect = applyNativeExpiry(effectWith({ value: null, units: "seconds" }), "sourceEnd");
    expect(effect.duration?.expiry).toBe("turnEnd");
    // one round, so the first turnEnd that can end it is the source's next one
    expect(effect.duration).toMatchObject({ value: 6, units: "seconds" });
  });

  it("never ends a target turn edge before the target has acted without DAE", () => {
    // a turnEnd fallback fired at the end of the caster's own turn (Command ended before the target acted)
    for (const expiry of ["targetStart", "targetEnd"] as const) {
      expect(nativeExpiry(expiry)).toBe("turnStart");
      const effect = applyNativeExpiry(effectWith({ value: 6, units: "seconds" }), expiry);
      expect(effect.duration?.expiry).toBe("turnStart");
      expect(effect.duration?.value).toBeNull();
    }
  });

  it("turns a rest expiry into a DAE special duration", () => {
    const effect = applyNativeExpiry(effectWith({ value: 3600, units: "seconds" }), "longRest");
    expect(effect.duration?.expiry).toBeNull();
    expect(effect.duration?.value).toBeNull();
    expect(effect.flags?.dae?.specialDuration).toEqual(["longRest"]);
  });

  it("clears the expiry for null", () => {
    const effect = applyNativeExpiry(effectWith({ value: 6, units: "seconds", expiry: "turnStart" }), null);
    expect(effect.duration?.expiry).toBeNull();
    expect(effect.duration?.value).toBe(6);
  });

  it("reports which expiries can carry a counted duration", () => {
    expect(expirySupportsDuration("turnStart")).toBe(true);
    expect(expirySupportsDuration(null)).toBe(true);
    expect(expirySupportsDuration("targetEnd")).toBe(false);
    expect(expirySupportsDuration("shortRest")).toBe(false);
  });

  it("moves legacy turn-edge tokens onto the expiry and keeps trigger tokens", () => {
    withDae();
    const effect = applyDaeSpecialDurations(effectWith({ value: 6, units: "seconds" }), ["turnStartSource", "1Attack"]);
    expect(effect.duration?.expiry).toBe("sourceStart");
    expect(effect.duration?.value).toBeNull();
    expect(effect.flags?.dae?.specialDuration).toEqual(["1Attack"]);
  });

  it("maps the legacy bearer tokens to the target edges", () => {
    withDae();
    expect(applyDaeSpecialDurations(effectWith(), ["turnEnd"]).duration?.expiry).toBe("targetEnd");
    resetMockModules();
    expect(applyDaeSpecialDurations(effectWith(), ["turnEnd"]).duration?.expiry).toBe("turnStart");
  });

  it("keeps a trigger token beside a declared expiry (Guiding Bolt)", () => {
    withDae();
    let effect = applyDaeSpecialDurations(effectWith(), ["isAttacked"]);
    effect = applyNativeExpiry(effect, "sourceEnd");
    expect(effect.flags?.dae?.specialDuration).toEqual(["isAttacked"]);
    expect(effect.duration?.expiry).toBe("sourceEnd");
  });

  it("merges DAE tokens with ones already on the effect", () => {
    const effect = effectWith();
    foundry.utils.setProperty(effect, "flags.dae.specialDuration", ["isDamaged"]);
    applyDaeSpecialDurations(effect, ["1Reaction", "isDamaged"]);
    expect(effect.flags?.dae?.specialDuration).toEqual(["isDamaged", "1Reaction"]);
  });
});
