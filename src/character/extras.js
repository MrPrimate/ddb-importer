import logger from "../logger.js";
import { parseMonsters } from "../muncher/monster/monster.js";

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
    let creatures = characterData.ddb.creatures.map((creature) => {
      console.log(creature);
      let mock = creature.definition;
      console.log(mock);
      if (creature.name) mock.name = creature.name;

      // get override characterValues for
      // size
      // hp max
      // creature type
      // ac
      // alignment
      // notes
      return mock;
    });
    let parsedMonsters = parseMonsters(creatures);
    console.warn(parsedMonsters);
    // deal with hp adjustments here
    // add id and entityid flags
    // add any tags
    // TODO

    // now we run the monsters through the icon parsing and srd adjustments like regular import
    // TODO

    // instead of importing to compendium though we want to import to world
    // is it already in world?
    // add a flag to character to record location/id of creature based on id
    //


  } catch(err) {
    logger.error("Failure parsing extra", err);
    logger.error(err.stack);
  }
  finally {
    munchSettings.forEach((setting) => {
      console.warn(`Returning ${setting.name} to ${setting.chosen}`)
      game.settings.set("ddb-importer", setting.name, setting.chosen);
    });
  }

}
