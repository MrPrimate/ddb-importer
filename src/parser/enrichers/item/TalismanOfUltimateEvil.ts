import _Talisman from "./_Talisman";

export default class TalismanOfUltimateEvil extends _Talisman {

  config = {
    damageType: "necrotic",
    touch2014: [["Good Creature Damage", 8], ["Neutral Creature Damage", 6]] as [string, number][],
    touch2024: [["Non-Fiend or Undead Damage", 8]] as [string, number][],
    rebuke2024: "Ultimate End",
  };

}
