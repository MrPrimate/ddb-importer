import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";

import { getClassFeature } from "./shared.js";
import { buildBaseClass, buildClassFeatures } from "./classes.js";
import { getCompendiumLabel, updateCompendium, srdFiddling } from "../import.js";
import { munchNote } from "../utils.js";

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

async function buildSubClass(klass, compendiumSubClassFeatures, compendiumLabel) {

  console.warn(klass);
  // get base class
  const classCompendiumLabel = getCompendiumLabel("class");
  const classCompendium = await game.packs.find((pack) => pack.collection === classCompendiumLabel);
  const classIndex = await classCompendium.getIndex();
  const indexClass = await classIndex.filter((i) =>
    i.flags.ddbimporter['id'] === klass.parentClassId
  );

  let result = await compendium.getEntry(indexClass._id);

  console.warn(result);

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

  const imageMatch = /$<img class="ddb-class-image"(.*)$/;
  const image = (avatarUrl) ? `<img class="ddb-class-image" src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img class="ddb-class-image" src="${largeAvatarUrl}">\n\n` : `<img class="ddb-class-image" src="">`;
  result.description.value.replace(imageMatch, image);

  result.name += ` (${klass.name})`;
  result.description += `<h3>${klass.name}</h3>\n${klass.description}\n\n`;

  console.log(result);
  return result;

}

export async function getSubClasses(data) {
  logger.debug("get subclasses started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  console.warn(data);

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
    logger.debug(`${klass.fullName} subclass parsing started...`);
    const builtClass = await buildSubClass(klass, compendiumClassFeatures, compendiumLabel);
    klasses.push(builtClass);
  }));

  const fiddledClasses = await srdFiddling(klasses, "classes");
  munchNote(`Importing ${fiddledClasses.length} subclasses!`, true);

  await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  return fiddledClasses.concat(fiddledClassFeatures);
}
