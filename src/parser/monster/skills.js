import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";

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
export function getSkills (skills, monster) {
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
  const validSkills = DICTIONARY.character.skills.map((skill) => skill.name);

  const keys = Object.keys(skills);
  keys
    .filter((key) => validSkills.includes(key))
    .forEach((key) => {
      let skill = skills[key];
      const ability = DICTIONARY.character.abilities.find((ab) => ab.value === skill.ability);
      const stat = monster.stats.find((stat) => stat.statId === ability.id).value || 10;
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
      const lookupSkill = DICTIONARY.character.skills.find((s) => s.name == key);
      const monsterSkill = monster.skills.find((s) => s.skillId == lookupSkill.valueId);

      skills[key].mod = mod;

      const calculatedScore = proficiencyBonus + mod;

      if (monsterSkill) {
        skills[key].value = 1;
        skills[key].prof = proficiencyBonus;
        skills[key].bonus = monsterSkill.additionalBonus || 0;
      }

      skills[key].total = calculatedScore;
      skills[key].passive = 10 + calculatedScore;

      if (monsterSkill && monsterSkill.value != calculatedScore) {
        if (monsterSkill.value == calculatedScore + proficiencyBonus) {
          skills[key].passive += proficiencyBonus;
          skills[key].value = 2;
          skills[key].total += proficiencyBonus;
          skills[key].prof += proficiencyBonus;
          skills[key].bonus = 0;
        } else if (monsterSkill.value > calculatedScore + proficiencyBonus) {
          skills[key].passive += proficiencyBonus;
          skills[key].value = 2;
          skills[key].total += proficiencyBonus;
          skills[key].prof += proficiencyBonus;
        }
      }

    });

  return skills;
}


export function getSkillsHTML (skills, monster) {
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
  //  "skillsHtml": "History + 12, Perception + 10"
  const skillsHTML = monster.skillsHtml.split(',');
  const skillsMaps = skillsHTML.filter((str) => str != '').map((str) => {
    const skillMatch = str.match(/(\w+\s*\w*\s*\w*)(?:\s*)([+-])(?:\s*)(\d+)/);
    let result = {};
    if (skillMatch) {
      result = {
        name: skillMatch[1].trim(),
        value: skillMatch[2] + skillMatch[3],
      };
    } else {
      logger.error(`Skill Parsing failed for ${monster.name}`);
      logger.debug(skillsHTML);
      logger.debug(str);
      logger.debug(skillMatch);
    }
    return result;
  });

  const keys = Object.keys(skills);
  const validSkills = DICTIONARY.character.skills.map((skill) => skill.name);
  keys
    .filter((key) => validSkills.includes(key))
    .forEach((key) => {
      let skill = skills[key];
      const ability = DICTIONARY.character.abilities.find((ab) => ab.value === skill.ability);
      const stat = monster.stats.find((stat) => stat.statId === ability.id).value || 10;
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
      const lookupSkill = DICTIONARY.character.skills.find((s) => s.name == key);
      const monsterSkill = monster.skills.find((s) => s.skillId == lookupSkill.valueId);

      skills[key].mod = mod;

      if (monsterSkill) {
        skills[key].value = 1;
        skills[key].prof = proficiencyBonus;
        skills[key].bonus = monsterSkill.additionalBonus || 0;
      }
      const calculatedScore = skills[key].prof + mod + skills[key].bonus;
      skills[key].total = calculatedScore;
      skills[key].passive = 10 + calculatedScore;

      const htmlSkill = skillsMaps.find((skl) => skl.name == lookupSkill.label);

      if (htmlSkill) {
        if (htmlSkill.value > calculatedScore) {
          skills[key].passive += proficiencyBonus;
          skills[key].value = 2;
          skills[key].total += proficiencyBonus;
          skills[key].prof += proficiencyBonus;
        }
      }

    });

  return skills;
}
