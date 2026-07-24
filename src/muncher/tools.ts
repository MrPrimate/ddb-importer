import {
  logger,
  CompendiumHelper,
  FileHelper,
  DDBItemImporter,
  utils,
} from "../lib/_module";
import DDBMonsterFactory from "../parser/DDBMonsterFactory";
import DDBVehicleFactory from "../parser/DDBVehicleFactory";
import DDBMonsterImporter from "./DDBMonsterImporter";

let totalTargets = 0;
let count = 0;

async function updateActorsWithActor(targetActors: TImporterActor[], sourceActor: Actor.Implementation) {
  const results: any[] = [];
  count++;

  for (const targetActor of targetActors) {
    if (!targetActor.id) {
      logger.warn("Skipping world monster update for actor without an id", targetActor);
      continue;
    }
    utils.munchNote(`Updating ${count}/${totalTargets} world monsters`);
    logger.debug(`Updating ${count}/${totalTargets} world monsters`, targetActor);
    const monsterItems = (sourceActor.items.toObject() as unknown as I5eMonsterItem[]).map((item) => {
      delete item._id;
      return item;
    });
    const actorUpdate = foundry.utils.duplicate(sourceActor) as unknown as I5eMonsterData;
    // pop items in later
    delete (actorUpdate as { items?: I5eMonsterItem[] }).items;

    const updateImages = utils.getSetting<boolean>("munching-policy-update-world-monster-update-images");
    if (!updateImages) {
      actorUpdate.img = targetActor.img ?? undefined;
      const updateToken = actorUpdate.prototypeToken;
      if (updateToken) {
        updateToken.texture = targetActor.prototypeToken.texture as unknown as I5eTokenTexture;
        updateToken.randomImg = targetActor.prototypeToken.randomImg;
        updateToken.lockRotation = targetActor.prototypeToken.lockRotation;
        updateToken.rotation = targetActor.prototypeToken.rotation;
        updateToken.alpha = targetActor.prototypeToken.alpha;
        updateToken.ring = targetActor.prototypeToken.ring as unknown as I5eTokenRing;
      }
    }

    const retainBiography = utils.getSetting<boolean>("munching-policy-update-world-monster-retain-biography");
    if (retainBiography && actorUpdate.system.details) {
      actorUpdate.system.details.biography = foundry.utils.getProperty(targetActor, "system.details.biography") as I5eBiography;
    }

    actorUpdate._id = targetActor.id;
    if (targetActor.folder) actorUpdate.folder = targetActor.folder._id;
    actorUpdate.sort = targetActor.sort;
    actorUpdate.ownership = targetActor.ownership as unknown as IFoundryOwnership;
    DDBItemImporter.copySupportedItemFlags(targetActor, actorUpdate);
    await targetActor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
    await targetActor.update(actorUpdate as any);
    // console.warn("afterdelete", foundry.utils.duplicate(targetActor));
    await targetActor.createEmbeddedDocuments("Item", monsterItems as any[]);
    // console.warn("after create", foundry.utils.duplicate(targetActor));

  };

  return Promise.all(results);
}

export async function updateWorldMonsters() {
  const results = [];
  // get ddb monsters compendium
  const monsterCompendiumLabel = CompendiumHelper.getCompendiumLabel("monster");
  const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);

  if (monsterCompendium) {
    const monsterIndices = ["name", "flags.ddbimporter.id"];
    const index = await monsterCompendium.getIndex({ fields: monsterIndices });
    totalTargets = game.actors.filter((a) => a.type === "npc" && foundry.utils.hasProperty(a, "flags.ddbimporter.id")).length;
    count = 0;
    utils.munchNote(`Updating ${count}/${totalTargets} world monsters`);
    logger.debug(`Checking ${totalTargets} world monsters`);

    for (const [key, value] of index.entries()) {

      // fvtt-types Actor.Implementation union does not structurally satisfy the
      // importer flag view, but these are the same runtime documents
      const worldMatches = game.actors.filter((actor) =>
        !!foundry.utils.getProperty(actor, "flags.ddbimporter.id")
        && actor.name === value.name
        && foundry.utils.getProperty(actor, "flags.ddbimporter.id") == foundry.utils.getProperty(value, "flags.ddbimporter.id"),
      ) as unknown as TImporterActor[];

      if (worldMatches.length > 0) {
        utils.munchNote(`Found ${value.name} world monster`, { nameField: true });
        logger.debug(`Matched ${value.name} (${key})`);
        const monster = await monsterCompendium.getDocument(value._id) as Actor.Implementation;
        const updatedActors = await updateActorsWithActor(worldMatches, monster);
        results.push(updatedActors);
      }
    }
    utils.munchNote(`Finished updating ${totalTargets} world monsters`);
    utils.munchNote("", { nameField: true });

  } else {
    logger.error("Error opening compendium, check your settings");
  }
  return results;
}

export async function resetCompendiumActorImages(compendiumName: string | null = null, type: TMonsterImporterTypes = "monsters") {
  const monsterCompendiumLabel = compendiumName ? compendiumName : CompendiumHelper.getCompendiumLabel(type);
  const monsterCompendium = CompendiumHelper.getCompendium(monsterCompendiumLabel);
  if (!monsterCompendium) {
    logger.error("Error opening compendium, check your settings", monsterCompendiumLabel);
    return [];
  }
  const fields = ["name", "flags.monsterMunch", "system.details.type.value", "img", "prototypeToken.texture.src"];
  const index = await monsterCompendium.getIndex({ fields });

  const otherDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");
  await FileHelper.generateCurrentFiles(otherDirectory);

  const updates = await Promise.all(index
    .filter((i) => i.name !== "#[CF_tempEntity]")
    .map(async (i) => {
      const options = { forceUpdate: true, disableAutoTokenizeOverride: true };
      const monsterImporter = new DDBMonsterImporter({
        monster: i as unknown as I5eMonsterData,
        type,
      });
      const update = await monsterImporter.getNPCImage(options);
      logger.info(`Resetting ${i.name}`, update);
      return update;
    }));

  const results = await Actor.updateDocuments(updates as unknown as Actor.UpdateInput[], { pack: monsterCompendiumLabel });
  logger.debug("Reset results", results);
  return results;
}

export async function parseCritters(ids: number[] | null = null) {
  const monsterFactory = new DDBMonsterFactory();
  const parsedExtras = await monsterFactory.processIntoCompendium(ids ?? undefined);
  return parsedExtras;
}

export async function parseTransports(ids: number[] | null = null) {
  const vehicleFactory = new DDBVehicleFactory();
  const parsedVehicles = await vehicleFactory.processIntoCompendium(ids ?? undefined);
  return parsedVehicles;
}
