import {
  utils,
} from "../../../lib/_module.mjs";


const EXTRA_ARCANE_HAND_INSTANCES = (jb2aMod) => {
  return [
    { color: "Red", needsJB2A: false, token: "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm", actor: "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp" },
    { color: "Purple", needsJB2A: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp` },
    { color: "Green", needsJB2A: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp` },
    { color: "Blue", needsJB2A: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp` },
    { color: "Rock", needsJB2A: true, needsJB2APatreon: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_Thumb.webp` },
    { color: "Rainbow", needsJB2A: true, needsJB2APatreon: true, token: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`, actor: `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp` },
  ];
};

export function getArcaneHands(arcaneHand, name = "Arcane Hand", postfix = "") {
  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";
  const results = {};

  const idString = utils.idString(name);

  EXTRA_ARCANE_HAND_INSTANCES(jb2aMod).forEach((data) => {

    const actorData = foundry.utils.mergeObject(foundry.utils.deepClone(arcaneHand), {
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
      version: "3",
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
