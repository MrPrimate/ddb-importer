import DICTIONARY from "../../dictionary.js";

export function getAbilityMods(monster) {
  let abilities = {};

  DICTIONARY.character.abilities.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id).value || 0;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;
    abilities[ability.value] = mod;
  });

  return abilities;

}
