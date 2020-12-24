import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";

import { buildBase, getClassFeature } from "./shared.js";
import { getImagePath, getCompendiumLabel, updateCompendium, srdFiddling, munchNote } from "../import.js";

async function buildClass(klass, compendiumClassFeatures, compendiumLabel) {
  let result = buildBase(klass);
  console.warn(`Parsing ${klass.name}`);

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

  const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
  // eslint-disable-next-line require-atomic-updates
  result.data.description.value += image;

  result.flags.ddbimporter['parentClassId'] = klass.parentClassId;
  result.flags.ddbimporter['hitDice'] = klass.hitDice;
  result.flags.ddbimporter['spellCastingAbilityId'] = klass.spellCastingAbilityId;

  // setup data
  result.data.levels = 1;
  result.data.hitDice = `d${klass.hitDice}`;

  let spellcasting = "";
  if (klass.canCastSpells) {
    const spellProgression = DICTIONARY.spell.progression.find((cls) => cls.name == klass.name);
    if (spellProgression) {
      spellcasting = spellProgression.value;
    }
  }
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
    result.data.skills = {
      number: numberSkills ? numberSkills.num : 2,
      choices: skills,
      value: [],
    };
  }

  // "moreDetailsUrl": "/characters/classes/rogue",

  console.warn(`Still parsing ${klass.name}`);
  if (klass.equipmentDescription) {
    result.data.description.value += `<p><b>Starting Equipment</b></p>\n${klass.equipmentDescription}\n\n`;
  }

  let classFeatures = [];

  klass.classFeatures.forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f === feature.name);

    //sort by level?
    if (!classFeaturesAdded) {
      const featureMatch = compendiumClassFeatures.find((match) => feature.name.trim().toLowerCase() == match.name.trim().toLowerCase() && match.flags.ddbimporter && match.flags.ddbimporter.classId == klass.id);
      const title = (featureMatch) ? `<p><b>${feature.name}</b> @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</p>` : `<p><b>${feature.name}</b></p>`;

      result.data.description.value += `${title}\n${feature.description}\n\n`;
      classFeatures.push(feature.name);
    }

  });

  console.warn(`Result! ${klass.name}`);
  console.log(result);

  return result;
}


const NO_TRAITS = [
  "Speed",
  "Ability Score Increase",
  "Ability Score Improvement",
  "Size",
  "Feat",
  "Languages",
  "Hit Points",
  "Proficiencies",
];

export async function getClasses(data) {
  logger.debug("get clases started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let klasses = [];
  let classFeatures = [];

  data.forEach((klass) => {
    logger.debug(`${klass.fullName} feature parsing started...`);
    klass.classFeatures.forEach((feature) => {
      const existingFeature = classFeatures.some((f) => f.name === feature.name);
      logger.debug(`${feature.name} feature starting...`);
      if (!NO_TRAITS.includes(feature.name) && !existingFeature) {
        const parsedFeature = getClassFeature(feature, klass);
        classFeatures.push(parsedFeature);
      }
    });
  });

  const fiddledClassFeatures = await srdFiddling(classFeatures, "classes");
  munchNote(`Importing ${fiddledClassFeatures.length} features!`, true);
  await updateCompendium("features", { features: fiddledClassFeatures }, updateBool);

  const compendiumLabel = getCompendiumLabel("features");
  const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
  const index = await compendium.getIndex();
  const firstPassFeatures = await index.filter((i) => fiddledClassFeatures.some((orig) => i.name === orig.name));
  let compendiumClassFeatures = [];

  await Promise.allSettled(firstPassFeatures.map(async (f) => {
    const feature = await compendium.getEntry(f._id);
    compendiumClassFeatures.push(feature);
  }));

  await Promise.allSettled(data.map(async (klass) => {
    logger.debug(`${klass.fullName} class parsing started...`);
    const builtClass = await buildClass(klass, compendiumClassFeatures, compendiumLabel);
    klasses.push(builtClass);
  }));

  const fiddledClasses = await srdFiddling(klasses, "classes");
  munchNote(`Importing ${fiddledClasses.length} classes!`, true);
console.warn(fiddledClasses);
  await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  return fiddledClasses.concat(fiddledClassFeatures);
}
