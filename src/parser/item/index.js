import DDBHelper from "../../lib/DDBHelper.js";
import DICTIONARY from "../../dictionary.js";
import DDBCharacter from "../DDBCharacter.js";
import logger from "../../logger.js";

// magic items support
import { parseMagicItem } from "./magicify.js";

import { fixItems } from "./special.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { generateBaseACItemEffect } from "../../effects/acEffects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";
import { midiItemEffects } from "../../effects/specialEquipment.js";

// tables
import { generateTable } from "../../muncher/table.js";

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

const CLOTHING_ITEMS = [
  "Helm",
  "Boots",
  "Snowshoes",
  "Vestments",
  "Saddle, Exotic",
  "Saddle, Military",
  "Saddle, Pack",
  "Saddle, Riding",
];

const EQUIPMENT_TRINKET = [
  "Canoe",
  "Censer",
  "Crowbar",
  "Grenade Launcher",
  "Hammer",
  "Hammer, Sledge",
  "Hourglass",
  "Ladder (10 foot)",
  "Mess Kit",
  "Mirror, Steel",
  "Pick, Miner's",
  "Pole (10-foot)",
  "Shovel",
  "Signal Whistle",
  "Small Knife",
  "Spellbook",
  "Spyglass",
  "Tent, Two-Person",
  "Whetstone",
];

function getItemFromGearTypeIdOne(ddb, ddbItem) {
  let item = {};

  switch (ddbItem.definition.subType) {
    case "Potion":
      item = parseConsumable(ddbItem, { consumableTypeOverride: "potion", ddbTypeOverride: ddbItem.definition.subType });
      break;
    case "Tool":
      item = parseTool(ddb, ddbItem, ddbItem.definition.subType);
      break;
    case "Ammunition":
      item = parseAmmunition(ddbItem, ddbItem.definition.subType);
      break;
    case "Arcane Focus":
    case "Holy Symbol":
    case "Druidic Focus":
      item = parseWonderous(ddbItem, { ddbTypeOverride: ddbItem.definition.subType });
      break;
    case "Mount":
      item = parseLoot(ddbItem, "Mount");
      break;
    case "Vehicle":
      item = parseLoot(ddbItem, "Vehicle");
      break;
    default: {
      const isContainerTag = ddbItem.definition.tags.includes('Container');
      const isOuterwearTag = ddbItem.definition.tags.includes('Outerwear')
        || ddbItem.definition.tags.includes('Footwear');
      if ((!ddbItem.definition.isContainer && isOuterwearTag && !isContainerTag)
        || CLOTHING_ITEMS.includes(ddbItem.definition.name)
      ) {
        item = parseWonderous(ddbItem, { ddbTypeOverride: "Clothing", armorType: "clothing" });
      } else if (EQUIPMENT_TRINKET.includes(ddbItem.definition.name)) {
        item = parseWonderous(ddbItem, { ddbTypeOverride: ddbItem.definition.subType });
      } else {
        item = parseLoot(ddbItem, ddbItem.definition.subType);
      }
    }
  }
  return item;
}

function otherGear(ddb, ddbItem) {
  let item = {};

  switch (ddbItem.definition.gearTypeId) {
    case 1:
      item = getItemFromGearTypeIdOne(ddb, ddbItem);
      break;
    case 4:
      item = parseLoot(ddbItem, "Mount");
      break;
    case 5:
      item = parseConsumable(ddbItem, { consumableTypeOverride: "potion", ddbTypeOverride: "Poison" });
      break;
    case 6:
      item = parseConsumable(ddbItem, { consumableTypeOverride: "potion", ddbTypeOverride: "Potion" });
      break;
    case 11:
      item = parseTool(ddb, ddbItem, "Tool");
      break;
    case 12:
    case 17:
    case 19:
      item = parseLoot(ddbItem, "Vehicle");
      break;
    case 16:
      item = parseLoot(ddbItem, "Equipment Pack");
      break;
    case 18:
      // Change to parseGemstone (consummable) ?
      item = parseLoot(ddbItem, "Gemstone");
      break;
    default:
      logger.warn("Other Gear type missing from " + ddbItem.definition.name, ddbItem);
  }
  return item;
}

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
  foundry.utils.setProperty(item, "flags.ddbimporter.dndbeyond.isHomebrew", ddbItem.definition.isHomebrew);
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

