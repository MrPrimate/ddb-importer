import { DICTIONARY } from "../../config/_module";

export type TDDBAbilityMods = Record<T5eAbility, number>;

export function getAbilityMods(monster: any): TDDBAbilityMods {
  const abilities: TDDBAbilityMods = {} as TDDBAbilityMods;

  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = monster.stats.find((stat: any) => stat.statId === ability.id)?.value || 0;
    // fall back to the standard 5e formula if the score is outside the DDB config table
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value === value)?.modifier ?? Math.floor((value - 10) / 2);
    (abilities as Record<string, any>)[ability.value] = mod;
  });

  return abilities;

}
