import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

let isHalfProficiencyRoundedUp = (data, skill) => {
  const longAbility = DICTIONARY.character.abilities
    .filter((ability) => skill.ability === ability.value)
    .map((ability) => ability.long)[0];
  const roundUp = utils.filterBaseModifiers(data, "half-proficiency-round-up", `${longAbility}-ability-checks`);
  return Array.isArray(roundUp) && roundUp.length;
};

let getSkillProficiency = (data, skill) => {
  const modifiers = [
    utils.getChosenClassModifiers(data),
    data.character.modifiers.race,
    utils.getActiveItemModifiers(data),
    data.character.modifiers.feat,
    data.character.modifiers.background,
  ]
    .flat()
    .filter((modifier) => modifier.friendlySubtypeName === skill.label)
    .map((mod) => mod.type);

  const halfProficiency =
    utils.getChosenClassModifiers(data).find(
      (modifier) =>
        // Jack of All trades/half-rounded down
        (modifier.type === "half-proficiency" && modifier.subType === "ability-checks") ||
        // e.g. champion for specific ability checks
        isHalfProficiencyRoundedUp(data, skill)
    ) !== undefined
      ? 0.5
      : 0;

  const proficient = modifiers.includes("expertise") ? 2 : modifiers.includes("proficiency") ? 1 : halfProficiency;

  return proficient;
};

let getCustomSkillProficiency = (data, skill) => {
  // Overwrite the proficient value with any custom set over rides
  if (data.character.characterValues) {
    const customProficiency = data.character.characterValues.find(
      (value) => value.typeId === 26 && value.valueId === skill.valueId
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
  if (data.character.characterValues) {
    const customAbility = data.character.characterValues.find(
      (value) => value.typeId === 27 && value.valueId === skill.valueId
    );
    if (customAbility) {
      return customAbility.value;
    }
  }
  return undefined;
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


export function getSkills(data, character) {
  let result = {};
  character.flags['skill-customization-5e'] = {};
  DICTIONARY.character.skills.forEach((skill) => {
    const customProficient = getCustomSkillProficiency(data, skill);
    // we use !== undefined because the return value could be 0, which is falsey
    const proficient = customProficient !== undefined ? customProficient : getSkillProficiency(data, skill);

    // some abilities round half prof up, some down
    const proficiencyBonus = isHalfProficiencyRoundedUp(data, skill)
      ? Math.ceil(2 * character.data.attributes.prof * proficient)
      : Math.floor(2 * character.data.attributes.prof * proficient);

    // Skill bonuses e.g. items
    // These no longer seems to be picked up in recent versions of the DND5e module
    const skillModifierBonus = utils
      .filterBaseModifiers(data, "bonus", skill.subType)
      .map((skl) => skl.value)
      .reduce((a, b) => a + b, 0) || 0;
    const customSkillBonus = getCustomSkillBonus(data, skill);
    const skillBonus = skillModifierBonus + customSkillBonus;

    if (skillBonus && skillBonus > 0) {
      character.flags['skill-customization-5e'][skill.name] = {
        "skill-bonus": skillBonus
      };
    }

    const value = character.data.abilities[skill.ability].value + proficiencyBonus + skillBonus;

    const customAbility = getCustomSkillAbility(data, skill);
    const ability = customAbility !== undefined ? customAbility : skill.ability;

    result[skill.name] = {
      type: "Number",
      label: skill.label,
      ability: ability,
      value: proficient,
      mod: utils.calculateModifier(value),
      bonus: skillBonus,
    };
  });

  return result;
}

