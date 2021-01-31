import logger from "../logger.js";
import utils from "../utils.js";
import { parseMonsters } from "../muncher/monster/monster.js";
import { copySupportedItemFlags, srdFiddling } from "../muncher/import.js";
import { buildNPC, generateIconMap, copyExistingMonsterImages } from "../muncher/importMonster.js";

const MUNCH_DEFAULTS = [
  { name: "munching-policy-update-existing", needed: true, },
  { name: "munching-policy-use-srd", needed: false, },
  { name: "munching-policy-use-inbuilt-icons", needed: true, },
  { name: "munching-policy-use-srd-icons", needed: false, },
  { name: "munching-policy-use-iconizer", needed: false, },
  { name: "munching-policy-download-images", needed: true, },
  { name: "munching-policy-remote-images", needed: false, },
  { name: "munching-policy-use-dae-effects", needed: false, },
  { name: "munching-policy-hide-description", needed: false, },
  { name: "munching-policy-monster-items", needed: false, },
  { name: "munching-policy-update-images", needed: false, },
  { name: "munching-policy-dae-copy", needed: false, },
];

export async function characterExtras(html, characterData, actor) {

  console.warn(characterData);
  console.warn(actor);

  let munchSettings = [];

  MUNCH_DEFAULTS.forEach((setting) => {
    console.warn(setting.name);
    setting["chosen"] = game.settings.get("ddb-importer", setting.name);
    munchSettings.push(setting);
  });

  munchSettings.forEach((setting) => {
    game.settings.set("ddb-importer", setting.name, setting.needed);
  });

  try {
    console.warn(characterData.ddb);
    console.warn(actor);
    if (characterData.ddb.creatures.length === 0) return;

    const folder = await utils.getOrCreateFolder(actor.folder, "Actor", `[Extras] ${actor.name}`);

    let creatures = characterData.ddb.creatures.map((creature) => {
      console.log(creature);
      let mock = creature.definition;
      console.log(mock);
      if (creature.name) mock.name = creature.name;

      // TODO:
      // get override characterValues for
      // size
      // hp max
      // creature type
      // ac
      // alignment
      // notes

      //proficiency based changes for things like steel defender

      // permissions the same as
      mock.permission = actor.data.permission;
      mock.folder = folder._id;
      return mock;
    });
    let parsedExtras = await parseMonsters(creatures);
    parsedExtras = parsedExtras.actors;
    console.warn(parsedExtras);
    // TODO: deal with hp adjustments here

    const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");
    const updateImages = game.settings.get("ddb-importer", "munching-policy-update-images");
    // const uploadDirectory = game.settings.get("ddb-importer", "image-upload-directory").replace(/^\/|\/$/g, "");

    const existingExtras = await game.actors.entities.filter((item) => item.data.folder === folder._id);

    if (!updateBool || !updateImages) {
      if (!updateImages) {
        logger.debug("Copying monster images across...");
        parsedExtras = copyExistingMonsterImages(parsedExtras, existingExtras);
      }
    }

    let finalExtras = await srdFiddling(parsedExtras, "monsters");
    await generateIconMap(finalExtras);

    const updateExtras = async () => {
      return Promise.all(
        finalExtras
          .filter((extra) => existingExtras.some((idx) => idx.name === extra.name))
          .map(async (extra) => {
            const existingExtra = await existingExtras.find((existing) => extra.name === existing.name);
            extra._id = existingExtra._id;
            logger.info(`Updating extra ${extra.name}`);
            await copySupportedItemFlags(existingExtra, extra);
            // await Actor.update(extra);
            await buildNPC(extra, false, true);
            return extra;
          })
      );
    };

    const createExtras = async () => {
      return Promise.all(
        finalExtras
          .filter((extra) => !existingExtras.some((idx) => idx.name === extra.name))
          .map(async (extra) => {
            if (!game.user.can("ITEM_CREATE")) {
              ui.notifications.warn(`Cannot create Extra ${extra.name} for ${type}`);
            } else {
              logger.info(`Creating Extra ${extra.name}`);
              extra.folder = folder._id;
              await buildNPC(extra, false);
            }
            return extra;
          })
      );
    };

    if (updateBool) await updateExtras();
    await createExtras();



  } catch (err) {
    logger.error("Failure parsing extra", err);
    logger.error(err.stack);
  } finally {
    munchSettings.forEach((setting) => {
      console.warn(`Returning ${setting.name} to ${setting.chosen}`);
      game.settings.set("ddb-importer", setting.name, setting.chosen);
    });
  }

}
