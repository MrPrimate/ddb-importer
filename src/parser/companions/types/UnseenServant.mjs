
import {
  utils,
} from "../../../lib/_module.mjs";


const UNSEEN_SERVANT_INSTANCES = [
  { name: "SRD", token: "systems/dnd5e/tokens/elemental/InvisibleStalker.webp", actor: "systems/dnd5e/tokens/elemental/InvisibleStalker.webp" },
];

export function getUnseenServant(unseenServant, name = "Unseen Servant", postfix = "") {
  const results = {};
  const idString = utils.idString(name);

  UNSEEN_SERVANT_INSTANCES.forEach((data) => {
    const actorData = foundry.utils.mergeObject(foundry.utils.deepClone(unseenServant), {
      "name": `${name}`,
      "prototypeToken.texture.src": data.token,
      "img": data.actor,
    });

    results[`${idString}${data.name}${postfix}`] = {
      name: `${name}`,
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: data.needsJB2A ?? false,
      needsJB2APatreon: data.needsJB2APatreon ?? false,
      folderName: name,
      data: actorData,
    };
  });

  return results;
}
