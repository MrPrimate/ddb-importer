import AutoEffects from "../../../../src/parser/enrichers/effects/AutoEffects";

// The description parser reports a condition duration as { value, units }; Foundry 14 effects keep
// calendar units as they are (only round and turn counts become seconds), so a timed condition
// stays timed.
describe("AutoEffects status effects carry the parsed condition duration", () => {
  it("preserves a timed condition on a feature as a counted duration", () => {
    const description = "The target must succeed on a DC 15 Constitution saving throw or be poisoned for 1 minute.";
    const effect = AutoEffects.getStatusEffect({
      ddbDefinition: { description },
      foundryItem: { name: "Test Poison", type: "feat", system: { description: { value: description } }, effects: [] },
    } as any);
    expect(effect).not.toBeNull();
    expect(effect!.statuses).toContain("poisoned");
    expect(effect!.duration).toMatchObject({ value: 1, units: "minutes" });
  });

  it.each([
    ["for 1 month", { value: 1, units: "months" }],
    ["for 1 year", { value: 1, units: "years" }],
    ["for 2 days", { value: 2, units: "days" }],
  ])("retains the calendar duration for %s", (phrase, expected) => {
    const description = `The target must succeed on a DC 15 Constitution saving throw or be poisoned ${phrase}.`;
    const effect = AutoEffects.getStatusEffect({
      ddbDefinition: { description },
      foundryItem: { name: "Duration probe", type: "feat", system: { description: { value: description } }, effects: [] },
    } as any);
    expect(effect).not.toBeNull();
    expect(effect!.statuses).toContain("poisoned");
    expect(effect!.duration).toMatchObject(expected);
  });

  it.each(["month", "months", "year", "years"])("maps the %s unit", (unit) => {
    expect(AutoEffects.adjustDurationUnits(unit)).not.toBeNull();
  });
});
