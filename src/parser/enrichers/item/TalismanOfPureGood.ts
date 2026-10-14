import _Talisman from "./_Talisman";

export default class TalismanOfPureGood extends _Talisman {

  config = {
    damageType: "radiant",
    touch2014: [["Evil Creature Damage", 8], ["Neutral Creature Damage", 6]] as [string, number][],
    touch2024: [["Fiend and Undead Damage", 8]] as [string, number][],
    rebuke2024: "Pure Rebuke",
  };

}
