/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import { parseTags } from "../../lib/DDBReferenceLinker.js";
import { buildBaseClass, getClassFeature, NO_TRAITS, buildClassFeatures, generateFeatureAdvancements, getClassImages } from "./shared.js";
import DDBMuncher from "../../apps/DDBMuncher.js";
import utils from "../../lib/utils.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
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

  const image = foundry.utils.getProperty(klass, "flags.ddbimporter.image");
  if (image && image !== "") {
    const imageMatch = /$<img class="ddb-class-image"(.*)$/;
    klass.system.description.value.replace(imageMatch, image);
  }

  klass.system.classIdentifier = utils.referenceNameString(klass.name).toLowerCase();
  klass.system.identifier = utils.referenceNameString(subClass.name).toLowerCase();
  klass.type = "subclass";
  klass.name = subClass.name;

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

export async function getSubClasses(subClassData, klassData) {
  if (!klassData || !subClassData) {
    return [];
  }
  logger.debug("get subclasses started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  const classHandler = new DDBItemImporter("class", [], { deleteBeforeUpdate: false });
  await classHandler.init();
  const classDocs = await classHandler.compendium.getDocuments();

  let subClasses = [];
  let classFeatures = [];
  let results = [];

  const featureCompendiumFolders = new DDBCompendiumFolders("features");
  DDBMuncher.munchNote(`Checking compendium folders..`, true);
  await featureCompendiumFolders.loadCompendium("features");
  const subClassCompendiumFolders = new DDBCompendiumFolders("subclasses");
  await subClassCompendiumFolders.loadCompendium("subclasses");
  DDBMuncher.munchNote("", true);


  for (const subClass of subClassData) {
    const classMatch = CONFIG.DDB.classConfigurations.find((k) => k.id === subClass.parentClassId);
    await featureCompendiumFolders.createSubClassFeatureFolder(subClass.name, classMatch.name);
    logger.debug(`${subClass.name} feature parsing started...`, { subClass, classMatch });
    const filteredFeatures = subClass.classFeatures
      .filter((feature) =>
        !klassData.classFeatures.some((f) =>
          feature.id === f.id
        )
      );
    for (const feature of filteredFeatures) {
      const existingFeature = classFeatures.some((f) =>
        f.name === feature.name
        && f.flags.ddbimporter.classId === subClass.id
      );
      logger.debug(`${feature.name} subclass feature starting...`, { existingFeature, feature });
      if (!NO_TRAITS.includes(feature.name.trim()) && !existingFeature) {
        const parsedFeature = await getClassFeature(feature, subClass, subClass.name, classMatch.name);
        classFeatures.push(parsedFeature);
        results.push({ class: classMatch.name, subClass: subClass.name, feature: feature.name });
      }
    }
  }

  const featureHandlerOptions = {
    chrisPremades: true,
    removeSRDDuplicates: false,
    filterDuplicates: false,
    deleteBeforeUpdate: false,
    matchFlags: ["featureId"],
    useCompendiumFolders: true,
    indexFilter: {
      fields: [
        "name",
        "flags.ddbimporter.classId",
        "flags.ddbimporter.class",
        "flags.ddbimporter.featureName",
        "flags.ddbimporter.subClass",
        "flags.ddbimporter.parentClassId"
      ],
    },
  };

  logger.debug(`Creating ${klassData.name} subclass features`, {
    classFeatures,
    featureHandlerOptions,
    updateBool
  });
  const featureHandler = await DDBItemImporter.buildHandler("features", classFeatures, updateBool, featureHandlerOptions);
  await featureHandler.buildIndex(featureHandlerOptions.indexFilter);

  const firstPassFeatures = await featureHandler.compendiumIndex.filter((i) =>
    featureHandler.documents.some((orig) => i.name === orig.name)
  );
  let compendiumClassFeatures = [];

  for (const f of firstPassFeatures) {
    const feature = await featureHandler.compendium.getDocument(f._id);
    compendiumClassFeatures.push(feature.toJSON());
  }

  logger.debug("Features fetched for classes", compendiumClassFeatures);

  for (const subClass of subClassData) {
    const classMatch = classDocs.find((i) => foundry.utils.getProperty(i, "flags.ddbimporter.id") == subClass.parentClassId);
    const builtClass = await buildSubClass(classMatch, subClass, compendiumClassFeatures);
    subClasses.push(builtClass);
  }

  logger.debug("Subclass build finished", subClasses);
  const subClassOptions = { deleteBeforeUpdate: false, matchFlags: ["id"], useCompendiumFolders: true };
  await DDBItemImporter.buildHandler("subclasses", subClasses, updateBool, subClassOptions);

  return results;
}
