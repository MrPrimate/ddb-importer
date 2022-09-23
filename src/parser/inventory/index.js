import DICTIONARY from "../../dictionary.js";
// type: weapon
import parseWeapon from "./weapon.js";
import parseAmmunition from "./ammunition.js";
import parseStaff from "./staves.js";

// type: armor
import parseArmor from "./armor.js";

// tyoe: wonderous item
import parseWonderous from "./wonderous.js";

// type: consumables
import parsePotion from "./potion.js";
import parseScroll from "./scroll.js";

// type: tool
import parseTool from "./tool.js";

// other loot
import parseLoot from "./loot.js";
import parseCustomItem from "./custom.js";
import utils from "../../utils/utils.js";

// magicitems support
import { parseMagicItem } from "./magicify.js";
import { getAttunement, getBaseItem } from "./common.js";
import logger from "../../logger.js";

import { fixItems } from "./special.js";

// effects support
import { generateEffects } from "../../effects/effects.js";
import { generateBaseACItemEffect } from "../../effects/acEffects.js";
import { parseInfusion } from "./infusions.js";
import { addRestrictionFlags } from "../../effects/restrictions.js";

// tables
import { generateTable } from "../../muncher/table.js";
import { fixForItemCollections } from "./itemCollections.js";

/**
 * We get extra damage to a weapon attack here, for example Improved
 * Divine Smite
 * @param {*} data
 * @param {*} restrictions (array)
 */
