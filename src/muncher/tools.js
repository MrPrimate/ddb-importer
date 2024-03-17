import logger from "../logger.js";
import FileHelper from "../lib/FileHelper.js";
import CompendiumHelper from "../lib/CompendiumHelper.js";
import DDBMuncher from "../apps/DDBMuncher.js";
import { getNPCImage } from "./importMonster.js";
import DDBMonsterFactory from "../parser/DDBMonsterFactory.js";
import DDBItemImporter from "../lib/DDBItemImporter.js";

let totalTargets = 0;
let count = 0;

async function updateActorsWithActor(targetActors, sourceActor) {
  let results = [];
  count++;

  for (let targetActor of targetActors) {
    DDBMuncher.munchNote(`Updating ${count}/${totalTargets} world monsters`);
    logger.debug(`Updating ${count}/${totalTargets} world monsters`, targetActor);
    const monsterItems = sourceActor.items.toObject().map((item) => {
      delete item._id;
      return item;
    });
    const actorUpdate = foundry.utils.duplicate(sourceActor);
    // pop items in later
    delete actorUpdate.items;


    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-world-monster-update-images");
    if (!updateImages) {
      actorUpdate.img = targetActor.img;
      actorUpdate.prototypeToken.texture.src = targetActor.prototypeToken.texture.src;
      actorUpdate.prototypeToken.scale = targetActor.prototypeToken.scale;
      actorUpdate.prototypeToken.randomImg = targetActor.prototypeToken.randomImg;
      actorUpdate.prototypeToken.mirrorX = targetActor.prototypeToken.mirrorX;
      actorUpdate.prototypeToken.mirrorY = targetActor.prototypeToken.mirrorY;
      actorUpdate.prototypeToken.lockRotation = targetActor.prototypeToken.lockRotation;
      actorUpdate.prototypeToken.rotation = targetActor.prototypeToken.rotation;
      actorUpdate.prototypeToken.alpha = targetActor.prototypeToken.alpha;
      actorUpdate.prototypeToken.lightAlpha = targetActor.prototypeToken.lightAlpha;
      actorUpdate.prototypeToken.lightAnimation = targetActor.prototypeToken.lightAnimation;
      actorUpdate.prototypeToken.tint = targetActor.prototypeToken.tint;
      actorUpdate.prototypeToken.lightColor = targetActor.prototypeToken.lightColor;
    }

    const retainBiography = game.settings.get("ddb-importer", "munching-policy-update-world-monster-retain-biography");
    if (retainBiography) {
      actorUpdate.system.details.biography = targetActor.system.details.biography;
    }

    actorUpdate._id = targetActor.id;
    if (targetActor.folder) actorUpdate.folder = targetActor.folder._id;
    actorUpdate.sort = targetActor.sort;
    actorUpdate.ownership = targetActor.ownership;
    // eslint-disable-next-line no-await-in-loop
    DDBItemImporter.copySupportedItemFlags(targetActor, actorUpdate);

    // eslint-disable-next-line no-await-in-loop
    await targetActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });

    // eslint-disable-next-line no-await-in-loop
    await targetActor.update(actorUpdate);
    // console.warn("afterdelete", foundry.utils.duplicate(targetActor));
    // eslint-disable-next-line no-await-in-loop
    await targetActor.createEmbeddedDocuments("Item", monsterItems);
    // console.warn("after create", foundry.utils.duplicate(targetActor));

  };

  return Promise.all(results);
}

export async function updateWorldMonsters() {
  let results = [];
  // get ddb monsters compendium
  const monsterCompendiumLabel = CompendiumHelper.getCompendiumLabel("monster");
  const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);

  if (monsterCompendium) {
    const monsterIndices = ["name", "flags.ddbimporter.id"];
    const index = await monsterCompendium.getIndex({ fields: monsterIndices });
    totalTargets = game.actors.filter((a) => a.type === "npc" && foundry.utils.hasProperty(a, "flags.ddbimporter.id")).length;
    count = 0;
    DDBMuncher.munchNote(`Updating ${count}/${totalTargets} world monsters`);
    logger.debug(`Checking ${totalTargets} world monsters`);

    for (const [key, value] of index.entries()) {

      const worldMatches = game.actors.filter((actor) =>
        actor.flags?.ddbimporter?.id
        && actor.name === value.name
        && actor.flags.ddbimporter.id == value.flags?.ddbimporter?.id
      );

      if (worldMatches.length > 0) {
        DDBMuncher.munchNote(`Found ${value.name} world monster`, true);
        logger.debug(`Matched ${value.name} (${key})`);
        // eslint-disable-next-line no-await-in-loop
        const monster = await monsterCompendium.getDocument(value._id);
        // eslint-disable-next-line no-await-in-loop
        let updatedActors = await updateActorsWithActor(worldMatches, monster, count);
        results.push(updatedActors);
      }
    }
    DDBMuncher.munchNote(`Finished updating ${totalTargets} world monsters`);
    DDBMuncher.munchNote("", true);

  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return results;
}

export async function resetCompendiumActorImages(compendiumName = null, type = "monster") {
  const monsterCompendiumLabel = compendiumName ? compendiumName : CompendiumHelper.getCompendiumLabel(type);
  const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);
  const fields = ["name", "flags.monsterMunch", "system.details.type.value", "img", "prototypeToken.texture.src"];
  const index = await monsterCompendium.getIndex({ fields });

  const otherDirectory = game.settings.get("ddb-importer", "other-image-upload-directory").replace(/^\/|\/$/g, "");
  await FileHelper.generateCurrentFiles(otherDirectory);

  const updates = await Promise.all(index
    .filter((i) => i.name !== "#[CF_tempEntity]")
    .map(async (i) => {
      const options = { forceUpdate: true, disableAutoTokenizeOverride: true, type };
      const update = await getNPCImage(foundry.utils.duplicate(i), options);
      logger.info(`Resetting ${i.name}`, update);
      return update;
    }));

  const results = await Actor.updateDocuments(updates, { pack: monsterCompendiumLabel });
  logger.debug("Reset results", results);
  return results;
}

export async function parseCritters(ids = null) {
  const monsterFactory = new DDBMonsterFactory();
  const parsedExtras = await monsterFactory.processIntoCompendium(ids);
  return parsedExtras;
}
