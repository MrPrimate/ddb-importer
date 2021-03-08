export const SKILLS = [
  { name: "acr", label: "Acrobatics", ability: "dex", subType: "acrobatics", valueId: 3 },
  { name: "ani", label: "Animal Handling", ability: "wis", subType: "animal-handling", valueId: 11 },
  { name: "arc", label: "Arcana", ability: "int", subType: "arcana", valueId: 6 },
  { name: "ath", label: "Athletics", ability: "str", subType: "athletics", valueId: 2 },
  { name: "dec", label: "Deception", ability: "cha", subType: "deception", valueId: 16 },
  { name: "his", label: "History", ability: "int", subType: "history", valueId: 7 },
  { name: "ins", label: "Insight", ability: "wis", subType: "insight", valueId: 12 },
  { name: "itm", label: "Intimidation", ability: "cha", subType: "intimidation", valueId: 17 },
  { name: "inv", label: "Investigation", ability: "int", subType: "investigation", valueId: 8 },
  { name: "med", label: "Medicine", ability: "wis", subType: "medicine", valueId: 13 },
  { name: "nat", label: "Nature", ability: "int", subType: "nature", valueId: 9 },
  { name: "prc", label: "Perception", ability: "wis", subType: "perception", valueId: 14 },
  { name: "prf", label: "Performance", ability: "cha", subType: "performance", valueId: 18 },
  { name: "per", label: "Persuasion", ability: "cha", subType: "persuasion", valueId: 19 },
  { name: "rel", label: "Religion", ability: "int", subType: "religion", valueId: 10 },
  { name: "slt", label: "Sleight of Hand", ability: "dex", subType: "sleight-of-hand", valueId: 4 },
  { name: "ste", label: "Stealth", ability: "dex", subType: "stealth", valueId: 5 },
  { name: "sur", label: "Survival", ability: "wis", subType: "survival", valueId: 15 },
];

import logger from "../../logger.js";
import { ABILITIES } from "./abilities.js";

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
export function getSkills (skills, monster, DDB_CONFIG) {
  const proficiencyBonus = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;

  const keys = Object.keys(skills);
  keys.forEach((key) => {
    let skill = skills[key];
    const ability = ABILITIES.find((ab) => ab.value === skill.ability);
    const stat = monster.stats.find((stat) => stat.statId === ability.id).value || 10;
    const mod = DDB_CONFIG.statModifiers.find((s) => s.value == stat).modifier;
    const lookupSkill = SKILLS.find((s) => s.name == key);
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


export function getSkillsHTML (skills, monster, DDB_CONFIG) {
  const proficiencyBonus = DDB_CONFIG.challengeRatings.find((cr) => cr.id == monster.challengeRatingId).proficiencyBonus;
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
  keys.forEach((key) => {
    let skill = skills[key];
    const ability = ABILITIES.find((ab) => ab.value === skill.ability);
    const stat = monster.stats.find((stat) => stat.statId === ability.id).value || 10;
    const mod = DDB_CONFIG.statModifiers.find((s) => s.value == stat).modifier;
    const lookupSkill = SKILLS.find((s) => s.name == key);
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
