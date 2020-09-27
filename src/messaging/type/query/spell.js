import utils from "../../../utils.js";

const querySpell = async (message) => {
  const normalizedName = utils.normalizeString(message.name);
  const result = {
    user: {
      name: game.user.name,
      isGM: game.user.isGM,
    },
    world: {
      name: game.world.name,
      entities: [],
    },
    scene: {
      name: game.scenes.active ? game.scenes.active.data.name : null,
      entities: [],
    },
    compendium: {
      name: game.settings.get("ddb-importer", "entity-spell-compendium"),
      entities: [],
    },
  };

  // check the world for this monster
  result.world.entities = game.items.entities
    .filter(
      (entity) =>
        entity.data.type === "spell" &&
        utils.normalizeString(entity.data.name) === normalizedName
    )
    .map((entity) => {
      return {
        id: entity._id,
        name: utils.getFolderHierarchy(entity.folder),
      };
    });

  //  check the monster compendium, too
  let compendiumEntry = await utils.queryCompendium(
    result.compendium.name,
    message.name
  );

  result.compendium.entities = compendiumEntry ? [compendiumEntry] : [];

  return result;
};

export default querySpell;
