import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBMonster from "../DDBMonster.js";

// skills: [
//   { skillId: 5, value: 9, additionalBonus: null },
//   { skillId: 14, value: 9, additionalBonus: null }
// ],

// "skills": [{
//   "skillId": 7, # History
//   "value": 8,
//   "additionalBonus": null
// }, {
//   "skillId": 14, # Perception
//   "value": 6,
//   "additionalBonus": null
// }],

// "ste": {
//   "value": 1,
//   "ability": "dex",
//   "bonus": 0,
//   "mod": 2,
//   "passive": 19,
//   "prof": 7,
//   "total": 9
// },
DDBMonster.prototype._generateSkills = function _generateSkills () {
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
  const validSkills = DICTIONARY.character.skills.map((skill) => skill.name);

  const keys = Object.keys(this.npc.system.skills);
  keys
    .filter((key) => validSkills.includes(key))
    .forEach((key) => {
      let skill = this.npc.system.skills[key];
      const ability = DICTIONARY.character.abilities.find((ab) => ab.value === skill.ability);
      const stat = this.source.stats.find((stat) => stat.statId === ability.id).value || 10;
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
      const lookupSkill = DICTIONARY.character.skills.find((s) => s.name == key);
      const monsterSkill = this.source.skills.find((s) => s.skillId == lookupSkill.valueId);

      this.npc.system.skills[key].mod = mod;

      const calculatedScore = proficiencyBonus + mod;

      if (monsterSkill) {
        this.npc.system.skills[key].value = 1;
        this.npc.system.skills[key].prof = proficiencyBonus;
        this.npc.system.skills[key].bonus = monsterSkill.additionalBonus || 0;
      }

      this.npc.system.skills[key].total = calculatedScore;
      this.npc.system.skills[key].passive = 10 + calculatedScore;

      if (monsterSkill && monsterSkill.value != calculatedScore) {
        if (monsterSkill.value == calculatedScore + proficiencyBonus) {
          this.npc.system.skills[key].passive += proficiencyBonus;
          this.npc.system.skills[key].value = 2;
          this.npc.system.skills[key].total += proficiencyBonus;
          this.npc.system.skills[key].prof += proficiencyBonus;
          this.npc.system.skills[key].bonus = 0;
        } else if (monsterSkill.value > calculatedScore + proficiencyBonus) {
          this.npc.system.skills[key].passive += proficiencyBonus;
          this.npc.system.skills[key].value = 2;
          this.npc.system.skills[key].total += proficiencyBonus;
          this.npc.system.skills[key].prof += proficiencyBonus;
        }
      }

    });

  return this.npc.system.skills;
};


DDBMonster.prototype._generateSkillsHTML = function _generateSkillsHTML () {
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
  //  "skillsHtml": "History + 12, Perception + 10"
  const skillsHTML = utils.stripHtml(this.source.skillsHtml).split(',');
  const skillsMaps = skillsHTML.filter((str) => str != '').map((str) => {
    const skillMatch = str.match(/(\w+\s*\w*\s*\w*)(?:\s*)([+-])(?:\s*)(\d+)/);
    let result = {};
    if (skillMatch) {
      result = {
        name: skillMatch[1].trim(),
        value: skillMatch[2] + skillMatch[3],
      };
    } else {
      logger.error(`Skill Parsing failed for ${this.source.name}`);
      logger.debug(skillsHTML);
      logger.debug(str);
      logger.debug(skillMatch);
    }
    return result;
  });

  const keys = Object.keys(this.npc.system.skills);
  const validSkills = DICTIONARY.character.skills.map((skill) => skill.name);
  keys
    .filter((key) => validSkills.includes(key))
    .forEach((key) => {
      let skill = this.npc.system.skills[key];
      const ability = DICTIONARY.character.abilities.find((ab) => ab.value === skill.ability);
      const stat = this.source.stats.find((stat) => stat.statId === ability.id).value || 10;
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
      const lookupSkill = DICTIONARY.character.skills.find((s) => s.name == key);
      const monsterSkill = this.source.skills.find((s) => s.skillId == lookupSkill.valueId);

      this.npc.system.skills[key].mod = mod;

      if (monsterSkill) {
        this.npc.system.skills[key].value = 1;
        this.npc.system.skills[key].prof = proficiencyBonus;
        this.npc.system.skills[key].bonus = monsterSkill.additionalBonus || 0;
      }
      const calculatedScore = this.npc.system.skills[key].prof + mod + this.npc.system.skills[key].bonus;
      this.npc.system.skills[key].total = calculatedScore;
      this.npc.system.skills[key].passive = 10 + calculatedScore;

      const htmlSkill = skillsMaps.find((skl) => skl.name == lookupSkill.label);

      if (htmlSkill) {
        if (htmlSkill.value > calculatedScore) {
          this.npc.system.skills[key].passive += proficiencyBonus;
          this.npc.system.skills[key].value = 2;
          this.npc.system.skills[key].total += proficiencyBonus;
          this.npc.system.skills[key].prof += proficiencyBonus;
        }
      }

    });

  return this.npc.system.skills;
};
