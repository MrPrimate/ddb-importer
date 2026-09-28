// @vitest-environment jsdom
import DDBCompanionMixin from "../../../src/parser/companions/DDBCompanionMixin";

// Companion stubs (the 2014 Animate Objects table, the SUMMONS_ACTOR_STUB) carry only scores.
// The monster feature parser reads a mod to match a fixed to-hit, so an unset mod turned the
// Animated Object Slam damage bonus into "NaN" and the summon actor failed validation.
describe("DDBCompanionMixin.abilitiesWithMods", () => {
  const scores = () => ({
    str: { value: 4 },
    dex: { value: 18 },
    con: { value: 10 },
    int: { value: 3 },
    wis: { value: 3 },
    cha: { value: 1 },
  }) as unknown as I5eAbilities;

  it("derives each mod from its score", () => {
    const result = DDBCompanionMixin.abilitiesWithMods(scores());
    expect(result.str.mod).toBe(-3);
    expect(result.dex.mod).toBe(4);
    expect(result.con.mod).toBe(0);
    expect(result.int.mod).toBe(-4);
    expect(result.cha.mod).toBe(-5);
  });

  it("keeps a mod that is already set and does not touch the npc data", () => {
    const abilities = scores();
    (abilities.str as any).mod = 7;
    const result = DDBCompanionMixin.abilitiesWithMods(abilities);
    expect(result.str.mod).toBe(7);
    expect((abilities.dex as any).mod).toBeUndefined();
  });

  it("treats a missing score as 10", () => {
    const result = DDBCompanionMixin.abilitiesWithMods({ str: {} } as unknown as I5eAbilities);
    expect(result.str.mod).toBe(0);
  });
});
