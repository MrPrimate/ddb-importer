import utils from "../../utils.js";
import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";
import { getImagePath } from "../import.js";

const CLASS_TEMPLATE = {
  "name": "",
  "type": "feat",
  "data": {
    "description": {
      "value": "",
      "chat": "",
      "unidentified": ""
    },
    "source": "",
  },
  "sort": 2600000,
  "flags": {
    "ddbimporter": {},
  },
  "img": null
};

export const NO_TRAITS = [
  "Speed",
  "Ability Score Increase",
  "Ability Score Improvement",
  "Size",
  "Feat",
  "Languages",
  "Hit Points",
  "Proficiencies",
  "Bonus Proficiencies",
  "Bonus Proficiency",
  "Extra Attack",
  "Tool Proficiency",
  "Bonus Cantrip",
  "Bonus Cantrips",
];

export const FEATURE_DUP = [
  "Expertise",
  "Fighting Style",
  "Land's Stride",
  "Otherworldly Patron",
  "Pact Magic",
  "Potent Spellcasting",
  "Timeless Body",
  "Unarmored Defense",
  "Circle Spells",
  "Divine Strike",
  "Evasion",
  "Channel Divinity",
  "Expanded Spell List",
  "Oath Spells",
  "Psionic Power",
  "Psychic Blades",
  "Spellcasting",
];

function buildBase(data) {
  let result = JSON.parse(JSON.stringify(CLASS_TEMPLATE));

  result.name = data.name;
  result.data.description.value += `${data.description}\n\n`;

  result.flags.ddbimporter = {
    id: data.id,
    data: data,
  };

  if (data.moreDetailsUrl) {
    result.flags.ddbimporter['moreDetailsUrl'] = data.moreDetailsUrl;
  }

  result.data.source = utils.parseSource(data);

  return result;
}
export function getClassFeature(feature, klass, subClassName = "") {
  logger.debug("Class feature build started");

  let result = buildBase(feature);

  const duplicateFeature = FEATURE_DUP.includes(feature.name);
  result.name = (duplicateFeature) ? `${feature.name} (${klass.name})` : feature.name;

  result.flags.ddbimporter['featureId'] = feature.id;
  result.flags.ddbimporter['requiredLevel'] = feature.requiredLevel;
  result.flags.ddbimporter['prerequisite'] = feature.prerequisite;
  result.flags.ddbimporter['class'] = klass.name;
  result.flags.ddbimporter['classId'] = klass.id;
  result.flags.ddbimporter['subClass'] = subClassName;
  result.data.requirements = klass.name;

  return result;
}

