import AutoEffects from "../../../../src/parser/enrichers/effects/AutoEffects";

// Generated effects never carry dnd5e's combat duration units (foundryvtt/dnd5e#7434): a
// counted duration is seconds (or a calendar unit inherited from the host), a turn edge is a
// native expiry. Every writer funnels through toEffectDuration, so the pins here cover the
// conversion once and the two entry points that used to emit rounds and turns.

function host(duration: { value: string | null; units: string }): any {
  return { name: "Test Spell", img: "icons/svg/aura.svg", system: { duration } };
}

describe("AutoEffects.toEffectDuration", () => {
  it.each([
    ["1", "round", 6, "seconds"],
    ["3", "rounds", 18, "seconds"],
    ["1", "turn", 6, "seconds"],
    ["2", "turns", 12, "seconds"],
    ["10", "minute", 10, "minutes"],
    [60, "seconds", 60, "seconds"],
    [8, "hours", 8, "hours"],
  ])("maps %s %s to %s %s", (value, units, expectedValue, expectedUnits) => {
    expect(AutoEffects.toEffectDuration(value, units)).toEqual({ value: expectedValue, units: expectedUnits });
  });

  it("yields no value for a formula, since an effect duration must be an integer", () => {
    expect(AutoEffects.toEffectDuration("max(1, @abilities.wis.mod)", "round")).toEqual({ value: null, units: "seconds" });
    expect(AutoEffects.toEffectDuration(null, "round")).toEqual({ value: null, units: "seconds" });
    // digit-leading formulas must not truncate to their first number
    expect(AutoEffects.toEffectDuration("2d4", "round")).toEqual({ value: null, units: "seconds" });
    expect(AutoEffects.toEffectDuration("1 + @prof", "minute")).toEqual({ value: null, units: "minutes" });
    expect(AutoEffects.toEffectDuration(" 3 ", "round")).toEqual({ value: 18, units: "seconds" });
  });

  it("passes the calendar units the description parser produces straight through", () => {
    expect(AutoEffects.toEffectDuration("1", "month")).toEqual({ value: 1, units: "months" });
    expect(AutoEffects.toEffectDuration("2", "years")).toEqual({ value: 2, units: "years" });
    expect(AutoEffects.toEffectDuration("1", "day")).toEqual({ value: 1, units: "days" });
  });
});

describe("AutoEffects.BaseEffect duration", () => {
  it("inherits a round-based host duration as seconds", () => {
    const effect = AutoEffects.BaseEffect(host({ value: "1", units: "round" }), "Mind Sliver");
    expect(effect.duration).toEqual({ value: 6, units: "seconds", expiry: "turnStart", expired: false });
  });

  it("inherits a calendar host duration unchanged", () => {
    const effect = AutoEffects.BaseEffect(host({ value: "1", units: "minute" }), "Bless");
    expect(effect.duration).toEqual({ value: 1, units: "minutes", expiry: "turnStart", expired: false });
  });

  it("gives an instantaneous host no counted duration and no expiry", () => {
    const effect = AutoEffects.BaseEffect(host({ value: null, units: "inst" }), "Fire Bolt");
    expect(effect.duration).toEqual({ value: null, units: "seconds", expiry: null, expired: false });
  });

  it("lets durationSeconds replace the host duration", () => {
    const effect = AutoEffects.BaseEffect(host({ value: "1", units: "round" }), "Blindness", { durationSeconds: 60 });
    expect(effect.duration).toMatchObject({ value: 60, units: "seconds", expiry: "turnStart" });
  });

  it("clears the inherited duration and its expiry for an explicit null", () => {
    const effect = AutoEffects.BaseEffect(host({ value: "1", units: "round" }), "Wind Sprint", { durationSeconds: null });
    expect(effect.duration).toMatchObject({ value: null, units: "seconds", expiry: null });
  });

  it("inherits when durationSeconds is undefined", () => {
    const effect = AutoEffects.BaseEffect(host({ value: "1", units: "round" }), "Mind Sliver", { durationSeconds: undefined });
    expect(effect.duration).toMatchObject({ value: 6, units: "seconds", expiry: "turnStart" });
  });
});

describe("AutoEffects.getStatusEffect", () => {
  it("normalises a prose round count to seconds", () => {
    const foundryItem: any = { name: "Bite", img: "icons/svg/aura.svg", system: { duration: { value: null, units: "inst" } }, effects: [] };
    const effect = AutoEffects.getStatusEffect({
      ddbDefinition: { description: "[[/save con 13 format=long]] or be &Reference[poisoned]{Poisoned} for 1 round." } as any,
      foundryItem,
    });
    expect(effect?.duration).toMatchObject({ value: 6, units: "seconds" });
  });
});
