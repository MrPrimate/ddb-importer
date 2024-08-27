import DDBHelper from "../../lib/DDBHelper.js";
import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";
import logger from "../../logger.js";

// magic items support
import { parseMagicItem } from "./magicify.js";

import { fixItems } from "./special.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";
import { midiItemEffects } from "../../effects/specialEquipment.js";

// tables
import { generateTable } from "../../lib/DDBTable.js";

import parseWeapon from "./weapon.js";
import parseAmmunition from "./ammunition.js";
import parseStaff from "./staves.js";
import parseArmor from "./armor.js";
import parseWonderous from "./wonderous.js";
import parseTool from "./tool.js";
import parseConsumable from "./consumable.js";
import parseLoot from "./loot.js";
import parseCustomItem from "./custom.js";

import { getAttunement, getBaseItem, getPrice } from "./common.js";
import utils from "../../lib/utils.js";
import DDBItem from "./DDBItem.js";



function addExtraDDBFlags(ddbItem, item) {
  item.flags.ddbimporter['id'] = ddbItem.id;
  item.flags.ddbimporter['entityTypeId'] = ddbItem.entityTypeId;

  if (ddbItem.definition.avatarUrl) item.flags.ddbimporter.dndbeyond['avatarUrl'] = ddbItem.definition.avatarUrl.split('?')[0];
  if (ddbItem.definition.largeAvatarUrl) item.flags.ddbimporter.dndbeyond['largeAvatarUrl'] = ddbItem.definition.largeAvatarUrl.split('?')[0];
  if (ddbItem.definition.filterType) {
    const filter = DICTIONARY.items.find((i) => i.filterType === ddbItem.definition.filterType);
    if (filter) item.flags.ddbimporter.dndbeyond['filterType'] = filter.filterType;
  }

  // container info
  if (ddbItem.containerEntityId) foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityId", ddbItem.containerEntityId);
  if (ddbItem.containerEntityTypeId) foundry.utils.setProperty(item, "flags.ddbimporter.containerEntityTypeId", ddbItem.containerEntityTypeId);

  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isConsumable", ddbItem.definition.isConsumable);
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isContainer", ddbItem.definition.isContainer);
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isCustomItem", ddbItem.definition.isCustomItem);
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.homebrew", ddbItem.definition.isHomebrew);
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isMonkWeapon", ddbItem.definition.isMonkWeapon);
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isPack", ddbItem.definition.isPack);
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.levelInfusionGranted", ddbItem.definition.levelInfusionGranted);

  return item;
}

function enrichFlags(ddbItem, item) {
  if (ddbItem.definition?.entityTypeId) item.flags.ddbimporter['definitionEntityTypeId'] = ddbItem.definition.entityTypeId;
  if (ddbItem.definition?.id) item.flags.ddbimporter['definitionId'] = ddbItem.definition.id;
  if (ddbItem.entityTypeId) item.flags.ddbimporter['entityTypeId'] = ddbItem.entityTypeId;
  if (ddbItem.id) item.flags.ddbimporter['id'] = ddbItem.id;
  if (ddbItem.definition?.tags) item.flags.ddbimporter.dndbeyond['tags'] = ddbItem.definition.tags;
  if (ddbItem.definition?.sources) item.flags.ddbimporter.dndbeyond['sources'] = ddbItem.definition.sources;
  if (ddbItem.definition?.stackable) item.flags.ddbimporter.dndbeyond['stackable'] = ddbItem.definition.stackable;
}

function parseItemFromFilterType(ddb, ddbItem, character, flags) {
  const name = ddbItem.definition.name;
  let item = {};
  switch (ddbItem.definition.filterType) {
    case "Weapon": {
      if (ddbItem.definition.type === "Ammunition" || ddbItem.definition.subType === "Ammunition") {
        item = parseAmmunition(ddbItem, "Ammunition");
      } else {
        item = parseWeapon(ddbItem, character, flags);
      }
      break;
    }
    case "Armor":
      item = parseArmor(ddbItem, character, flags);
      break;
    case "Ring":
    case "Wondrous item": {
      if ([
        "bead of",
        "dust of",
        "elemental gem",
      ].some((consumablePrefix) => name.toLowerCase().startsWith(consumablePrefix.toLowerCase()))) {
        item = parseConsumable(ddbItem, { consumableTypeOverride: "trinket", ddbTypeOverride: ddbItem.definition.type });
      } else {
        item = parseWonderous(ddbItem);
      }
      break;
    }
    case "Scroll":
    case "Wand":
    case "Rod":
      item = parseConsumable(ddbItem);
      break;
    case "Staff":
      item = parseStaff(ddbItem, character);
      break;
    case "Potion":
      item = parseConsumable(ddbItem, { consumableTypeOverride: "potion", ddbTypeOverride: ddbItem.definition.type });
      break;
    case "Other Gear":
      item = otherGear(ddb, ddbItem);
      break;
    default:
      logger.warn("Item filterType not implemented for " + ddbItem.definition.name, ddbItem);
      break;
  }
  return item;
}

