import utils from "../../../utils.js";

const queryMonster = async (message) => {
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
      name: game.settings.get("ddb-importer", "entity-monster-compendium"),
      entities: [],
    },
  };

  // check the world for this monster
  result.world.entities = game.actors.entities
    .filter(
      (entity) =>
        entity.data.type === "npc" &&
        utils.normalizeString(entity.data.name) === normalizedName &&
        entity.owner === true
    )
    .map((entity) => {
      return {
        id: entity._id,
        name: utils.getFolderHierarchy(entity.folder),
      };
    });

  // check the current scene, too
  if (game.scenes.active) {
    // every actor will be listed once, only. This is to avoid having 20 "Goblin" entries on
    // dndbeyond on the monster's sheet as selectable actors
    // Only actors currently available in the world that have a token placed on the currently active scene
    // are forwarded to dndbeyond
    let actors = [];
    result.scene.entities = game.scenes.active.data.tokens
      .map((token) => {
        let sceneEntity = undefined;
        // otherwise get the token.name directly, which is a more unique id than the actor.name
        const actor = game.actors.entities.find(
          (actor) =>
            actor.id === token.actorId &&
            utils.normalizeString(actor.name) === normalizedName &&
            actor.owner === true
        );
        if (actor) {
          // if an actorData name is set, this takes precedence
          if (
            token.actorData &&
            token.actorData.name &&
            !actors.includes(token.actorData.name)
          ) {
            sceneEntity = {
              id: token.id,
              name: token.actorData.name,
            };
          } else if (!actors.includes(token.name)) {
            // remember this token's name
            actors.push(token.name);

            sceneEntity = {
              id: token.id,
              name: token.name,
            };
          }
        }
        return sceneEntity;
      })
      .filter((entity) => entity !== undefined);

    // sort the result alphabetically
    result.scene.entities.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  //  check the monster compendium, too
  let compendiumEntry = await utils.queryCompendium(
    result.compendium.name,
    message.name
  );
  result.compendium.entities = compendiumEntry ? [compendiumEntry] : [];
  return result;
};

export default queryMonster;
