import AutoEffects from "../../../../src/parser/enrichers/effects/AutoEffects";

// The description parser reports a condition duration as { value, units }; Foundry 13 effects
// store seconds/rounds/turns, so the conversion at the effect boundary is what keeps a timed
// condition timed. Review finding P1 (2026-09-09).
describe("AutoEffects.parsedDurationToEffectDuration", () => {
  it.each([
    [{ value: 1, units: "minutes" }, { seconds: 60, rounds: null, turns: null }],
    [{ value: "10", units: "minutes" }, { seconds: 600, rounds: null, turns: null }],
    [{ value: 2, units: "hours" }, { seconds: 7200, rounds: null, turns: null }],
    [{ value: 1, units: "days" }, { seconds: 86400, rounds: null, turns: null }],
    [{ value: 1, units: "months" }, { seconds: 2592000, rounds: null, turns: null }],
    [{ value: 1, units: "years" }, { seconds: 31536000, rounds: null, turns: null }],
    [{ value: 30, units: "seconds" }, { seconds: 30, rounds: null, turns: null }],
    [{ value: 3, units: "rounds" }, { seconds: null, rounds: 3, turns: null }],
    [{ value: 1, units: "turns" }, { seconds: null, rounds: null, turns: 1 }],
  ])("converts %j", (parsed, expected) => {
    expect(AutoEffects.parsedDurationToEffectDuration(parsed)).toMatchObject(expected);
  });

  it.each([null, undefined, { value: null, units: "minutes" }, { value: 1, units: null }, { value: 1, units: "spec" }])(
    "leaves the duration empty for %j",
    (parsed) => {
      const duration = AutoEffects.parsedDurationToEffectDuration(parsed as any);
      expect(duration).toMatchObject({ seconds: null, rounds: null, turns: null });
    },
  );
});

describe("AutoEffects status effects carry the parsed condition duration", () => {
  it("preserves a timed condition on a feature in the v13 effect duration", () => {
    const description = "The target must succeed on a DC 15 Constitution saving throw or be poisoned for 1 minute.";
    const effect = AutoEffects.getStatusEffect({
      ddbDefinition: { description },
      foundryItem: { name: "Test Poison", type: "feat", system: { description: { value: description } }, effects: [] },
    } as any);
    expect(effect).not.toBeNull();
    expect(effect.statuses).toContain("poisoned");
    expect(effect.duration.seconds).toBe(60);
    expect(effect.duration.rounds).toBeNull();
  });

  it("stores a round count as rounds on the condition effect", () => {
    const text = "The target must succeed on a DC 13 Wisdom saving throw or be frightened for 1 round.";
    const effect = AutoEffects.getStatusConditionEffect({ text } as any);
    expect(effect).not.toBeNull();
    expect(effect.duration).toMatchObject({ seconds: null, rounds: 1 });
  });
});

// Second review (2026-09-09): next-turn wording carries no numeric value, and the calendar units were
// missing from the unit map, so these conditions arrived with an empty core duration.
describe("AutoEffects status effects fall back to the description parser's duration", () => {
  it.each([
    ["until the end of its next turn", { seconds: 6, rounds: 1 }],
    ["for 1 month", { seconds: 2592000, rounds: null }],
    ["for 1 year", { seconds: 31536000, rounds: null }],
    ["for 2 days", { seconds: 172800, rounds: null }],
  ])("retains the v13 duration for %s", (phrase, expected) => {
    const description = `The target must succeed on a DC 15 Constitution saving throw or be poisoned ${phrase}.`;
    const effect = AutoEffects.getStatusEffect({
      ddbDefinition: { description },
      foundryItem: { name: "Duration probe", type: "feat", system: { description: { value: description } }, effects: [] },
    } as any);
    expect(effect).not.toBeNull();
    expect(effect.statuses).toContain("poisoned");
    expect(effect.duration).toMatchObject(expected);
  });

  it("keeps the next-turn special duration flag alongside the core duration", () => {
    const text = "The target must succeed on a DC 15 Constitution saving throw or be poisoned until the end of its next turn.";
    const effect = AutoEffects.getStatusConditionEffect({ text } as any);
    expect(effect.duration).toMatchObject({ seconds: 6, rounds: 1 });
    expect(effect.flags.dae.specialDuration).toHaveLength(1);
  });

  it.each(["month", "months", "year", "years"])("maps the %s unit without logging an error", (unit) => {
    expect(AutoEffects.adjustDurationUnits(unit)).toBe(unit.endsWith("s") ? unit : `${unit}s`);
  });
});
