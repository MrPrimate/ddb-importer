import utils from "../../utils.js";
import logger from "../../logger.js";

import { generateInfusionEffects } from "../effects/effects.js";

// id: 0,
// success: true,
// message: "Successfully retrieved infusion mappings",
// data: [
//   {
//     definitionKey: "infusion:b40c5807-37b6-417b-9826-3c8152b5e14a",
//     characterId: 32300380,
//     inventoryMappingId: 402333339,
//     creatureMappingId: null,
//     modifierGroupId: "94743d6c-c9e7-4bed-8bff-46ff100bea2e",
//     choiceKey: "364B2EAD-4019-4953-A0FF-7B59AE1021EE",
//     itemTypeId: 2103445194,
//     itemId: 153,
//     monsterId: null,


//   item.flags.ddbimporter['id'] = data.id;
//  item.flags.ddbimporter['entityTypeId'] = data.entityTypeId;


export function isInfused(ddb, item) {
  return ddb.infusions.item.some((infusion) =>
    infusion.itemId === item.flag.ddbimporter.id &&
    infusion.itemTypeId === item.flag.ddbimporter.entityTypeId
  );
}

function getInfusionId(item, infusionMap) {
  const infusionInMap = infusionMap.find((infusion) =>
    infusion.itemId === item.flag.ddbimporter.id &&
    infusion.itemTypeId === item.flag.ddbimporter.entityTypeId
  );

  if (infusionInMap) {
    return infusionInMap.definitionKey.replace("infusion:", "");
  } else {
    return undefined;
  }
}


function getInfusionItem(ddb, item) {
  console.warn(ddb);
  console.warn(item);
  return ddb.infusions.item.find((data) =>
    data.itemId === item.flag.ddbimporter.id &&
    data.itemTypeId === item.flag.ddbimporter.entityTypeId
  );
}

function getInfusionDetail(ddb, definitionKey) {
  return ddb.infusions.infusions.definitionData.find(
    (infusion) => infusion.definitionKey === definitionKey
  );
}


function getInfusionModifiers(infusionItem, infusionDetail) {
  let modifiers = [];

  switch (infusionDetail.modifierDataType) {
    case "class-level":
    case "damage-type-choice": {
      const damageMods = infusionItem.modifierData.find((data) => data.id === infusionItem.modifierGroupId);
      if (damageMods) modifiers = damageMods.modifiers;
      break;
    }
    case "granted":
    default: {
      modifiers = [...infusionDetail.modifierData.map((data) => data.modifiers)];
    }
  }

  return modifiers;
}

export function parseInfusion(ddb, character, foundryItem, ddbItem, compendiumItem) {
    // get item mapping
  const infusionItem = getInfusionItem(ddb, foundryItem);
  const infusionDetail = getInfusionDetail(ddb, infusionItem.definitionKey);

  // get modifiers
  const modifiers = getInfusionModifiers(infusionItem, infusionDetail);
  ddbItem.modifers = modifiers;
  // generate effects
  // get actions

  // add descriptions and snipets to items
  foundryItem = generateInfusionEffects(ddb, character, ddbItem, foundryItem, compendiumItem);

  return foundryItem;

}
