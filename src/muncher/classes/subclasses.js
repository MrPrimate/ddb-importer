import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";

import { buildBase, getClassFeature } from "./shared.js";
import { buildBaseClass, buildClassFeatures } from "./classes.js";
import { getImagePath, getCompendiumLabel, updateCompendium, srdFiddling, munchNote } from "../import.js";

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

  // const compendiumLabel = getCompendiumLabel("features");
  // const compendium = await game.packs.find((pack) => pack.collection === compendiumLabel);
  // const index = await compendium.getIndex();
  // const firstPassFeatures = await index.filter((i) => fiddledClassFeatures.some((orig) => i.name === orig.name));
  // let compendiumClassFeatures = [];

  // await Promise.allSettled(firstPassFeatures.map(async (f) => {
  //   const feature = await compendium.getEntry(f._id);
  //   compendiumClassFeatures.push(feature);
  // }));

  // await Promise.allSettled(data.map(async (klass) => {
  //   logger.debug(`${klass.fullName} class parsing started...`);
  //   const builtClass = await buildClass(klass, compendiumClassFeatures, compendiumLabel);
  //   klasses.push(builtClass);
  // }));

  // const fiddledClasses = await srdFiddling(klasses, "classes");
  // munchNote(`Importing ${fiddledClasses.length} classes!`, true);

  // await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  // return fiddledClasses.concat(fiddledClassFeatures);
  return fiddledClassFeatures;
}
