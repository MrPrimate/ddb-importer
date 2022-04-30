import logger from "../logger.js";
import { munchNote, getCompendium, getCompendiumLabel } from "./utils.js";
import { copySupportedItemFlags } from "./import.js";
import { getNPCImage } from "./importMonster.js";

let totalTargets = 0;
let count = 0;

async function updateActorsWithActor(targetActors, sourceActor) {
  let results = [];
  count++;

  for (let targetActor of targetActors) {
    munchNote(`Updating ${count}/${totalTargets} world monsters`);
    const monsterItems = sourceActor.items.toObject().map((item) => {
      delete item._id;
      return item;
    });
    const actorUpdate = duplicate(sourceActor);
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
    actorUpdate.folder = targetActor.folder;
    actorUpdate.sort = targetActor.sort;
    actorUpdate.ownership = targetActor.ownership;
    // eslint-disable-next-line no-await-in-loop
    await copySupportedItemFlags(targetActor, actorUpdate);

    // eslint-disable-next-line no-await-in-loop
    await targetActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });

    // eslint-disable-next-line no-await-in-loop
    await targetActor.update(actorUpdate);
    // console.warn("afterdelete", duplicate(targetActor));
    // eslint-disable-next-line no-await-in-loop
    await targetActor.createEmbeddedDocuments("Item", monsterItems);
    // console.warn("after create", duplicate(targetActor));

  };

  return Promise.all(results);
}

export async function updateWorldMonsters() {
  let results = [];
  // get ddb monsters compendium
  const monsterCompendiumLabel = getCompendiumLabel("monster");
  const monsterCompendium = await getCompendium(monsterCompendiumLabel);

  if (monsterCompendium) {
    const monsterIndices = ["name", "flags.ddbimporter.id"];
    const index = await monsterCompendium.getIndex({ fields: monsterIndices });
    totalTargets = game.actors.filter((a) => a.type === "npc" && a.flags.ddbimporter?.id).length;
    count = 0;
    munchNote(`Updating ${count}/${totalTargets} world monsters`);

    for (const [key, value] of index.entries()) {

      const worldMatch = game.actors.filter((actor) =>
        actor.flags?.ddbimporter?.id &&
        actor.name === value.name &&
        actor.flags.ddbimporter.id == value.flags?.ddbimporter?.id
      );

      if (worldMatch.length > 0) {
        munchNote(`Found ${value.name} world monsters`, true);
        logger.debug(`Matched ${value.name} (${key})`);
        // eslint-disable-next-line no-await-in-loop
        const monster = await monsterCompendium.getDocument(value._id);
        // eslint-disable-next-line no-await-in-loop
        let updatedActors = await updateActorsWithActor(worldMatch, monster, count);
        results.push(updatedActors);
      }
    }
    munchNote(`Finished updating ${totalTargets} world monsters`);
    munchNote("", true);

  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return results;
}

export async function resetCompendiumActorImages(compendiumName = null, type = "monster") {
  const monsterCompendiumLabel = compendiumName ? compendiumName : getCompendiumLabel(type);
  const monsterCompendium = await getCompendium(monsterCompendiumLabel);
  const fields = ["name", "token.img", "flags.monsterMunch", "data.details.type.value", "img"];
  const index = await monsterCompendium.getIndex({ fields });

  const updates = await Promise.all(index.map(async (i) => {
    const options = { forceUpdate: true, disableAutoTokenizeOverride: true, type };
    const update = await getNPCImage(i, options);
    logger.info(`Resetting ${i.name}`, update);
    return update;
  }));

  const results = await Actor.updateDocuments(updates, { pack: monsterCompendiumLabel });
  logger.debug("Reset results", results);
  return results;
}
