import utils from "../../utils.js";
import logger from "../../logger.js";

import { generateEffects } from "../effects/effects.js";

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


function isInfused(ddb, item) {
  return ddb.infusions.item.some((mapping) =>
    mapping.itemId === item.flags.ddbimporter.definitionId &&
    mapping.inventoryMappingId === item.flags.ddbimporter.id &&
    mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
  );
}

function getInfusionId(item, infusionMap) {
  const infusionInMap = infusionMap.find((mapping) =>
    mapping.itemId === item.flags.ddbimporter.definitionId &&
    mapping.inventoryMappingId === item.flags.ddbimporter.id &&
    mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
  );

  if (infusionInMap) {
    return infusionInMap.definitionKey.replace("infusion:", "");
  } else {
    return undefined;
  }
}


function getInfusionItemMap(ddb, item) {
  return ddb.infusions.item.find((mapping) =>
    mapping.itemId === item.flags.ddbimporter.definitionId &&
    mapping.inventoryMappingId === item.flags.ddbimporter.id &&
    mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
  );
}

function getInfusionDetail(ddb, definitionKey) {
  return ddb.infusions.infusions.definitionData.find(
    (infusion) => infusion.definitionKey === definitionKey
  );
}


function getInfusionModifiers(infusionItemMap, infusionDetail) {
  console.warn(infusionItemMap);
  console.warn(infusionDetail);
  let modifiers = [];

  switch (infusionDetail.modifierDataType) {
    case "class-level":
    case "damage-type-choice": {
      const damageMods = infusionDetail.modifierData.find(
        (data) => data.id === infusionItemMap.modifierGroupId
      );
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
  const infusionItemMap = getInfusionItemMap(ddb, foundryItem);
  if (infusionItemMap) {
    console.warn(`Infusion detected for ${foundryItem.name}`);
    // console.warn(ddb);
    console.warn(ddbItem);
    console.warn(foundryItem);
    const infusionDetail = getInfusionDetail(ddb, infusionItemMap.definitionKey);

    // get modifiers && generate effects
    const ddbInfusionItem = JSON.parse(JSON.stringify(ddbItem));
    ddbInfusionItem.definition.grantedModifiers = getInfusionModifiers(infusionItemMap, infusionDetail);

    // get actions

    // add descriptions and snipets to items
    foundryItem = generateEffects(ddb, character, ddbInfusionItem, foundryItem, compendiumItem, "infusion");

  }
  return foundryItem;

}
