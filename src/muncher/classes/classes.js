/* eslint-disable no-await-in-loop */
import logger from "../../logger.js";
import { buildBaseClass, getClassFeature, NO_TRAITS, buildClassFeatures, generateFeatureAdvancements } from "./shared.js";
import { parseTags } from "../../lib/DDBReferenceLinker.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import DDBMuncher from "../../apps/DDBMuncher.js";
import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";

function getHPAdvancement(klass, character) {
  // const value = "value": {
  //   "1": "max",
  //   "2": "avg"
  // },
  const value = {};
  if (klass) {
    const rolledHP = foundry.utils.getProperty(character, "flags.ddbimporter.rolledHP") ?? false;
    const startingClass = foundry.utils.getProperty(klass, "flags.ddbimporter.isStartingClass") === true;
    const useMaxHP = game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp");
    if (rolledHP && !useMaxHP) {
      const baseHP = foundry.utils.getProperty(character, "flags.ddbimporter.baseHitPoints");
      const totalLevels = foundry.utils.getProperty(character, "flags.ddbimporter.dndbeyond.totalLevels");
      const hpPerLevel = Math.floor(baseHP / totalLevels);
      const leftOvers = Math.floor(baseHP % totalLevels);

      for (let i = 1; i <= klass.system.levels; i++) {
        value[`${i}`] = i === 1 && startingClass ? (hpPerLevel + leftOvers) : hpPerLevel;
      }
    } else {
      for (let i = 1; i <= klass.system.levels; i++) {
        value[`${i}`] = i === 1 && startingClass ? "max" : "avg";
      }
    };
  }
  return {
    _id: foundry.utils.randomID(),
    type: "HitPoints",
    configuration: {},
    value,
    title: "",
    icon: "",
    classRestriction: "",
  };
}

async function addSRDAdvancements(advancements, klass) {
  const rulesCompendium = "dnd5e.classes";
  const srdCompendium = CompendiumHelper.getCompendium(rulesCompendium);
  await srdCompendium.getIndex();
  const klassMatch = srdCompendium.index.find((k) => k.name === klass.name);
  if (klassMatch) {
    const srdKlass = await srdCompendium.getDocument(klassMatch._id);
    const scaleAdvancements = srdKlass.system.advancement.filter((srdA) =>
      srdA.type === "ScaleValue"
      && !advancements.some((ddbA) => ddbA.configuration.identifier === srdA.configuration.identifier)
    ).map((advancement) => {
      return advancement.toObject();
    });
    advancements.push(...scaleAdvancements);
  }

  return advancements;
}

async function buildClass(klass, compendiumClassFeatures) {
  let result = await buildBaseClass(klass);
  result.system.description.value += await buildClassFeatures(klass, compendiumClassFeatures);
  result.system.description.value = parseTags(result.system.description.value);
  result.system.advancement.push(getHPAdvancement(), ...(await generateFeatureAdvancements(klass, compendiumClassFeatures)));
  result.system.advancement = await addSRDAdvancements(result.system.advancement, result);
  return result;
}

export async function getClasses(data) {
  let results = [];
  logger.debug("get clases started", { data });
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let klasses = [];
  let classFeatures = [];

  const compendiumFolders = new DDBCompendiumFolders("features");
  DDBMuncher.munchNote(`Checking compendium folders..`, true);
  await compendiumFolders.loadCompendium("features");
  DDBMuncher.munchNote("", true);

  for (const klass of data) {
    logger.debug(`${klass.name} feature parsing started...`, { klass });
    for (const feature of klass.classFeatures.sort((a, b) => a.requiredLevel - b.requiredLevel)) {
      const existingFeature = classFeatures.some((f) =>
        f.flags.ddbimporter.featureName === feature.name
        && f.flags.ddbimporter.classId === klass.id
      );
      logger.debug(`${feature.name} class feature starting...`, { existingFeature, feature });
      if (!NO_TRAITS.includes(feature.name) && !existingFeature) {
        const parsedFeature = await getClassFeature(feature, klass);
        classFeatures.push(parsedFeature);
        results.push({ class: klass.name, subClass: "", feature: feature.name });
      }
    }
  }

  const featureHandlerOptions = {
    chrisPremades: true,
    deleteBeforeUpdate: false,
    removeSRDDuplicates: false,
    filterDuplicates: false,
    matchFlags: ["featureId"],
    useCompendiumFolders: true,
  };

  logger.debug(`Creating class features`, {
    classFeatures,
    featureHandlerOptions,
    updateBool
  });
  const featureHandler = await DDBItemImporter.buildHandler("features", classFeatures, updateBool, featureHandlerOptions);
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
  await DDBItemImporter.buildHandler("classes", klasses, updateBool, { useCompendiumFolders: true });

  return results;
}
