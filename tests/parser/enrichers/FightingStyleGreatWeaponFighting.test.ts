import FightingStyleGreatWeaponFighting from "../../../src/parser/enrichers/generic/FightingStyleGreatWeaponFighting";
import { makeEnricherData } from "../../_fixtures/ddb/factories";
import { installActivityConfigStubs } from "../../_fixtures/ddb/stubs";

beforeAll(() => {
  installActivityConfigStubs();
});

/**
 * dnd5e 6 damage rolls only collect bonus rules, so the die modifier ships as an AC5e-only effect
 * scoped to two-handed melee weapon attacks. The audit worksheets cannot see AC5e change data.
 */
describe("Great Weapon Fighting AC5e effect", () => {
  it("treats 1s and 2s as 3s for the 2024 feat", () => {
    const [effect, ...rest] = makeEnricherData(FightingStyleGreatWeaponFighting).effects;
    expect(rest).toHaveLength(0);
    expect(effect.ac5eOnly).toBe(true);
    expect(effect.options).toMatchObject({ transfer: true });
    expect(effect.ac5eChanges).toEqual([
      expect.objectContaining({
        key: "flags.automated-conditions-5e.damage.modifier",
        value: "modifier=min3;twoHanded && mwak",
      }),
    ]);
  });

  it("rerolls 1s and 2s once for the 2014 fighting style", () => {
    const [effect] = makeEnricherData(FightingStyleGreatWeaponFighting, { is2014: true }).effects;
    expect(effect.ac5eChanges).toEqual([
      expect.objectContaining({ value: "modifier=r<=2;twoHanded && mwak" }),
    ]);
  });
});
