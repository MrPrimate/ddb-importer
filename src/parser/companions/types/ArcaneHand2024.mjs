import { logger, utils } from "../../../lib/_module.mjs";
import { SRDExtractor } from "../SRDExtractor.mjs";

const EXTRA_ARCANE_HAND_INSTANCES = () => {
  return [
    { color: "Red", needsJB2A: false, token: "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm", actor: "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp" },
    { color: "Purple", needsJB2A: true, token: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`, actor: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp` },
    { color: "Green", needsJB2A: true, token: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`, actor: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp` },
    { color: "Blue", needsJB2A: true, token: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`, actor: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp` },
    { color: "Rock", needsJB2A: true, needsJB2APatreon: true, token: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`, actor: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_Thumb.webp` },
    { color: "Rainbow", needsJB2A: true, needsJB2APatreon: true, token: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`, actor: `${utils.getJB2APath()}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp` },
  ];
};

export async function getArcaneHands2024({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
  name = "Bigby's Hand",
  postfix = "2024",
} = {}) {

  logger.verbose(
    "getArcaneHands2024", {
      ddbParser,
      document,
      raw,
      text,
    });


  const results = {};

  const pack = game.packs.get("dnd5e.actors24");
  if (!pack) return results;

  const arcaneHand = await SRDExtractor.getCompendiumDocument({ pack, name: "Arcane Hand" });
  if (!arcaneHand) return results;


  const idString = utils.idString(name);

  EXTRA_ARCANE_HAND_INSTANCES().forEach((data) => {

    const actorData = foundry.utils.mergeObject(arcaneHand.toObject(), {
      "name": `${name} (${data.color})`,
      "prototypeToken.texture.src": data.token,
      "img": data.actor,
    });

    actorData.items.forEach((item) => {
      switch (item.name) {
        case "Clenched Fist": {
          item.img = "icons/magic/earth/strike-fist-stone.webp";
          break;
        }
        case "Forceful Hand": {
          item.img = "icons/magic/earth/strike-fist-stone-gray.webp";
          break;
        }
        case "Grasping Hand": {
          item.img = "icons/magic/earth/strike-fist-stone-light.webp";
          break;
        }
        case "Interposing Hand": {
          item.img = "icons/magic/earth/barrier-stone-explosion-debris.webp";
          break;
        }
          // no default
      }
    });

    results[`${idString}${data.color}${postfix}`] = {
      name: `${name} (${data.color})`,
      version: "4",
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
