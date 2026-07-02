import { DICTIONARY } from "../../config/_module";

export interface IDDBAbilityMods {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export function getAbilityMods(monster): IDDBAbilityMods {
  const abilities: IDDBAbilityMods = {} as IDDBAbilityMods;

  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id)?.value || 0;
    // fall back to the standard 5e formula if the score is outside the DDB config table
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value)?.modifier ?? Math.floor((value - 10) / 2);
    abilities[ability.value] = mod;
  });

  return abilities;

}
