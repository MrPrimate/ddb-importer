/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import { buildBaseClass, getClassFeature, NO_TRAITS, buildClassFeatures, generateFeatureAdvancements } from "./shared.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import ClassAdvancementHelper from "../../parser/advancements/AdvancementHelper.js";

async function buildClass(klass, compendiumClassFeatures) {
  let result = await buildBaseClass(klass);
  result.system.description.value += await buildClassFeatures(klass, compendiumClassFeatures);
  result.system.description.value = parseTags(result.system.description.value);
  result.system.advancement.push(ClassAdvancementHelper.getHPAdvancement(), ...(await generateFeatureAdvancements(klass, compendiumClassFeatures)));
  result.system.advancement = await ClassAdvancementHelper.addSRDAdvancements(result.system.advancement, result);
  return result;
}

export async function getClasses(data) {
  let results = [];
  logger.debug("get clases started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let klasses = [];
  let classFeatures = [];

  for (const klass of data) {
    logger.debug(`${klass.name} feature parsing started...`);
    for (const feature of klass.classFeatures.sort((a, b) => a.requiredLevel - b.requiredLevel)) {
      const existingFeature = classFeatures.some((f) =>
        f.flags.ddbimporter.featureName === feature.name
        && f.flags.ddbimporter.classId === klass.id
      );
      logger.debug(`${feature.name} feature starting...`);
      if (!NO_TRAITS.includes(feature.name) && !existingFeature) {
        // eslint-disable-next-line no-await-in-loop
        const parsedFeature = await getClassFeature(feature, klass);
        classFeatures.push(parsedFeature);
        results.push({ class: klass.name, subClass: "", feature: feature.name });
      }
    }
  }

  const featureHandler = await DDBItemImporter.buildHandler("features", classFeatures, updateBool, { chrisPremades: true, deleteBeforeUpdate: false });
  const firstPassFeatures = await featureHandler.compendiumIndex.filter((i) =>
    featureHandler.documents.some((orig) => i.name === orig.name)
  );
  let compendiumClassFeatures = [];

  for (const f of firstPassFeatures) {
    const feature = await featureHandler.compendium.getDocument(f._id);
    compendiumClassFeatures.push(feature.toJSON());
  }

  for (const klass of data) {
    logger.debug(`${klass.name} class parsing started...`);
    const builtClass = await buildClass(klass, compendiumClassFeatures);
    klasses.push(builtClass);
  }

  logger.debug("Class build finished", klasses);
  await DDBItemImporter.buildHandler("classes", klasses, updateBool);

  // return fiddledClasses.concat(fiddledClassFeatures);
  return results;
}
