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
import utils from "../../utils.js";

// magicitems support
import { parseMagicItem } from "./magicify.js";
import { getAttunement, getBaseItem } from "./common.js";
import logger from "../../logger.js";

import { fixItems } from "./special.js";

// effects support
import { generateEffects } from "../effects/effects.js";
import { generateBaseACItemEffect } from "../effects/acEffects.js";
import { parseInfusion } from "./infusions.js";

// tables
import { generateTable } from "../../muncher/table.js";

/**
 * We get extra damage to a weapon attack here, for example Improved
 * Divine Smite
 * @param {*} data
 * @param {*} restrictions (array)
 */
function getExtraDamage(ddb, restrictions) {
  return utils.filterBaseModifiers(ddb, "damage", null, restrictions).map((mod) => {
    if (mod.dice) {
      return [mod.dice.diceString, mod.subType];
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
    // do we have dueling fighting style?
    if (utils.hasChosenCharacterOption(ddb, "Two-Weapon Fighting")) {
      flags.classFeatures.push("Two-Weapon Fighting");
    }
    if (utils.getCustomValue(data, character, 18)) {
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
      logger.warn("Other Gear type missing from " + data.definition.name);
  }
  return item;
}

function addCustomValues(ddbItem, foundryItem, character) {
  // to hit override requires a lot of crunching
  // const toHitOverride = utils.getCustomValue(item, character, 13);
  const toHitBonus = utils.getCustomValue(ddbItem, character, 12);
  const damageBonus = utils.getCustomValue(ddbItem, character, 10);
  // const displayAsAttack = utils.getCustomValue(item, character, 16);
  const costOverride = utils.getCustomValue(ddbItem, character, 19);
  const weightOverride = utils.getCustomValue(ddbItem, character, 22);
  // dual wield 18
  // silvered
  const silvered = utils.getCustomValue(ddbItem, character, 20);
  // adamantine
  const adamantine = utils.getCustomValue(ddbItem, character, 21);
  // off-hand
  // const offHand = utils.getCustomValue(ddbItem, character, 18);

  if (toHitBonus) foundryItem.data.attackBonus += toHitBonus;
  if (damageBonus && foundryItem.data?.damage?.parts && foundryItem.data?.damage?.parts.length !== 0) {
    foundryItem.data.damage.parts[0][0] = foundryItem.data.damage.parts[0][0].concat(` +${damageBonus}`);
  } else if (damageBonus && foundryItem.data?.damage?.parts) {
    const part = [`+${damageBonus}`, ""];
    foundryItem.data.damage.parts.push(part);
  }
  if (costOverride) foundryItem.data.cost = costOverride;
  if (weightOverride) foundryItem.data.weight = weightOverride;
  if (silvered) foundryItem.data.properties['sil'] = true;
  if (adamantine) foundryItem.data.properties['ada'] = true;
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
  if (data.containerEntityId) item.flags.ddbimporter['containerEntityId'] = data.containerEntityId;
  if (data.containerEntityTypeId) item.flags.ddbimporter['containerEntityTypeId'] = data.containerEntityTypeId;
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
          logger.warn("Item filterType not implemented for " + data.definition.name);
          break;
      }
    } else {
      // try parsing it as a custom item
      item = parseCustomItem(data);
    }
    item.data.baseItem = getBaseItem(data);
    item.data.attunement = getAttunement(data);
    if (data.definition.cost) item.data.price = data.definition.cost;

    item = addExtraDDBFlags(data, item);

    return item;
  } catch (err) {
    logger.warn(
      `Unable to parse item: ${data.definition.name}, ${data.definition.type}/${data.definition.filterType}. ${err.message}`,
      "character"
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
    if (item.data.properties) {
      item.data.properties['mgc'] = true;
    } else {
      item.data.properties = { mgc: true };
    }
  }
  if (item.data.uses?.max && !item.flags?.betterRolls5e) {
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
  if (data.definition?.entityTypeId) item.flags.ddbimporter['definitionEntityTypeId'] = data.definition.entityTypeId;
  if (data.definition?.id) item.flags.ddbimporter['definitionId'] = data.definition.id;
  if (data.entityTypeId) item.flags.ddbimporter['entityTypeId'] = data.entityTypeId;
  if (data.id) item.flags.ddbimporter['id'] = data.id;
  if (data.definition?.tags) item.flags.ddbimporter.dndbeyond['tags'] = data.definition.tags;
  if (data.definition?.sources) item.flags.ddbimporter.dndbeyond['sources'] = data.definition.sources;
  if (data.definition?.stackable) item.flags.ddbimporter.dndbeyond['stackable'] = data.definition.stackable;
}

export default function getInventory(ddb, character, itemSpells) {
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

  const customItems = ddb.character.customItems
    ? ddb.character.customItems.map((customItem) => ({
      id: customItem.id,
      definition: customItem,
    }))
    : [];

  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const compendiumItem = character.flags.ddbimporter.compendium;
  const addEffects = (compendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-effects")
    : game.settings.get("ddb-importer", "character-update-policy-add-item-effects");
  const generateArmorACEffect = (compendiumItem)
    ? game.settings.get("ddb-importer", "munching-policy-add-ac-armor-effects")
    : game.settings.get("ddb-importer", "character-update-policy-generate-ac-armor-effects");
  const autoAC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;

  for (let ddbItem of ddb.character.inventory.concat(customItems)) {
    const originalName = ddbItem.definition.name;
    ddbItem.definition.name = utils.getName(ddbItem, character);
    const flags = getItemFlags(ddb, ddbItem, character);

    const updateExisting = compendiumItem
      ? game.settings.get("ddb-importer", "munching-policy-update-existing")
      : false;
    ddbItem.definition.description = generateTable(ddbItem.definition.name, ddbItem.definition.description, updateExisting);

    let item = Object.assign({}, parseItem(ddb, ddbItem, character, flags));
    addCustomValues(ddbItem, item, character);
    enrichFlags(ddbItem, item);

    if (item) {
      item.flags.magicitems = parseMagicItem(ddbItem, itemSpells);
      item.flags.ddbimporter.originalName = originalName;
      if (!item.effects) item.effects = [];
      if (!item.name || item.name === "") item.name = "Item";

      if (daeInstalled && addEffects) item = generateEffects(ddb, character, ddbItem, item, compendiumItem, "item");
      // if this is a piece of armor and not generating effects don't generate ac
      if (item.type === "equipment" && item.data.armor?.type && !["trinket", "clothing"].includes(item.data.armor.type)) {
        if (daeInstalled && generateArmorACEffect) {
          item = generateBaseACItemEffect(ddb, character, ddbItem, item, compendiumItem);
        }
      } else if (autoAC || daeInstalled) {
        // always generate other item ac effects
        item = generateBaseACItemEffect(ddb, character, ddbItem, item, compendiumItem);
      }

      if (!compendiumItem) item = parseInfusion(ddb, character, item, ddbItem, compendiumItem);
      items.push(item);
    }
  }

  fixItems(items);
  return items;
}
