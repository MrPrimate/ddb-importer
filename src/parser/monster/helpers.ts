import { DICTIONARY } from "../../config/_module";

export function getAbilityMods(monster) {
  const abilities = {};

  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id).value || 0;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;
    abilities[ability.value] = mod;
  });

  return abilities;

}
