import logger from "../logger.js";
import { munchNote, getCompendium, getCompendiumLabel } from "./utils.js";
import { copySupportedItemFlags } from "./import.js";

async function updateActorsWithActor(targetActors, sourceActor) {
  let results = [];

  targetActors.forEach(async (targetActor) => {
    const monsterItems = sourceActor.data.items.toObject().map((item) => {
      delete item._id;
      return item;
    });
    const actorUpdate = duplicate(sourceActor);

    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-world-monster-update-images");
    if (!updateImages && targetActor.data.img !== "icons/svg/mystery-man.svg") {
      actorUpdate.img = targetActor.data.img;
    }
    if (!updateImages && targetActor.data.token.img !== "icons/svg/mystery-man.svg") {
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

    actorUpdate._id = targetActor._id;
    await copySupportedItemFlags(targetActor.data, actorUpdate);

    await targetActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
    delete actorUpdate.items;
    let worldNPC = await targetActor.update(actorUpdate);
    await targetActor.createEmbeddedDocuments("Item", monsterItems);
    results.push(worldNPC);

  });

  return Promise.all(results);
}

export async function updateWorldMonsters() {
  let results = [];
  // get ddb monsters compendium
  const monsterCompendiumLabel = getCompendiumLabel("monster");
  const monsterCompendium = await getCompendium(monsterCompendiumLabel);

  console.warn(monsterCompendium);

  if (monsterCompendium) {
    const monsterIndices = ["name", "flags.ddbimporter.id"];
    const index = await monsterCompendium.getIndex({ fields: monsterIndices });

    console.warn(index);

    for (const [key, value] of Object.entries(index)) {
      console.log(`Checking ${key}: ${value.name}`);

      const worldMatch = game.actors.filter((actor) =>
        actor.flags?.ddbimporter?.id &&
        actor.name === value.name &&
        actor.data.flags.ddbimporter.id == value.flags?.ddbimporter?.id
      );

      if (worldMatch.length > 1) {
        // eslint-disable-next-line no-await-in-loop
        const monster = await monsterCompendium.getDocument(value._id);
        const compendiumCopy = duplicate(monster);
        // eslint-disable-next-line no-await-in-loop
        results.push(await updateActorsWithActor(worldMatch, compendiumCopy));
      }
    }

  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return results;
}
