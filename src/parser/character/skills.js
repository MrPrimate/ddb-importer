import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { generateBaseSkillEffect } from "../../effects/effects.js";

let isHalfProficiencyRoundedUp = (data, skill, modifiers = null) => {
  const longAbility = DICTIONARY.character.abilities
    .filter((ability) => skill.ability === ability.value)
    .map((ability) => ability.long)[0];

  const roundUp = (modifiers)
    ? DDBHelper.filterModifiers(modifiers, "half-proficiency-round-up", `${longAbility}-ability-checks`)
    : DDBHelper.filterBaseModifiers(data, "half-proficiency-round-up", `${longAbility}-ability-checks`, ["", null], true);
  return Array.isArray(roundUp) && roundUp.length;
};

export function getSkillProficiency (data, skill, modifiers = null) {
  if (!modifiers) {
    modifiers = [
      DDBHelper.getChosenClassModifiers(data, true),
      DDBHelper.getModifiers(data, "race", true),
      DDBHelper.getModifiers(data, "background", true),
      DDBHelper.getModifiers(data, "feat", true),
      DDBHelper.getActiveItemModifiers(data, true),
    ].flat();
  }

  const skillMatches = modifiers
    .filter((modifier) => modifier.friendlySubtypeName === skill.label)
    .map((mod) => mod.type);

  const halfProficiency = modifiers.find(
    (modifier) =>
    // Jack of All trades/half-rounded down
      (modifier.type === "half-proficiency" && modifier.subType === "ability-checks")
        // e.g. champion for specific ability checks
        || isHalfProficiencyRoundedUp(data, skill, modifiers)
  ) !== undefined
    ? 0.5
    : 0;

  const proficient = skillMatches.includes("expertise") ? 2 : skillMatches.includes("proficiency") ? 1 : halfProficiency;

  return proficient;
}

let getCustomSkillProficiency = (data, skill) => {
  // Overwrite the proficient value with any custom set over rides
  if (data.character.characterValues) {
    const customProficiency = data.character.characterValues.find(
      (value) => value.typeId === 26 && value.valueId == skill.valueId && value.value
    );
    if (customProficiency) {
      return DICTIONARY.character.customSkillProficiencies.find((prof) => prof.value === customProficiency.value)
        .proficient;
    }
  }
  return undefined;
};

let getCustomSkillAbility = (data, skill) => {
  // Overwrite the proficient value with any custom set over rides
  let mod;
  if (data.character.characterValues) {
    const customAbility = data.character.characterValues.find(
      (value) => value.typeId === 27 && value.valueId == skill.valueId
    );
    if (customAbility) {
      const ability = DICTIONARY.character.abilities.find((ability) => ability.id == customAbility.value);
      if (ability) mod = ability.value;
    }
  }
  return mod;
};

let getCustomSkillBonus = (data, skill) => {
  // Get any custom skill bonuses
  if (data.character.characterValues) {
    const customBonus = data.character.characterValues.filter(
      (value) => (value.typeId == 24 || value.typeId == 25) && value.valueId == skill.valueId
    ).reduce((total, bonus) => {
      return total + bonus.value;
    }, 0);

    if (customBonus) {
      return customBonus;
    }
  }
  return 0;
};

function setSpecial(data, skills) {
  data.character.classes.forEach((klass) => {
    if (klass.subclassDefinition) {
      // Improved Critical
      const silverTongue = klass.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Silver Tongue" && klass.level >= feature.requiredLevel
      );

      // supported in v1.6.0 (hopefully)
      if (silverTongue) {
        skills["per"].bonuses.minimum = 10;
        skills["dec"].bonuses.minimum = 10;
      }
    }
  });
  return skills;
}

export function getSkills(data, character) {
  let result = {};

  const addEffects = game.modules.get("dae")?.active;

  if (!addEffects) character.flags['skill-customization-5e'] = {};
  DICTIONARY.character.skills.forEach((skill) => {
    const customProficient = getCustomSkillProficiency(data, skill);
    // we use !== undefined because the return value could be 0, which is falsey
    const proficient = customProficient !== undefined ? customProficient : getSkillProficiency(data, skill);

    // some abilities round half prof up, some down
    const proficiencyBonus = isHalfProficiencyRoundedUp(data, skill)
      ? Math.ceil(2 * character.system.attributes.prof * proficient)
      : Math.floor(2 * character.system.attributes.prof * proficient);

    // Skill bonuses e.g. items
    // These no longer seems to be picked up in recent versions of the DND5e module
    const skillModifierBonus = DDBHelper
      .filterBaseModifiers(data, "bonus", skill.subType)
      .map((skl) => skl.value)
      .reduce((a, b) => a + b, 0) || 0;
    const customSkillBonus = getCustomSkillBonus(data, skill);
    const skillBonus = skillModifierBonus + customSkillBonus;
    const value = character.system.abilities[skill.ability].value + proficiencyBonus + skillBonus;
    const customAbility = getCustomSkillAbility(data, skill);
    const ability = customAbility !== undefined ? customAbility : skill.ability;

    // custom skill ability over ride effects
    if (customAbility) {
      const label = "Skill Ability Changes";
      const change = {
        key: `data.skills.${skill.name}.ability`,
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: `${customAbility}`,
        priority: "20"
      };

      const changeIndex = character.effects.findIndex((effect) => effect.label === label);
      if (changeIndex >= 0) {
        character.effects[changeIndex].changes.push(change);
      } else {
        let skillEffect = generateBaseSkillEffect(data.character.id, label);
        skillEffect.changes.push(change);
        character.effects.push(skillEffect);
      }
    }

    result[skill.name] = {
      type: "Number",
      label: skill.label,
      ability: ability,
      value: proficient,
      mod: utils.calculateModifier(value),
      bonus: 0,
      bonuses: {
        "check": `${skillBonus}`,
        "passive": "",
        "minimum": null,
      },
    };
  });

  result = setSpecial(data, result);
  return result;
}


