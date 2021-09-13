import utils from "../../utils.js";
import logger from "../../logger.js";

import { generateEffects } from "../effects/effects.js";

// function isInfused(ddb, item) {
//   return ddb.infusions.item.some((mapping) =>
//     mapping.itemId === item.flags.ddbimporter.definitionId &&
//     mapping.inventoryMappingId === item.flags.ddbimporter.id &&
//     mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
//   );
// }

// function getInfusionId(item, infusionMap) {
//   const infusionInMap = infusionMap.find((mapping) =>
//     mapping.itemId === item.flags.ddbimporter.definitionId &&
//     mapping.inventoryMappingId === item.flags.ddbimporter.id &&
//     mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
//   );

//   if (infusionInMap) {
//     return infusionInMap.definitionKey.replace("infusion:", "");
//   } else {
//     return undefined;
//   }
// }


function getInfusionItemMap(ddb, item) {
  if (!ddb.infusions?.item) return undefined;
  return ddb.infusions.item.find((mapping) =>
    mapping.itemId === item.flags.ddbimporter.definitionId &&
    mapping.inventoryMappingId === item.flags.ddbimporter.id &&
    mapping.itemTypeId === item.flags.ddbimporter.definitionEntityTypeId
  );
}

function getInfusionDetail(ddb, definitionKey) {
  if (!ddb.infusions?.infusions?.definitionData) return undefined;
  return ddb.infusions.infusions.definitionData.find(
    (infusion) => infusion.definitionKey === definitionKey
  );
}


function getInfusionModifiers(infusionItemMap, infusionDetail) {
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
      modifiers = infusionDetail.modifierData.map((data) => data.modifiers).flat();
    }
  }

  // logger.debug(`${infusionDetail.name} ${infusionDetail.modifierDataType}`, modifiers);

  return modifiers;
}

function addMagicBonus(character, item, modifiers) {
  const filteredModifiers = utils.filterModifiers(modifiers, "bonus", "magic");
  const magicBonus = utils.getModifierSum(filteredModifiers, character);

  if (magicBonus && magicBonus !== 0 && magicBonus !== "") {
    item.data.damage.parts[0][0] += ` + ${magicBonus}`;
    item.data.attackBonus += magicBonus;
    // to do add infusion description to item
  }
  return item;
}

export function getInfusionActionData(ddb) {
  if (!ddb.infusions?.item) return [];
  const generatedInfusionMap = ddb.infusions.item.map((mapping) => {
    return getInfusionDetail(ddb, mapping.definitionKey);
  });

  const infusionActions = generatedInfusionMap
    .filter((infusionDetail) => infusionDetail.type === "augment" && infusionDetail.actions.length > 0)
    .map((infusionDetail) => {
      const actions = infusionDetail.actions.map((action) => {
        const itemLookup = ddb.infusions.item.find((mapping) => mapping.definitionKey === infusionDetail.definitionKey);
        if (!action.name) {
          const itemLookup = ddb.infusions.item.find((mapping) => mapping.definitionKey === infusionDetail.definitionKey);
          const item = ddb.character.inventory.find((item) => item.id === itemLookup.inventoryMappingId);
          const itemName = item?.definition?.name ? `${item.definition.name} : ` : ``;
          action.name = `${itemName}[Infusion] ${infusionDetail.name}`;
        }
        action.infusionFlags = {
          maps: [JSON.parse(JSON.stringify(itemLookup))],
          applied: [JSON.parse(JSON.stringify(infusionDetail))],
          infused: true,
        };
        return action;
      });
      return actions;
    })
    .flat();

  logger.debug(`Infusions Actions Map`, generatedInfusionMap);
  logger.debug(`Generated Infusions Actions`, infusionActions);
  return infusionActions;
}

export function parseInfusion(ddb, character, foundryItem, ddbItem, compendiumItem) {
    // get item mapping
  const infusionItemMap = getInfusionItemMap(ddb, foundryItem);
  foundryItem.flags.infusions = { maps: [], applied: [], infused: false };
  if (infusionItemMap) {
    logger.debug(`Infusion detected for ${foundryItem.name}`);
    // console.warn(ddb);
    // console.warn(ddbItem);
    // console.warn(foundryItem);
    const infusionDetail = getInfusionDetail(ddb, infusionItemMap.definitionKey);

    // get modifiers && generate effects
    const ddbInfusionItem = JSON.parse(JSON.stringify(ddbItem));
    ddbInfusionItem.definition.grantedModifiers = getInfusionModifiers(infusionItemMap, infusionDetail);

    foundryItem = generateEffects(ddb, character, ddbInfusionItem, foundryItem, compendiumItem, "infusion");
    // magic bonuses can't be added as effects as it's real hard to pin to one item
    foundryItem = addMagicBonus(character, foundryItem, ddbInfusionItem.definition.grantedModifiers);

    // add infusion flags
    foundryItem.flags.infusions.infused = true;
    foundryItem.flags.infusions.applied.push(infusionDetail);
    foundryItem.flags.infusions.maps.push(infusionItemMap);

    // Update Item description
    foundryItem.data.description.value += `<div class="infusion-description"><p><b>Infusion: ${infusionDetail.name}</b></p><p>${infusionDetail.description}</p></div>`;
    foundryItem.data.description.chat += `<div class="infusion-description"><p><b>Infusion: ${infusionDetail.name}</b></p><p>${infusionDetail.snippet ? infusionDetail.snippet : infusionDetail.description}</p></div>`;

    // adjust name for infused item
    foundryItem.name += " [Infusion]";
    // if item is loot, lets move it to equipment/trinket so effects will apply
    if (foundryItem.type === "loot") {
      foundryItem.type = "equipment";
      foundryItem.data.armor = {
        type: "trinket",
        value: 10,
        dex: null,
      };
      // infusions will over ride the can equip status, so just check for equipped
      foundryItem.data.equipped = ddbItem.equipped;
    }
  }
  return foundryItem;

}
