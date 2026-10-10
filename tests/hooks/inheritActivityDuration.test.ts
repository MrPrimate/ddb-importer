import { inheritActivityDuration } from "../../src/hooks/init/DDBEffectHooks";

/**
 * dnd5e 6.0 copies the applying activity's duration onto an applied effect that has none; on 5.3
 * the importer does it for its own enchantments so self-enchant toggles still end.
 */
describe("inheritActivityDuration", () => {
  const enchantment = (duration: Record<string, unknown> = { value: null, units: "seconds", expiry: null }) =>
    ({ flags: { ddbimporter: {} }, duration }) as any;
  const activity = (value: unknown, units: string) => ({ duration: { value, units } });

  it("copies a timed activity duration onto an importer enchantment with none", () => {
    const data = enchantment();
    inheritActivityDuration(data, activity(10, "minute"));
    expect(data.duration).toMatchObject({ value: 10, units: "minutes", expiry: "turnStart" });
  });

  it("counts turns without a turn-start expiry", () => {
    const data = enchantment();
    inheritActivityDuration(data, activity(1, "turn"));
    expect(data.duration).toMatchObject({ value: 1, units: "turns", expiry: null });
  });

  it("leaves an enchantment with its own duration or expiry alone", () => {
    const timed = enchantment({ value: 60, units: "seconds", expiry: "turnStart" });
    inheritActivityDuration(timed, activity(10, "minute"));
    expect(timed.duration).toEqual({ value: 60, units: "seconds", expiry: "turnStart" });

    const edge = enchantment({ value: null, units: "seconds", expiry: "turnEnd" });
    inheritActivityDuration(edge, activity(10, "minute"));
    expect(edge.duration).toEqual({ value: null, units: "seconds", expiry: "turnEnd" });
  });

  it("ignores instantaneous activities and enchantments the importer did not build", () => {
    const inst = enchantment();
    inheritActivityDuration(inst, activity(null, "inst"));
    expect(inst.duration.value).toBeNull();

    const foreign = { flags: {}, duration: { value: null, units: "seconds", expiry: null } } as any;
    inheritActivityDuration(foreign, activity(10, "minute"));
    expect(foreign.duration.value).toBeNull();
  });
});
