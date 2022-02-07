import logger from "../logger.js";
import { munchNote, getCompendium, getCompendiumLabel } from "./utils.js";
import { copySupportedItemFlags } from "./import.js";

let totalTargets = 0;
let count = 0;

async function updateActorsWithActor(targetActors, sourceActor) {
  let results = [];
  count++;

  for (let targetActor of targetActors) {
    munchNote(`Updating ${count}/${totalTargets} world monsters`);
    const monsterItems = sourceActor.data.items.toObject().map((item) => {
      delete item._id;
      return item;
    });
    const actorUpdate = duplicate(sourceActor);
    // pop items in later
    delete actorUpdate.items;

    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-world-monster-update-images");
    if (!updateImages) {
      actorUpdate.img = targetActor.data.img;
      actorUpdate.token.img = targetActor.data.token.img;
      actorUpdate.token.scale = targetActor.data.token.scale;
      actorUpdate.token.randomImg = targetActor.data.token.randomImg;
      actorUpdate.token.mirrorX = targetActor.data.token.mirrorX;
      actorUpdate.token.mirrorY = targetActor.data.token.mirrorY;
      actorUpdate.token.lockRotation = targetActor.data.token.lockRotation;
      actorUpdate.token.rotation = targetActor.data.token.rotation;
      actorUpdate.token.alpha = targetActor.data.token.alpha;
      actorUpdate.token.lightAlpha = targetActor.data.token.lightAlpha;
      actorUpdate.token.lightAnimation = targetActor.data.token.lightAnimation;
      actorUpdate.token.tint = targetActor.data.token.tint;
      actorUpdate.token.lightColor = targetActor.data.token.lightColor;
    }

    const retainBiography = game.settings.get("ddb-importer", "munching-policy-update-world-monster-retain-biography");
    if (retainBiography) {
      actorUpdate.data.details.biography = targetActor.data.data.details.biography;
    }

    actorUpdate._id = targetActor.data._id;
    actorUpdate.folder = targetActor.data.folder;
    actorUpdate.sort = targetActor.data.sort;
    actorUpdate.permission = targetActor.data.permission;
    // eslint-disable-next-line no-await-in-loop
    await copySupportedItemFlags(targetActor.data, actorUpdate);

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
    totalTargets = game.actors.filter((a) => a.type === "npc" && a.data.flags.ddbimporter?.id).length;
    count = 0;
    munchNote(`Updating ${count}/${totalTargets} world monsters`);

    for (const [key, value] of index.entries()) {

      const worldMatch = game.actors.filter((actor) =>
        actor.data.flags?.ddbimporter?.id &&
        actor.name === value.name &&
        actor.data.flags.ddbimporter.id == value.flags?.ddbimporter?.id
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
