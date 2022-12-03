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
 * @param {obj} ddb JSON Import
 * @param {obj} CONFIG.DDB config
 */
export function getAbilities(abilities, ddb) {
  // go through every ability
  ABILITIES.forEach((ability) => {
    const value = ddb.stats.find((stat) => stat.id === ability.id)?.value || 10;
    const mod = value === 0
      ? -5
      : CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

    abilities[ability.value]['value'] = value;
    abilities[ability.value]['proficient'] = 0;
    abilities[ability.value]['mod'] = mod;

  });

  return abilities;
}


export function getAbilityMods(ddb) {
  let abilities = {};

  ABILITIES.forEach((ability) => {
    const value = ddb.stats.find((stat) => stat.id === ability.id)?.value || 10;
    const mod = value === 0
      ? -5
      : CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

    abilities[ability.value] = mod;
  });

  return abilities;

}
