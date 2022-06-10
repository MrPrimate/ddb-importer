import logger from "../../logger.js";
import { buildBaseClass, getClassFeature, NO_TRAITS, buildClassFeatures, generateFeatureAdvancements } from "./shared.js";
import { updateCompendium, srdFiddling } from "../import.js";
import { munchNote, getCompendiumType } from "../utils.js";
import { parseTags } from "../../parser/templateStrings.js";
// import { buildClassFeatures } from "../../parser/classes/index.js";
import { getHPAdvancement } from "../../parser/classes/index.js";

async function buildClass(klass, compendiumClassFeatures) {
  let result = await buildBaseClass(klass);
  result.system.advancement.push(getHPAdvancement());
  result.system.description.value += await buildClassFeatures(klass, compendiumClassFeatures);
  result.system.description.value = parseTags(result.system.description.value);
  result.system.advancement.push(...await generateFeatureAdvancements(klass, compendiumClassFeatures));
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
    klass.classFeatures
      .sort((a, b) => a.requiredLevel - b.requiredLevel)
      .forEach((feature) => {
        const existingFeature = classFeatures.some((f) =>
          f.flags.ddbimporter.featureName === feature.name &&
          f.flags.ddbimporter.classId === klass.id
        );
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
  logger.debug(`Importing ${fiddledClassFeatures.length} features!`, classFeatures);
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

  logger.debug("Class build finished", klasses);

  const fiddledClasses = await srdFiddling(klasses, "classes");
  munchNote(`Importing ${fiddledClasses.length} classes!`, true);

  await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  // return fiddledClasses.concat(fiddledClassFeatures);
  return results;
}