// the filter type "Other Gear" represents the equipment while the other filters represents the magic items in ddb
function parseItem(ddb, ddbItem, character, flags) {
  try {
    // is it a weapon?
    let item = {};
    if (ddbItem.definition.filterType) {
      item = parseItemFromFilterType(ddb, ddbItem, character, flags);
    } else {
      // try parsing it as a custom item
      item = parseCustomItem(ddbItem);
    }
    // const baseItem = getBaseItem(ddbItem);
    // if (baseItem.baseItem) foundry.utils.setProperty(item, "system.type.baseItem", baseItem.baseItem);
    // if (baseItem.toolType) foundry.utils.setProperty(item, "system.type.value", baseItem.toolType);
    item.system.attuned = ddbItem.isAttuned;
    item.system.attunement = getAttunement(ddbItem);
    item.system.price = getPrice(ddbItem);
    if (ddbItem.definition.magic) item.system.properties = utils.addToProperties(item.system.properties, "mgc");

    item = addExtraDDBFlags(ddbItem, item);
    item = DDBHelper.addCustomValues(ddb, item);
    enrichFlags(ddbItem, item);

    return item;
  } catch (err) {
    logger.warn(
      `Unable to parse item: ${ddbItem.definition.name}, ${ddbItem.definition.type}/${ddbItem.definition.filterType}. ${err.message}`,
      ddbItem,
    );
    logger.error(err.stack);
    return { // return empty strut
      name: ddbItem.definition.name,
      flags: {
        ddbimporter: {
          dndbeyond: {
          },
        },
      },
    };
  }
}


// TO DO: revisit to break up item parsing
// eslint-disable-next-line complexity
DDBCharacter.prototype.getInventory = async function getInventory() {

  let items = [];

  // TODO: rework for activities

  // first, check custom name, price or weight
  this.source.ddb.character.characterValues.forEach((cv) => {
    // try to find a matching item based on the characterValues (an array of custom adjustements to different parts of the character)
    let item = this.source.ddb.character.inventory.find((item) => item.id === cv.valueId);
    if (item) {
      // check if this property is in the list of supported ones, based on our DICT
      let property = DICTIONARY.item.characterValues.find((entry) => entry.typeId === cv.typeId);
      // overwrite the name, weight or price with the custom value
      if (property && cv.value.length !== 0) item.definition[property.value] = cv.value;
    }
  });

  // now parse all items
  const isCompendiumItem = foundry.utils.getProperty(this.raw.character, "flags.ddbimporter.compendium") ?? false;
  const addAutomationEffects = (isCompendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");

  for (let ddbItem of this.source.ddb.character.inventory) {

    const itemParser = new DDBItem({
      ddbData: this.source.ddb,
      ddbItem,
      isCompendium: isCompendiumItem,
      rawCharacter: this.raw.character,
    });

    await itemParser.build();

    let item = Object.assign({}, itemParser.data);


    let item = Object.assign({}, parseItem(this.source.ddb, ddbItem, this.raw.character, flags));

    if (item) {
      item.name = adjustedName;
      item = parseMagicItem(item, ddbItem, this.raw.itemSpells, isCompendiumItem);
      item.flags.ddbimporter.originalName = originalName;
      item.flags.ddbimporter.version = CONFIG.DDBI.version;
      if (!item.effects) item.effects = [];
      if (!item.name || item.name === "") item.name = "Item";

      // if (addEffects) {
      item = generateEffects({
        ddb: this.source.ddb,
        character: this.raw.character,
        ddbItem,
        foundryItem: item,
        isCompendiumItem,
        type: "item",
        description: item.system.description.chat !== ""
          ? item.system.description.chat
          : item.system.description.value,
      });
      // } else if (item.type === "equipment") {
      //   if (foundry.utils.hasProperty(item, "system.armor.type") && ["trinket", "clothing"].includes(item.system.armor.type)) {
      //     item = generateBaseACItemEffect(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem);
      //   }
      // } else {
      //   item = generateBaseACItemEffect(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem);
      // }
      item = await addRestrictionFlags(item, addAutomationEffects);

      if (!isCompendiumItem) item = parseInfusion(this.source.ddb, this.raw.character, item, ddbItem, isCompendiumItem);
      if (addAutomationEffects) item = await midiItemEffects(item);

      items.push(item);
    }
  }

  fixItems(items);
  this.updateItemIds(items);
  return items;
};