// the filter type "Other Gear" represents the equipment while the other filters represents the magic items in ddb
export function parseItem(ddb, ddbItem, character, flags) {
  try {
    // is it a weapon?
    let item = {};
    const name = ddbItem.definition.name;
    if (ddbItem.definition.filterType) {
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
    } else {
      // try parsing it as a custom item
      item = parseCustomItem(ddbItem);
    }
    const baseItem = getBaseItem(ddbItem);
    if (baseItem.baseItem) foundry.utils.setProperty(item, "system.type.baseItem", baseItem.baseItem);
    if (baseItem.toolType) foundry.utils.setProperty(item, "system.type.value", baseItem.toolType);
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
      ddbItem
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


/**
 * We get extra damage to a weapon attack here, for example Improved
 * Divine Smite
 * @param {*} data
 * @param {*} restrictions (array)
 */
function getExtraDamage(ddb, restrictions) {
  return DDBHelper.filterBaseModifiers(ddb, "damage", { restriction: restrictions }).map((mod) => {
    const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
    if (die) {
      return [die.diceString, mod.subType];
    } else if (mod.value) {
      return [mod.value, mod.subType];
    } else {
      return [null, null];
    }
  });
}

function isMartialArtists(classes) {
  return classes.some((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"));
}

function getWarlockFeatures(ddb, weapon) {
  // Some features, notably hexblade abilities we scrape out here
  const warlockFeatures = ddb.character.characterValues
    .filter(
      (characterValue) =>
        characterValue.value
        && characterValue.valueId == weapon.id
        && DICTIONARY.character.characterValuesLookup.some(
          (entry) => entry.typeId == characterValue.typeId
        )
    )
    .map(
      (characterValue) =>
        DICTIONARY.character.characterValuesLookup.find(
          (entry) => entry.typeId == characterValue.typeId
        ).name
    );

  // Any Pact Weapon Features
  const pactFeatures = ddb.character.options.class
    .filter(
      (option) =>
        warlockFeatures.includes("pactWeapon")
        && option.definition.name
        && DICTIONARY.character.pactFeatures.includes(option.definition.name)
    )
    .map((option) => option.definition.name);

  const features = warlockFeatures.concat(pactFeatures);
  return features;
}

function getMonkFeatures(ddb, weapon) {
  const kenseiWeapon = DDBHelper.getChosenClassModifiers(ddb).some((mod) =>
    mod.friendlySubtypeName === weapon.definition.type
    && mod.type === "kensei"
  );

  const monkWeapon = DDBHelper.getChosenClassModifiers(ddb).some((mod) =>
    mod.friendlySubtypeName === weapon.definition.type
    && mod.type == "monk-weapon"
  ) || (weapon.definition.isMonkWeapon && isMartialArtists(ddb.character.classes));

  let features = [];

  if (kenseiWeapon) features.push("kenseiWeapon");
  if (monkWeapon) features.push("monkWeapon");

  return features;
}


function getMartialArtsDie(ddb) {
  let result = {
    diceCount: null,
    diceMultiplier: null,
    diceString: null,
    diceValue: null,
    fixedValue: null,
  };

  const die = ddb.character.classes
    // is a martial artist
    .filter((cls) => cls.classFeatures.some((feature) => feature.definition.name === "Martial Arts"))
    // get class features
    .map((cls) => cls.classFeatures)
    .flat()
    // filter relevant features, those that are martial arts and have a levelscaling hd
    .filter((feature) => feature.definition.name === "Martial Arts" && feature.levelScale && feature.levelScale.dice)
    // get this dice object
    .map((feature) => feature.levelScale.dice);

  if (die && die.length > 0) {
    result = die[0];
  }

  return result;

}

function getClassFeatures(ddb, weapon) {
  const warlockFeatures = getWarlockFeatures(ddb, weapon);
  const monkFeatures = getMonkFeatures(ddb, weapon);
  return warlockFeatures.concat(monkFeatures);
}

DDBCharacter.prototype.getItemFlags = function getItemFlags(ddbItem) {
  const ddb = this.source.ddb;
  const character = this.raw.character;
  let flags = {
    damage: {
      parts: [],
    },
    // Some features, notably hexblade abilities we scrape out here
    classFeatures: getClassFeatures(ddb, ddbItem),
    martialArtsDie: getMartialArtsDie(ddb),
    maxMediumArmorDex: Math.max(
      ...DDBHelper.filterBaseModifiers(ddb, "set", { subType: "ac-max-dex-armored-modifier", includeExcludedEffects: true }).map((mod) => mod.value),
      ...DDBHelper.filterModifiersOld(ddbItem.definition?.grantedModifiers ?? ddbItem.grantedModifiers ?? [], "set", "ac-max-dex-armored-modifier", ["", null], true).map((mod) => mod.value),
      ...DDBHelper.filterModifiersOld(ddbItem.definition?.grantedModifiers ?? ddbItem.grantedModifiers ?? [], "set", "ac-max-dex-modifier", ["", null], true).map((mod) => mod.value),
      2,
    ),
    magicItemAttackInt: DDBHelper.filterBaseModifiers(ddb, "bonus", { subType: "magic-item-attack-with-intelligence" }).length > 0,
  };

  if (flags.classFeatures.includes("Lifedrinker")) {
    flags.damage.parts.push(["@abilities.cha.mod", "necrotic"]);
  }
  // const addItemEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
  const addCharacterEffects = game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  // for melee attacks get extras
  if (ddbItem.definition.attackType === 1) {
    // get improved divine smite etc for melee attacks
    const extraDamage = getExtraDamage(ddb, ["Melee Weapon Attacks"]);

    if (!!extraDamage.length > 0) {
      flags.damage.parts = flags.damage.parts.concat(extraDamage);
    }
    // do we have great weapon fighting?
    if (DDBHelper.hasChosenCharacterOption(ddb, "Great Weapon Fighting")) {
      flags.classFeatures.push("greatWeaponFighting");
    }
    // do we have dueling fighting style?
    if (DDBHelper.hasChosenCharacterOption(ddb, "Dueling") && !addCharacterEffects) {
      flags.classFeatures.push("Dueling");
    }
    // do we have two weapon fighting style?
    if (DDBHelper.hasChosenCharacterOption(ddb, "Two-Weapon Fighting")) {
      flags.classFeatures.push("Two-Weapon Fighting");
    }
    if (DDBHelper.getCustomValueFromCharacter(ddbItem, character, 18)) {
      flags.classFeatures.push("OffHand");
    }
  }
  // ranged fighting style is added as a global modifier elsewhere
  // as is defensive style

  logger.debug(`Flags for ${ddbItem.name ?? ddbItem.definition.name}`, { ddbItem, flags });

  return flags;
};

// TO DO: revisit to break up item parsing
// eslint-disable-next-line complexity
DDBCharacter.prototype.getInventory = async function getInventory() {

  let items = [];
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
  const addEffects = (isCompendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");

  for (let ddbItem of this.source.ddb.character.inventory) {
    const originalName = ddbItem.definition.name;
    const adjustedName = DDBHelper.getName(this.source.ddb, ddbItem, this.raw.character);
    const flags = this.getItemFlags(ddbItem);

    const updateExisting = isCompendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-update-existing")
      : false;
    // eslint-disable-next-line no-await-in-loop
    ddbItem.definition.description = await generateTable(adjustedName, ddbItem.definition.description, updateExisting);

    let item = Object.assign({}, parseItem(this.source.ddb, ddbItem, this.raw.character, flags));

    if (item) {
      item.name = adjustedName;
      item = parseMagicItem(item, ddbItem, this.raw.itemSpells, isCompendiumItem);
      item.flags.ddbimporter.originalName = originalName;
      item.flags.ddbimporter.version = CONFIG.DDBI.version;
      if (!item.effects) item.effects = [];
      if (!item.name || item.name === "") item.name = "Item";

      if (addEffects) {
        item = generateEffects(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem, "item");
      } else if (item.type === "equipment") {
        if (foundry.utils.hasProperty(item, "system.armor.type") && ["trinket", "clothing"].includes(item.system.armor.type)) {
          item = generateBaseACItemEffect(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem);
        }
      } else {
        item = generateBaseACItemEffect(this.source.ddb, this.raw.character, ddbItem, item, isCompendiumItem);
      }

      // eslint-disable-next-line no-await-in-loop
      item = await addRestrictionFlags(item, addEffects);

      if (!isCompendiumItem) item = parseInfusion(this.source.ddb, this.raw.character, item, ddbItem, isCompendiumItem);
      // eslint-disable-next-line no-await-in-loop
      item = await midiItemEffects(item);
      // eslint-disable-next-line no-await-in-loop
      // item = await getIcon(item, ddbItem);

      items.push(item);
    }
  }

  fixItems(items);
  this.updateItemIds(items);
  return items;
};
