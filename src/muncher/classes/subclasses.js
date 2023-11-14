/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import { parseTags } from "../../lib/DDBTemplateStrings.js";
import { buildBaseClass, getClassFeature, NO_TRAITS, buildClassFeatures, generateFeatureAdvancements, getClassImages } from "./shared.js";
import DDBMuncher from "../../apps/DDBMuncher.js";
import utils from "../../lib/utils.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
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

  const featureHandler = new DDBItemImporter("features", [], { chrisPremades: true, deleteBeforeUpdate: false });
  await featureHandler.init();
  const fields = ["name", "flags.ddbimporter.classId", "flags.ddbimporter.class", "flags.ddbimporter.featureName", "flags.ddbimporter.subClass", "flags.ddbimporter.parentClassId"];
  await featureHandler.buildIndex({ fields: fields });

  const classHandler = new DDBItemImporter("class", [], { deleteBeforeUpdate: false });
  await classHandler.init();
  const classDocs = await classHandler.compendium.getDocuments();

  let subClasses = [];
  let classFeatures = [];
  let results = [];

  for (const subClass of data) {
    const classMatch = CONFIG.DDB.classConfigurations.find((k) => k.id === subClass.parentClassId);
    logger.debug(`${subClass.name} feature parsing started...`);
    const filteredFeatures = subClass.classFeatures
      .filter((feature) =>
        !featureHandler.compendiumIndex.some((i) =>
          hasProperty(i, "flags.ddbimporter.classId")
          && hasProperty(i, "flags.ddbimporter.featureName")
          && feature.name === i.flags.ddbimporter.featureName 
          && subClass.parentClassId === i.flags.ddbimporter.classId
        )
      );
    // const matchedFeatures = subClass.classFeatures
    //   .filter((feature) =>
    //     featureHandler.compendiumIndex.some((i) =>
    //       hasProperty(i, "flags.ddbimporter.classId")
    //       && hasProperty(i, "flags.ddbimporter.featureName")
    //       && feature.name === i.flags.ddbimporter.featureName 
    //       && subClass.parentClassId === i.flags.ddbimporter.classId
    //     )
    //   );
    // console.warn(`Features for ${subClass.name}:`, {
    //   subClass,
    //   filteredFeatures, matchedFeatures,
    //   index: featureHandler.compendiumIndex,
    //   parentClassId: subClass.parentClassId,
    // });
    for (const feature of filteredFeatures) {
      const existingFeature = classFeatures.some((f) => f.name === feature.name);
      logger.debug(`${feature.name} feature starting...`);
      if (!NO_TRAITS.includes(feature.name.trim()) && !existingFeature) {
        const parsedFeature = await getClassFeature(feature, subClass, subClass.name, classMatch.name);
        classFeatures.push(parsedFeature);
        results.push({ class: classMatch.name, subClass: subClass.name, feature: feature.name });
      }
    }
  }

  // eslint-disable-next-line require-atomic-updates
  featureHandler.documents = classFeatures;
  await featureHandler.srdFiddling();
  DDBMuncher.munchNote(`Importing ${featureHandler.documents.length} features!`, true);
  logger.debug(`Importing ${featureHandler.documents.length} features!`, featureHandler.documents);
  await featureHandler.updateCompendium(updateBool);
  await featureHandler.buildIndex({ fields });

  const firstPassFeatures = await featureHandler.compendiumIndex.filter((i) =>
    featureHandler.documents.some((orig) => i.name === orig.name)
  );
  let compendiumClassFeatures = [];

  for (const f of firstPassFeatures) {
    const feature = await featureHandler.compendium.getDocument(f._id);
    compendiumClassFeatures.push(feature.toJSON());
  }

  logger.debug("Features fetched for classes", compendiumClassFeatures);

  for (const subClass of data) {
    const classMatch = classDocs.find((i) => i.flags.ddbimporter['id'] == subClass.parentClassId);
    const builtClass = await buildSubClass(classMatch, subClass, compendiumClassFeatures);
    subClasses.push(builtClass);
  }

  logger.debug("Subclass build finished", subClasses);
  await DDBItemImporter.buildHandler("subclasses", subClasses, updateBool, { deleteBeforeUpdate: false });

  return results;
}