export async function buildBaseClass(klass) {
  let result = buildBase(klass);
  logger.debug(`Parsing ${klass.name}`);

  result.type = "class";

  let avatarUrl;
  let largeAvatarUrl;
  let portraitAvatarUrl;

  if (klass.portraitAvatarUrl) {
    portraitAvatarUrl = await getImagePath(klass.portraitAvatarUrl, "class-portrait", klass.fullName, true);
    result.img = portraitAvatarUrl;
    result.flags.ddbimporter['portraitAvatarUrl'] = klass.portraitAvatarUrl;
  }

  if (klass.avatarUrl) {
    avatarUrl = await getImagePath(klass.avatarUrl, "class-avatar", klass.fullName, true);
    result.flags.ddbimporter['avatarUrl'] = klass.avatarUrl;
    if (!result.img) {
      result.img = avatarUrl;
    }
  }

  if (klass.largeAvatarUrl) {
    largeAvatarUrl = await getImagePath(klass.largeAvatarUrl, "class-large", klass.fullName, true);
    // eslint-disable-next-line require-atomic-updates
    result.flags.ddbimporter['largeAvatarUrl'] = klass.largeAvatarUrl;
    if (!result.img) {
      // eslint-disable-next-line require-atomic-updates
      result.img = largeAvatarUrl;
    }
  }

  const image = (avatarUrl) ? `<img class="ddb-class-image" src="${avatarUrl}">\n\n` : `<img class="ddb-class-image" src="${largeAvatarUrl}">\n\n`;

  // eslint-disable-next-line require-atomic-updates
  result.data.description.value += image;

  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['parentClassId'] = klass.parentClassId;
  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['hitDice'] = klass.hitDice;
  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['spellCastingAbilityId'] = klass.spellCastingAbilityId;
  // eslint-disable-next-line require-atomic-updates
  result.flags.ddbimporter['canCastSpells'] = klass.canCastSpells;

  // setup data
  // eslint-disable-next-line require-atomic-updates
  result.data.levels = 1;
  // eslint-disable-next-line require-atomic-updates
  result.data.hitDice = `d${klass.hitDice}`;

  let spellcasting = "";
  if (klass.canCastSpells) {
    const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name == klass.name);
    if (spellProgression) {
      spellcasting = spellProgression.value;
    }
  }
  // eslint-disable-next-line require-atomic-updates
  result.data.spellcasting = spellcasting;

  // this can be used with the add class response
  // const classSkillSubType = `choose-a-${klass.name.toLowerCase()}-skill`;
  // const skillCount = .filter((mod) => mod.subType === classSkillSubType && mod.type === "proficiency"));

  const proficiencyOption = klass.classFeatures.find((feature) =>
    feature.name === "Proficiencies" &&
    feature.requiredLevel === 1
  );

  let dom = new DocumentFragment();
  $.parseHTML(proficiencyOption.description).forEach((element) => {
    dom.appendChild(element);
  });

  // Choose any three
  // Skills: Choose two from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, and Survival
  const allSkillRegex = /Skills: Choose any (\w+)(.*)($|\.$|\w+:)/;
  const allMatch = dom.textContent.match(allSkillRegex);
  const skillRegex = /Skills: Choose (\w+) from (.*)($|The|\.$|\w+:)/;
  const skillMatch = dom.textContent.match(skillRegex);

  if (allMatch) {
    const skills = DICTIONARY.character.skills.map((skill) => skill.name);
    const numberSkills = DICTIONARY.numbers.find((num) => allMatch[1].toLowerCase() === num.natural);
    // eslint-disable-next-line require-atomic-updates
    result.data.skills = {
      number: numberSkills ? numberSkills.num : 2,
      choices: skills,
      value: [],
    };
  } else if (skillMatch) {
    const skillNames = skillMatch[2].replace('and', ',').split(',').map((skill) => skill.trim());
    const skills = skillNames.filter((name) => DICTIONARY.character.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
    .map((name) => {
      const dictSkill = DICTIONARY.character.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
      return dictSkill.name;
    });
    const numberSkills = DICTIONARY.numbers.find((num) => skillMatch[1].toLowerCase() === num.natural);
    // eslint-disable-next-line require-atomic-updates
    result.data.skills = {
      number: numberSkills ? numberSkills.num : 2,
      choices: skills,
      value: [],
    };
  }

  // "moreDetailsUrl": "/characters/classes/rogue",

  if (klass.equipmentDescription) {
    // eslint-disable-next-line require-atomic-updates
    result.data.description.value += `<p><b>Starting Equipment</b></p>\n${klass.equipmentDescription}\n\n`;
  }

  return result;
}

export async function buildClassFeatures(klass, compendiumClassFeatures, compendiumLabel) {
  logger.debug(`Parsing ${klass.name} features`);
  let description = "<h3>Class Features</h3>\n\n";
  let classFeatures = [];

  klass.classFeatures.forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

    // sort by level?
    if (!classFeaturesAdded) {
      const featureMatch = compendiumClassFeatures.find((match) => feature.name.trim().toLowerCase() == match.name.trim().toLowerCase() && match.flags.ddbimporter && match.flags.ddbimporter.classId == klass.id);
      const title = (featureMatch) ? `<p><b>${feature.name}</b> @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</p>` : `<p><b>${feature.name}</b></p>`;

      // eslint-disable-next-line require-atomic-updates
      description += `${title}\n${feature.description}\n\n`;
      classFeatures.push(feature.name);
    }

  });

  return description;
}
