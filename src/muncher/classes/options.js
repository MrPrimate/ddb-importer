import logger from "../../logger.js";

import { getClassFeature, NO_TRAITS } from "./shared.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";

export async function getClassOptions(data, className) {
  logger.debug("get options started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
  let results = [];

  let classFeatures = [];
  const classMatch = CONFIG.DDB.classConfigurations.find((k) => k.name === className);

  const klass = {
    name: className,
    id: classMatch.id,
  };

  for (const feature of data) {
    const existingFeature = classFeatures.some((f) => f.name === feature.name);
    logger.debug(`${feature.name} feature starting...`);
    if (!NO_TRAITS.includes(feature.name.trim()) && !existingFeature) {
      // eslint-disable-next-line no-await-in-loop
      const parsedFeature = await getClassFeature(feature, klass);
      foundry.utils.setProperty(parsedFeature, "flags.ddbimporter.optionalFeature", true);
      classFeatures.push(parsedFeature);
      results.push({ class: className, subClass: "", feature: feature.name });
    }
  }

  const options = {
    chrisPremades: true,
    deleteBeforeUpdate: false,
    removeSRDDuplicates: false,
    filterDuplicates: false,
    matchFlags: ["featureId"],
  };
  await DDBItemImporter.buildHandler("features", classFeatures, updateBool, options);

  return results;
}
