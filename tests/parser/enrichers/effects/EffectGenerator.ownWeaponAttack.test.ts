import EffectGenerator from "../../../../src/parser/enrichers/effects/EffectGenerator";
import { installActivityConfigStubs } from "../../../_fixtures/ddb/stubs";

// 2024 weapon records give the weapon's own "+N to attack and damage rolls" as a
// bonus / melee-weapon-attacks modifier, and an extra hit die the same way.

beforeAll(() => {
  installActivityConfigStubs();
});

const mod = (subType: string, value: number | null, restriction = "", diceString: string | null = null) => ({
  type: "bonus",
  subType,
  value,
  restriction,
  dice: diceString ? { diceString } : null,
}) as any;

describe("EffectGenerator.ownWeaponAttackModifiers", () => {
  it("reads the flat bonus from the value, or the restriction's +N when the value is empty", () => {
    expect(EffectGenerator.ownWeaponAttackModifiers([mod("melee-weapon-attacks", 2, "+2 to attack and damage rolls")]).bonus).toBe(2);
    expect(EffectGenerator.ownWeaponAttackModifiers([mod("melee-weapon-attacks", 3)]).bonus).toBe(3);
    expect(EffectGenerator.ownWeaponAttackModifiers([mod("melee-weapon-attacks", null, "+1 to attack and damage rolls")]).bonus).toBe(1);
  });

  it("reads an extra die with its damage type from the restriction", () => {
    const result = EffectGenerator.ownWeaponAttackModifiers([
      mod("melee-weapon-attacks", null, "Extra 2d8 Necrotic Damage if hit with weapon", "2d8"),
    ]);
    expect(result.extraDamage).toEqual([{ diceString: "2d8", type: "necrotic" }]);
    expect(result.bonus).toBe(0);
  });

  it("leaves other restrictions and other modifiers alone", () => {
    const result = EffectGenerator.ownWeaponAttackModifiers([
      mod("melee-weapon-attacks", 1, "while you are raging"),
      mod("saving-throws", 1),
    ]);
    expect(result.modifiers).toEqual([]);
  });
});
