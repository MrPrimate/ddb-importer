import logger from "../../logger.js";

import { buildBase, getClassFeature } from "./shared.js";
import { getImagePath, getCompendiumLabel, updateCompendium, srdFiddling, munchNote } from "../import.js";

async function buildClass(klass, compendiumClassTraits, compendiumLabel) {
  let result = buildBase(klass);

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

  // "moreDetailsUrl": "/characters/classes/rogue",

  if (klass.equipmentDescription) {
    result.data.description.value += `<p><b>Starting Equipment</b></p>\n${klass.equipmentDescription}\n\n`;
  }

  classFeaturesAdded = [];

  klass.classFeatures.forEach((feature) => {
    const classFeaturesAdded = classFeatures.some((f) => f.name === feature.name);

    //sort by level?
    if (!classFeaturesAdded) {
      const featureMatch = compendiumClassTraits.find((match) => feature.name === match.name && match.flags.ddbimporter && match.flags.ddbimporter.parentClassId === feature.parentClassId);
      const title = (featureMatch) ? `<p><b>${feature.name}</b> @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</p>` : `<p><b>${feature.name}</b></p>`;

      result.data.description.value += `${title}\n${feature.description}\n\n`;
      classFeaturesAdded.push(feature.name);
    }

  });

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
        const parsedFeature = getClassFeature(feature, klass.name, "");
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

  await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  return fiddledClasses.concat(fiddledClassFeatures);
}
