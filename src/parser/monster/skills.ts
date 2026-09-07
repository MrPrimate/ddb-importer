import { DICTIONARY } from "../../config/_module";
import { utils, logger } from "../../lib/_module";
import DDBMonster from "../DDBMonster";

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


DDBMonster.prototype._generateSkills = function _generateSkills (this: DDBMonster) {
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
  const validSkills = DICTIONARY.actor.skills.map((skill) => skill.name);

  const keys = Object.keys(this.npc.system.skills);
  keys
    .filter((key) => validSkills.includes(key))
    .forEach((key) => {
      const skill = this.npc.system.skills[key];
      const ability = DICTIONARY.actor.abilities.find((ab) => ab.value === skill.ability);
      const stat = this.source.stats.find((stat) => stat.statId === ability.id).value || 10;
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
      const lookupSkill = DICTIONARY.actor.skills.find((s) => s.name == key);
      const monsterSkill = this.source.skills.find((s) => s.skillId == lookupSkill.valueId);

      const calculatedScore = proficiencyBonus + mod;
      const additionalBonus = monsterSkill?.additionalBonus || 0;

      if (monsterSkill) {
        this.npc.system.skills[key].value = 1;
        if (additionalBonus > 0) {
          // Check bonuses already contribute to passive scores.
          this.npc.system.skills[key].bonuses.check = `${additionalBonus}`;
        }
      }

      if (monsterSkill && monsterSkill.value != calculatedScore) {
        if (monsterSkill.value == calculatedScore + proficiencyBonus
          || monsterSkill.value == calculatedScore + proficiencyBonus + additionalBonus
        ) {
          this.npc.system.skills[key].value = 2;
        } else {
          logger.warn(`Calculated skill value of ${calculatedScore} for ${lookupSkill.label} on monster ${this.source.name} does not match source value of ${monsterSkill.value}.`, {
            this: this,
            skill,
            ability,
            stat,
            mod,
            lookupSkill,
            monsterSkill,
          });
        }
      }

    });

  return this.npc.system.skills;
};


DDBMonster.prototype._generateSkillsHTML = function _generateSkillsHTML (this: DDBMonster) {
  const proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
  //  "skillsHtml": "History + 12, Perception + 10"
  const skillsHTML = utils.stripHtml(this.source.skillsHtml).split(",");
  const skillsMaps: { name: string; value: string }[] = skillsHTML.filter((str) => str != "").map((str) => {
    // negative modifiers are written as "+-", e.g. "Athletics +-8"
    const skillMatch = str.match(/(\w+\s*\w*\s*\w*)(?:\s*)\+?(?:\s*)([+-])(?:\s*)(\d+)/);
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
  }).filter((s) => foundry.utils.hasProperty(s, "name")
    && foundry.utils.hasProperty(s, "value")) as { name: string; value: string }[];

  const keys = Object.keys(this.npc.system.skills);
  const validSkills = DICTIONARY.actor.skills.map((skill) => skill.name);
  keys
    .filter((key) => validSkills.includes(key))
    .forEach((key) => {
      const skill = this.npc.system.skills[key];
      const ability = DICTIONARY.actor.abilities.find((ab) => ab.value === skill.ability);
      const stat = this.source.stats.find((stat) => stat.statId === ability.id).value || 10;
      const mod = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
      const lookupSkill = DICTIONARY.actor.skills.find((s) => s.name == key);
      const monsterSkill = this.source.skills.find((s) => s.skillId == lookupSkill.valueId);
      const additionalBonus = monsterSkill?.additionalBonus || 0;

      if (monsterSkill) {
        this.npc.system.skills[key].value = 1;
        if (additionalBonus > 0) {
          // Check bonuses already contribute to passive scores.
          this.npc.system.skills[key].bonuses.check = `${additionalBonus}`;
        }
      }

      const calculatedScore = proficiencyBonus + mod + additionalBonus;

      const htmlSkill = skillsMaps.find((skl) => skl.name == lookupSkill.label);

      if (htmlSkill) {
        const htmlValue = parseInt(htmlSkill.value);
        if (htmlValue === calculatedScore + proficiencyBonus) {
          skill.value = 2;
        } else if (htmlValue !== calculatedScore) {
          // the html total matches neither proficiency nor expertise (e.g.
          // Zuul's "Athletics +-8"); apply the remainder as a flat check bonus
          // so the sheet total matches the source stat block. check bonuses
          // already flow into the passive score, so no passive bonus needed
          const bonus = htmlValue - mod - (proficiencyBonus * (skill.value ?? 1));
          skill.bonuses ??= {};
          skill.bonuses.check = `${bonus}`;
        }
      }

    });

  return this.npc.system.skills;
};
