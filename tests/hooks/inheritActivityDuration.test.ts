import { inheritActivityDuration } from "../../src/hooks/init/DDBEffectHooks";

/**
 * dnd5e 6.0 copies the applying activity's duration onto an applied effect that has none; on 5.x
 * the importer does it for its own enchantments so self-enchant toggles still end.
 */
describe("inheritActivityDuration", () => {
  const enchantment = (duration: Record<string, unknown> = { seconds: null, rounds: null, turns: null }) =>
    ({ flags: { ddbimporter: {} }, duration }) as any;
  const activity = (value: unknown, units: string) => ({ activity: { duration: { value, units } } });

  it("copies a timed activity duration onto an importer enchantment as seconds", () => {
    const data = enchantment();
    inheritActivityDuration(null, data, activity(10, "minute"));
    expect(data.duration.seconds).toBe(600);
  });

  it("keeps rounds and turns as counts", () => {
    const rounds = enchantment();
    inheritActivityDuration(null, rounds, activity(10, "round"));
    expect(rounds.duration.rounds).toBe(10);
    // times-up only counts rounds in combat; the seconds end it outside one
    expect(rounds.duration.seconds).toBe(60);

    const turns = enchantment();
    inheritActivityDuration(null, turns, activity(1, "turn"));
    expect(turns.duration.turns).toBe(1);
  });

  it("leaves an enchantment with its own counted duration alone", () => {
    const data = enchantment({ seconds: 60, rounds: 10, turns: null });
    inheritActivityDuration(null, data, activity(10, "minute"));
    expect(data.duration).toEqual({ seconds: 60, rounds: 10, turns: null });
  });

  it("ignores instantaneous activities and enchantments the importer did not build", () => {
    const inst = enchantment();
    inheritActivityDuration(null, inst, activity(null, "inst"));
    expect(inst.duration.seconds).toBeNull();

    const foreign = { flags: {}, duration: { seconds: null } } as any;
    inheritActivityDuration(null, foreign, activity(10, "minute"));
    expect(foreign.duration.seconds).toBeNull();
  });
});
