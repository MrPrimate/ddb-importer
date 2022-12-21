import DICTIONARY from "../../dictionary.js";

//     "abilities": {
// "str": {
//   "value": 27,
//   "proficient": 0,
//   "min": 3,
//   "mod": 8,
//   "save": 8,
//   "prof": 0,
//   "saveBonus": 0,
//   "checkBonus": 0,
//   "dc": 23
// },
// "dex": {
//   "value": 14,
//   "proficient": 1,
//   "min": 3,
//   "mod": 2,
//   "save": 9,
//   "prof": 7,
//   "saveBonus": 0,
//   "checkBonus": 0,
//   "dc": 17
// },
/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} monster JSON Import
 * @param {obj} CONFIG.DDB config
 */
export function getAbilities(abilities, monster) {
  // go through every ability
  DICTIONARY.character.abilities.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id).value || 0;
    const proficient = monster.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;
    const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

    abilities[ability.value]['value'] = value;
    abilities[ability.value]['proficient'] = proficient;
    abilities[ability.value]['mod'] = mod;

    if (proficient) {
      abilities[ability.value]['prof'] = proficiencyBonus;
      abilities[ability.value]['saveBonus'] = monster.savingThrows.find((stat) => stat.statId === ability.id).bonusModifier || 0;
      abilities[ability.value]['save'] = mod + proficiencyBonus + abilities[ability.value]['saveBonus'];
    }

    abilities[ability.value]['dc'] = mod + proficiencyBonus + 8;
  });

  return abilities;
}


export function getAbilityMods(monster) {
  let abilities = {};

  DICTIONARY.character.abilities.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id).value || 0;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;
    abilities[ability.value] = mod;
  });

  return abilities;

}