function getExtraDamage(ddb, restrictions) {
  return utils.filterBaseModifiers(ddb, "damage", null, restrictions).map((mod) => {
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
        characterValue.value &&
        characterValue.valueId == weapon.id &&
        DICTIONARY.character.characterValuesLookup.some(
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
        warlockFeatures.includes("pactWeapon") &&
        option.definition.name &&
        DICTIONARY.character.pactFeatures.includes(option.definition.name)
    )
    .map((option) => option.definition.name);

  const features = warlockFeatures.concat(pactFeatures);
  return features;
}

function getMonkFeatures(ddb, weapon) {
  const kenseiWeapon = utils.getChosenClassModifiers(ddb).some((mod) =>
    mod.friendlySubtypeName === weapon.definition.type &&
    mod.type === "kensei"
  );

  const monkWeapon = utils.getChosenClassModifiers(ddb).some((mod) =>
    mod.friendlySubtypeName === weapon.definition.type &&
    mod.type == "monk-weapon"
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

function getItemFlags(ddb, data, character) {
  let flags = {
    damage: {
      parts: [],
    },
    // Some features, notably hexblade abilities we scrape out here
    classFeatures: getClassFeatures(ddb, data),
    martialArtsDie: getMartialArtsDie(ddb),
    maxMediumArmorDex: Math.max(...utils.filterBaseModifiers(ddb, "set", "ac-max-dex-armored-modifier").map((mod) => mod.value), 2),
    magicItemAttackInt: utils.filterBaseModifiers(ddb, "bonus", "magic-item-attack-with-intelligence").length > 0,
  };

  if (flags.classFeatures.includes("Lifedrinker")) {
    flags.damage.parts.push(["@mod", "necrotic"]);
  }
  // const addItemEffects = game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
  const addCharacterEffects = game.settings.get("ddb-importer", "character-update-policy-add-character-effects");

  // for melee attacks get extras
  if (data.definition.attackType === 1) {
    // get improved divine smite etc for melee attacks
    const extraDamage = getExtraDamage(ddb, ["Melee Weapon Attacks"]);

    if (!!extraDamage.length > 0) {
      flags.damage.parts = flags.damage.parts.concat(extraDamage);
    }
    // do we have great weapon fighting?
    if (utils.hasChosenCharacterOption(ddb, "Great Weapon Fighting")) {
      flags.classFeatures.push("greatWeaponFighting");
    }
    // do we have dueling fighting style?
    if (utils.hasChosenCharacterOption(ddb, "Dueling") && !addCharacterEffects) {
      flags.classFeatures.push("Dueling");
    }
    // do we have two weapon fighting style?
    if (utils.hasChosenCharacterOption(ddb, "Two-Weapon Fighting")) {
      flags.classFeatures.push("Two-Weapon Fighting");
    }
    if (utils.getCustomValueFromCharacter(data, character, 18)) {
      flags.classFeatures.push("OffHand");
    }
  }
  // ranged fighting style is added as a global modifier elsewhere
  // as is defensive style

  return flags;
}

function getItemFromGearTypeIdOne(ddb, data) {
  let item = {};

  switch (data.definition.subType) {
    case "Potion":
      item = parsePotion(data, data.definition.subType);
      break;
    case "Tool":
      item = parseTool(ddb, data, data.definition.subType);
      break;
    case "Ammunition":
      item = parseAmmunition(data, data.definition.subType);
      break;
    default:
      item = parseLoot(data, data.definition.subType);
  }
  return item;
}

function otherGear(ddb, data) {
  let item = {};

  switch (data.definition.gearTypeId) {
    case 1:
      item = getItemFromGearTypeIdOne(ddb, data);
      break;
    case 4:
      item = parseLoot(data, "Mount");
      break;
    case 5:
      item = parsePotion(data, "Poison");
      break;
    case 6:
      item = parsePotion(data, "Potion");
      break;
    case 11:
      item = parseTool(ddb, data, "Tool");
      break;
    case 12:
    case 17:
    case 19:
      item = parseLoot(data, "Vehicle");
      break;
    case 16:
      item = parseLoot(data, "Equipment Pack");
      break;
    case 18:
      // Change to parseGemstone (consummable) ?
      item = parseLoot(data, "Gemstone");
      break;
    default:
      logger.warn("Other Gear type missing from " + data.definition.name, data);
  }
  return item;
}

function addExtraDDBFlags(data, item) {
  item.flags.ddbimporter['id'] = data.id;
  item.flags.ddbimporter['entityTypeId'] = data.entityTypeId;

  if (data.definition.avatarUrl) item.flags.ddbimporter.dndbeyond['avatarUrl'] = data.definition.avatarUrl.split('?')[0];
  if (data.definition.largeAvatarUrl) item.flags.ddbimporter.dndbeyond['largeAvatarUrl'] = data.definition.largeAvatarUrl.split('?')[0];
  if (data.definition.filterType) {
    const filter = DICTIONARY.items.find((i) => i.filterType === data.definition.filterType);
    if (filter) item.flags.ddbimporter.dndbeyond['filterType'] = filter.filterType;
  }

  // container info
  if (data.containerEntityId) setProperty(item, "flags.ddbimporter.containerEntityId", data.containerEntityId);
  if (data.containerEntityTypeId) setProperty(item, "flags.ddbimporter.containerEntityTypeId", data.containerEntityTypeId);

  setProperty(item, "flags.ddbimporter.dndbeyond.isConsumable", data.definition.isConsumable);
  setProperty(item, "flags.ddbimporter.dndbeyond.isContainer", data.definition.isContainer);
  setProperty(item, "flags.ddbimporter.dndbeyond.isCustomItem", data.definition.isCustomItem);
  setProperty(item, "flags.ddbimporter.dndbeyond.isHomebrew", data.definition.isHomebrew);
  setProperty(item, "flags.ddbimporter.dndbeyond.isMonkWeapon", data.definition.isMonkWeapon);
  setProperty(item, "flags.ddbimporter.dndbeyond.isPack", data.definition.isPack);
  setProperty(item, "flags.ddbimporter.dndbeyond.levelInfusionGranted", data.definition.levelInfusionGranted);

  return item;
}

// the filter type "Other Gear" represents the equipment while the other filters represents the magic items in ddb
function parseItem(ddb, data, character, flags) {
  try {
    // is it a weapon?
    let item = {};
    if (data.definition.filterType) {
      switch (data.definition.filterType) {
        case "Weapon": {
          if (data.definition.type === "Ammunition" || data.definition.subType === "Ammunition") {
            item = parseAmmunition(data, "Ammunition");
          } else {
            item = parseWeapon(data, character, flags);
          }
          break;
        }
        case "Armor":
          item = parseArmor(data, character, flags);
          break;
        case "Wondrous item":
        case "Ring":
        case "Wand":
        case "Rod":
          item = parseWonderous(data);
          break;
        case "Staff":
          item = parseStaff(data, character);
          break;
        case "Potion":
          item = parsePotion(data, data.definition.type);
          break;
        case "Scroll":
          item = parseScroll(data);
          break;
        case "Other Gear":
          item = otherGear(ddb, data);
          break;
        default:
          logger.warn("Item filterType not implemented for " + data.definition.name, data);
          break;
      }
    } else {
      // try parsing it as a custom item
      item = parseCustomItem(data);
    }
    const baseItem = getBaseItem(data);
    setProperty(item, "system.baseItem", baseItem.baseItem);
    setProperty(item, "system.toolType", baseItem.toolType);
    item.system.attunement = getAttunement(data);
    if (data.definition.cost) item.system.price = data.definition.cost;

    item = addExtraDDBFlags(data, item);

    return item;
  } catch (err) {
    logger.warn(
      `Unable to parse item: ${data.definition.name}, ${data.definition.type}/${data.definition.filterType}. ${err.message}`,
      data
    );
    logger.error(err.stack);
    return { // return empty strut
      name: data.definition.name,
      flags: {
        ddbimporter: {
          dndbeyond: {
          },
        },
      },
    };
  }
}

function enrichFlags(data, item) {
  if (data.definition.magic) {
    setProperty(item, "system.properties.mgc", true);
  }
  if (game.modules.get("betterrolls5e")?.active) {
    if (item.system.uses?.max && !item.flags?.betterRolls5e) {
      item.flags['betterRolls5e'] = {
        quickCharges: {
          value: {
            use: true,
            resource: true
          },
          altValue: {
            use: true,
            resource: true
          }
        },
      };
    }
  }
  if (data.definition?.entityTypeId) item.flags.ddbimporter['definitionEntityTypeId'] = data.definition.entityTypeId;
  if (data.definition?.id) item.flags.ddbimporter['definitionId'] = data.definition.id;
  if (data.entityTypeId) item.flags.ddbimporter['entityTypeId'] = data.entityTypeId;
  if (data.id) item.flags.ddbimporter['id'] = data.id;
  if (data.definition?.tags) item.flags.ddbimporter.dndbeyond['tags'] = data.definition.tags;
  if (data.definition?.sources) item.flags.ddbimporter.dndbeyond['sources'] = data.definition.sources;
  if (data.definition?.stackable) item.flags.ddbimporter.dndbeyond['stackable'] = data.definition.stackable;
}

export default async function getInventory(ddb, character, itemSpells) {
  let items = [];
  // first, check custom name, price or weight
  ddb.character.characterValues.forEach((cv) => {
    // try to find a matching item based on the characterValues (an array of custom adjustements to different parts of the character)
    let item = ddb.character.inventory.find((item) => item.id === cv.valueId);
    if (item) {
      // check if this property is in the list of supported ones, based on our DICT
      let property = DICTIONARY.item.characterValues.find((entry) => entry.typeId === cv.typeId);
      // overwrite the name, weight or price with the custom value
      if (property && cv.value.length !== 0) item.definition[property.value] = cv.value;
    }
  });

  // now parse all items
  const daeInstalled = game.modules.get("dae")?.active;
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addEffects = (compendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
  const generateArmorACEffect = (compendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-ac-armor-effects")
    : false;

  for (let ddbItem of ddb.character.inventory) {
    const originalName = ddbItem.definition.name;
    ddbItem.definition.name = utils.getName(ddb, ddbItem, character);
    const flags = getItemFlags(ddb, ddbItem, character);

    const updateExisting = compendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-update-existing")
      : false;
    ddbItem.definition.description = generateTable(ddbItem.definition.name, ddbItem.definition.description, updateExisting);

    let item = Object.assign({}, parseItem(ddb, ddbItem, character, flags));
    item = utils.addCustomValues(ddb, item);
    enrichFlags(ddbItem, item);

    if (item) {
      item.flags.magicitems = parseMagicItem(ddbItem, itemSpells);
      item.flags.ddbimporter.originalName = originalName;
      item.flags.ddbimporter.version = CONFIG.DDBI.version;
      if (!item.effects) item.effects = [];
      if (!item.name || item.name === "") item.name = "Item";

      if (daeInstalled && addEffects) item = generateEffects(ddb, character, ddbItem, item, compendiumItem, "item");
      // if this is a piece of armor and not generating effects don't generate ac
      if (item.type === "equipment" && item.system.armor?.type && !["trinket", "clothing"].includes(item.system.armor.type)) {
        if (daeInstalled && generateArmorACEffect) {
          item = generateBaseACItemEffect(ddb, character, ddbItem, item, compendiumItem);
        }
      } else {
        // always generate other item ac effects
        item = generateBaseACItemEffect(ddb, character, ddbItem, item, compendiumItem);
      }

      // eslint-disable-next-line no-await-in-loop
      if (addEffects) item = await addRestrictionFlags(item);

      if (!compendiumItem) item = parseInfusion(ddb, character, item, ddbItem, compendiumItem);

      items.push(item);
    }
  }

  fixItems(items);
  items = fixForItemCollections(ddb, items);
  return items;
}
