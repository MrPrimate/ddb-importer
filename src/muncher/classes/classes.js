import logger from "../../logger.js";
import { buildBaseClass, getClassFeature, buildClassFeatures, NO_TRAITS } from "./shared.js";
import { updateCompendium, srdFiddling } from "../import.js";
import { munchNote, getCompendiumType } from "../utils.js";


async function buildClass(klass, compendiumClassFeatures) {
  let result = await buildBaseClass(klass);
  result.data.description.value += await buildClassFeatures(klass, compendiumClassFeatures);
  return result;
}

export async function getClasses(data) {
  let results = [];
  logger.debug("get clases started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let klasses = [];
  let classFeatures = [];

  data.forEach((klass) => {
    logger.debug(`${klass.name} feature parsing started...`);
    klass.classFeatures.forEach((feature) => {
      const existingFeature = classFeatures.some((f) => f.name === feature.name);
      logger.debug(`${feature.name} feature starting...`);
      if (!NO_TRAITS.includes(feature.name) && !existingFeature) {
        const parsedFeature = getClassFeature(feature, klass);
        classFeatures.push(parsedFeature);
        results.push({ class: klass.name, subClass: "", feature: feature.name });
      }
    });
  });

  const fiddledClassFeatures = await srdFiddling(classFeatures, "features");
  munchNote(`Importing ${fiddledClassFeatures.length} features!`, true);
  await updateCompendium("features", { features: fiddledClassFeatures }, updateBool);

  const compendium = getCompendiumType("features");
  const index = await compendium.getIndex();
  const firstPassFeatures = await index.filter((i) => fiddledClassFeatures.some((orig) => i.name === orig.name));
  let compendiumClassFeatures = [];

  await Promise.all(firstPassFeatures.map(async (f) => {
    const feature = await compendium.getDocument(f._id);
    compendiumClassFeatures.push(feature.toJSON());
  }));

  await Promise.all(data.map(async (klass) => {
    logger.debug(`${klass.name} class parsing started...`);
    const builtClass = await buildClass(klass, compendiumClassFeatures);
    klasses.push(builtClass);
  }));

  const fiddledClasses = await srdFiddling(klasses, "classes");
  munchNote(`Importing ${fiddledClasses.length} classes!`, true);

  await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  // return fiddledClasses.concat(fiddledClassFeatures);
  return results;
}
