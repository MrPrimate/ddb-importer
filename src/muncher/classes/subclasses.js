import logger from "../../logger.js";
import { DDB_CONFIG } from "../../ddbConfig.js";

import { buildBaseClass, getClassFeature, buildClassFeatures, NO_TRAITS } from "./shared.js";
import { updateCompendium, srdFiddling, getImagePath } from "../import.js";
import { munchNote, getCompendiumType } from "../utils.js";

async function buildSubClassBase(klass, subClass) {
  delete klass['_id'];

  let avatarUrl;
  let largeAvatarUrl;
  let portraitAvatarUrl;

  if (subClass.portraitAvatarUrl) {
    portraitAvatarUrl = await getImagePath(subClass.portraitAvatarUrl, "class-portrait", subClass.fullName);
    // eslint-disable-next-line require-atomic-updates
    klass.img = portraitAvatarUrl;
    // eslint-disable-next-line require-atomic-updates
    klass.flags.ddbimporter['portraitAvatarUrl'] = subClass.portraitAvatarUrl;
  }

  if (subClass.avatarUrl) {
    avatarUrl = await getImagePath(subClass.avatarUrl, "class-avatar", subClass.fullName);
    // eslint-disable-next-line require-atomic-updates
    klass.flags.ddbimporter['avatarUrl'] = subClass.avatarUrl;
    if (!klass.img) {
      // eslint-disable-next-line require-atomic-updates
      klass.img = avatarUrl;
    }
  }

  if (subClass.largeAvatarUrl) {
    largeAvatarUrl = await getImagePath(subClass.largeAvatarUrl, "class-large", subClass.fullName);
    // eslint-disable-next-line require-atomic-updates
    klass.flags.ddbimporter['largeAvatarUrl'] = subClass.largeAvatarUrl;
    if (!klass.img) {
      // eslint-disable-next-line require-atomic-updates
      klass.img = largeAvatarUrl;
    }
  }

  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['parentClassId'] = subClass.parentClassId;
  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['spellCastingAbilityId'] = subClass.spellCastingAbilityId;
  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['canCastSpells'] = subClass.canCastSpells;
  // eslint-disable-next-line require-atomic-updates
  klass.flags.ddbimporter['moreDetailsUrl'] = subClass.moreDetailsUrl;

  if (avatarUrl || largeAvatarUrl) {
    const imageMatch = /$<img class="ddb-class-image"(.*)$/;
    const image = (avatarUrl)
      ? `<img class="ddb-class-image" src="${avatarUrl}">\n\n`
      : `<img class="ddb-class-image" src="${largeAvatarUrl}">\n\n`;
    klass.data.description.value.replace(imageMatch, image);
  }

  // eslint-disable-next-line require-atomic-updates
  klass.name += ` (${subClass.name})`;
  // eslint-disable-next-line require-atomic-updates
  klass.data.description.value += `<h3>${subClass.name}</h3>\n${subClass.description}\n\n`;

  // spell caster now?
  // if canCastSpells but now canCastSpells then set to third
  if (klass.data.spellcasting === "" && subClass.canCastSpells) {
    // eslint-disable-next-line require-atomic-updates
    klass.data.spellcasting = "third";
  }

  return klass;

}

async function buildSubClass(klass, subclass, compendiumSubClassFeatures) {
  let baseClass = await buildBaseClass(klass.flags.ddbimporter.data);
  let result = await buildSubClassBase(baseClass, subclass);
  result.data.description.value += await buildClassFeatures(subclass, compendiumSubClassFeatures);
  return result;
}

export async function getSubClasses(data) {
  logger.debug("get subclasses started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let subClasses = [];
  let classFeatures = [];
  let results = [];

  data.forEach((subClass) => {
    const classMatch = DDB_CONFIG.classConfigurations.find((k) => k.id === subClass.parentClassId);
    logger.debug(`${subClass.name} feature parsing started...`);
    subClass.classFeatures.forEach((feature) => {
      const existingFeature = classFeatures.some((f) => f.name === feature.name);
      logger.debug(`${feature.name} feature starting...`);
      if (!NO_TRAITS.includes(feature.name.trim()) && !existingFeature) {
        const parsedFeature = getClassFeature(feature, subClass, subClass.name);
        classFeatures.push(parsedFeature);
        results.push({ class: classMatch.name, subClass: subClass.name, feature: feature.name });
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

  await Promise.allSettled(firstPassFeatures.map(async (f) => {
    const feature = await compendium.getDocument(f._id);
    compendiumClassFeatures.push(feature.toJSON());
  }));

  // get base class
  const classCompendium = getCompendiumType("class");
  // const classIndex = await classCompendium.getIndex();
  const content = await classCompendium.getDocuments();

  await Promise.all(data.map(async (subClass) => {
    const classMatch = content.find((i) => i.data.flags.ddbimporter['id'] == subClass.parentClassId);
    const builtClass = await buildSubClass(classMatch.data, subClass, compendiumClassFeatures);
    subClasses.push(builtClass);
  }));

  const fiddledClasses = await srdFiddling(subClasses, "classes");
  munchNote(`Importing ${fiddledClasses.length} subclasses!`, true);

  await updateCompendium("classes", { classes: fiddledClasses }, updateBool);

  // return fiddledClasses.concat(fiddledClassFeatures);
  return results;
}
