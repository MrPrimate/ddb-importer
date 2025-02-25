import { DICTIONARY } from "../../config/_module.mjs";
import DDBMonster from "../DDBMonster.js";

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
 */
DDBMonster.prototype._generateAbilities = function _generateAbilities() {
  // go through every ability
  const cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
  const proficiencyBonus = cr.proficiencyBonus;
  DICTIONARY.actor.abilities.forEach((ability) => {
    const value = this.source.stats.find((stat) => stat.statId === ability.id).value || 0;
    const proficient = this.source.savingThrows.find((stat) => stat.statId === ability.id) ? 1 : 0;
    const mod = CONFIG.DDB.statModifiers.find((s) => s.value == value).modifier;

    this.npc.system.abilities[ability.value]['value'] = value;
    this.npc.system.abilities[ability.value]['proficient'] = proficient;
    this.npc.system.abilities[ability.value]['mod'] = mod;

    if (proficient) {
      this.npc.system.abilities[ability.value]['prof'] = proficiencyBonus;
      this.npc.system.abilities[ability.value]['saveBonus'] = this.source.savingThrows.find((stat) => stat.statId === ability.id).bonusModifier || 0;
      this.npc.system.abilities[ability.value]['save'] = mod + proficiencyBonus + this.npc.system.abilities[ability.value]['saveBonus'];
    }

    this.npc.system.abilities[ability.value]['dc'] = mod + proficiencyBonus + 8;
  });

  this.abilities = this.npc.system.abilities;

  let initBonus = null;

  if (foundry.utils.hasProperty(this.source, 'initiativeBonus') && Number.isInteger(parseInt(this.source.initiativeBonus))) {
    initBonus = parseInt(this.source.initiativeBonus) - this.npc.system.abilities.dex.mod;
  } else if (foundry.utils.hasProperty(this.source, 'extraInitiative') && Number.isInteger(parseInt(this.source.extraInitiative))) {
    initBonus = parseInt(this.source.extraInitiative) - this.npc.system.abilities.dex.mod;
  }

  if (initBonus !== null && Number.isInteger(parseInt(initBonus))) {
    if ((initBonus / 2) === parseInt(proficiencyBonus)) {
      this.npc.system.attributes.init.bonus = "2 * @prof";
    } else if (initBonus === parseInt(proficiencyBonus)) {
      this.npc.system.attributes.init.bonus = "@prof";
    } else {
      this.npc.system.attributes.init.bonus = `${initBonus}`;
    }
  }

};
