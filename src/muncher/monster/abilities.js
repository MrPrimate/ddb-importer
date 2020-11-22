export const ABILITIES = [
  { id: 1, value: "str", long: "strength" },
  { id: 2, value: "dex", long: "dexterity" },
  { id: 3, value: "con", long: "constitution" },
  { id: 4, value: "int", long: "intelligence" },
  { id: 5, value: "wis", long: "wisdom" },
  { id: 6, value: "cha", long: "charisma" },
];

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
 * @param {obj} DDB_CONFIG config
 */
export function getAbilities(abilities, monster, DDB_CONFIG) {
  // go through every ability
  ABILITIES.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id).value || 0;
    const proficient = monster.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;
    const proficiencyBonus = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
    const mod = DDB_CONFIG.statModifiers.find((s) => s.value == value).modifier;

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


export function getAbilityMods(monster, DDB_CONFIG) {
  let abilities = {};

  ABILITIES.forEach((ability) => {
    const value = monster.stats.find((stat) => stat.statId === ability.id).value || 0;
    const mod = DDB_CONFIG.statModifiers.find((s) => s.value == value).modifier;
    abilities[ability.value] = mod;
  });

  return abilities;

}
