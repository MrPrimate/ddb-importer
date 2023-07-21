import logger from "../../logger.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import { buildBaseClass, getClassFeature, NO_TRAITS, buildClassFeatures, generateFeatureAdvancements, getClassImages } from "./shared.js";
import { updateCompendium, srdFiddling } from "../import.js";
import DDBMuncher from "../../apps/DDBMuncher.js";
import utils from "../../lib/utils.js";
// import { buildClassFeatures } from "../../parser/classes/index.js";

async function buildSubClassBase(klass, subClass) {
  delete klass['_id'];
  await getClassImages(subClass, klass);

  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['parentClassId'] = subClass.parentClassId;
  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['spellCastingAbilityId'] = subClass.spellCastingAbilityId;
  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['canCastSpells'] = subClass.canCastSpells;
  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['moreDetailsUrl'] = subClass.moreDetailsUrl;

  const image = getProperty(klass, "flags.ddbimporter.image");
  if (image && image !== "") {
    const imageMatch = /$<img class="ddb-class-image"(.*)$/;
    klass.system.description.value.replace(imageMatch, image);
  }

  klass.system.classIdentifier = utils.referenceNameString(klass.name).toLowerCase();
  klass.system.identifier = utils.referenceNameString(subClass.name).toLowerCase();
  klass.type = "subclass";
  klass.name = `${subClass.name} (${klass.name})`;

  // eslint-disable-next-line require-atomic-updates
  klass.system.description.value += `<h3>${subClass.name}</h3>\n${subClass.description}\n\n`;

  // spell caster now?
  // if canCastSpells but now canCastSpells then set to third
  if (klass.system.spellcasting === "" && subClass.canCastSpells) {
    // eslint-disable-next-line require-atomic-updates
    klass.system.spellcasting = "third";
  }

  return klass;

}

async function buildSubClass(klass, subclass, compendiumSubClassFeatures) {
  let baseClass = await buildBaseClass(klass.flags.ddbimporter.data);
  let result = await buildSubClassBase(baseClass, subclass);
  const ignoreIds = klass.flags.ddbimporter.data.classFeatures.map((f) => f.id);
  result.system.description.value += await buildClassFeatures(subclass, compendiumSubClassFeatures, ignoreIds);
  result.system.description.value = parseTags(result.system.description.value);
  result.system.advancement.push(...(await generateFeatureAdvancements(subclass, compendiumSubClassFeatures, ignoreIds)));
  return result;
}

export async function getSubClasses(data) {
  logger.debug("get subclasses started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  const classCompendium = CompendiumHelper.getCompendiumType("class");
  const featureCompendium = CompendiumHelper.getCompendiumType("features");
  const content = await classCompendium.getDocuments();
  const fields = ["name", "flags.ddbimporter.classId", "flags.ddbimporter.class", "flags.ddbimporter.featureName", "flags.ddbimporter.subClass", "flags.ddbimporter.parentClassId"];
  const classFeatureIndex = await featureCompendium.getIndex({ fields });

  let subClasses = [];
  let classFeatures = [];
  let results = [];

  for (const subClass of data) {
    const classMatch = CONFIG.DDB.classConfigurations.find((k) => k.id === subClass.parentClassId);
    logger.debug(`${subClass.name} feature parsing started...`);
    const filteredFeatures = subClass.classFeatures
      .filter((feature) =>
        !classFeatureIndex.some((i) => hasProperty(i, "flags.ddbimporter.classId")
        && hasProperty(i, "flags.ddbimporter.featureName")
        && feature.name === i.flags.ddbimporter.featureName
        && subClass.parentClassId === i.flags.ddbimporter.classId)
      );
    for (const feature of filteredFeatures) {
      const existingFeature = classFeatures.some((f) => f.name === feature.name);
      logger.debug(`${feature.name} feature starting...`);
      if (!NO_TRAITS.includes(feature.name.trim()) && !existingFeature) {
        // eslint-disable-next-line no-await-in-loop
        const parsedFeature = await getClassFeature(feature, subClass, subClass.name, classMatch.name);
        classFeatures.push(parsedFeature);
        results.push({ class: classMatch.name, subClass: subClass.name, feature: feature.name });
      }
    }
  }

  const fiddledClassFeatures = await srdFiddling(classFeatures, "features");
  DDBMuncher.munchNote(`Importing ${fiddledClassFeatures.length} features!`, true);
  logger.debug(`Importing ${fiddledClassFeatures.length} features!`, classFeatures);
  await updateCompendium("features", { features: fiddledClassFeatures }, updateBool);

  const importedIndex = await featureCompendium.getIndex({ fields });
  const firstPassFeatures = await importedIndex.filter((i) => fiddledClassFeatures.some((orig) => i.name === orig.name));
  let compendiumClassFeatures = [];

  await Promise.allSettled(firstPassFeatures.map(async (f) => {
    const feature = await featureCompendium.getDocument(f._id);
    compendiumClassFeatures.push(feature.toJSON());
  }));

  logger.debug("Features fetched", compendiumClassFeatures);

  await Promise.all(data.map(async (subClass) => {
    const classMatch = content.find((i) => i.flags.ddbimporter['id'] == subClass.parentClassId);
    const builtClass = await buildSubClass(classMatch, subClass, compendiumClassFeatures);
    subClasses.push(builtClass);
  }));

  logger.debug("Subclass build finished", subClasses);

  const fiddledClasses = await srdFiddling(subClasses, "subclasses");
  DDBMuncher.munchNote(`Importing ${fiddledClasses.length} subclasses!`, true);

  await updateCompendium("subclasses", { subclasses: fiddledClasses }, updateBool);

  // return fiddledClasses.concat(fiddledClassFeatures);
  return results;
}
