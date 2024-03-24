/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable require-atomic-updates */
// import DICTIONARY from "../dictionary.js";
// import SETTINGS from "../settings.js";

import utils from "../../lib/utils.js";
import logger from "../../logger.js";

export default class ChrisPremadesHelper {

  static DDB_FLAGS_TO_REMOVE = [
    "midi-qol",
    "midiProperties",
    "ActiveAuras",
    "dae",
    "itemacro",
  ];

  static CP_FLAGS_TO_REMOVE = [
    "cf",
    "ddbimporter",
    "monsterMunch",
    "core",
    "link-item-resource-5e",
  ];

  static CP_FIELDS_TO_COPY = [
    "effects",
    "system.damage",
    "system.target",
    "system.range",
    "system.duration",
    "system.save",
    "system.activation",
    "system.ability",
    "system.critical",
    "system.formula",
    "system.actionType",
  ];

  constructor(item) {

    this.item = item;

  }

  static async getChrisCompendiumIndex(compendiumName, matchedProperties = {}) {
    const gamePack = DDBImporter.lib.CompendiumHelper.getCompendium(compendiumName);
    const index = await gamePack.getIndex({
      fields: ["name", "type", "flags.cf", "folder"].concat(Object.keys(matchedProperties))
    });
    return index;
  }

  static async getChrisCompendiums(type, matchedProperties = {}) {
    if (chrisPremades.helpers.getSearchCompendiums) {
      const compendiums = await chrisPremades.helpers.getSearchCompendiums(type);
      const results = (await Promise.all(compendiums
        .filter((c) => game.packs.get(c))
        .map(async (c) => {
          const index = await ChrisPremadesHelper.getChrisCompendiumIndex(c, matchedProperties);
          const result = {
            index: index.filter((i) => i.type === type),
            packName: c,
            compendium: game.packs.get(c),
          };
          return result;
        }))).filter((r) => r.index.length > 0);
      return results;
    } else {
      return [];
    }
  }

  static getOriginalName(document) {
    const flagName = document.flags.ddbimporter?.originalName ?? document.name;

    const regex = /(.*)\s*\((:?costs \d actions|\d\/Turn|Recharges after a Short or Long Rest|\d\/day|recharge \d-\d)\)/i;
    const nameMatch = flagName.replace(/[–-–−]/g, "-").match(regex);
    if (nameMatch) {
      return nameMatch[1].trim();
    } else {
      return flagName;
    }
  }

  // matchedProperties = { "system.activation.type": "bonus" }
  static async getItemFromCompendium(key, name, ignoreNotFound, folderId, matchedProperties = {}) {
    const gamePack = game.packs.get(key);
    if (!gamePack) {
      ui.notifications.warn('Invalid compendium specified!');
      return false;
    }

    const packIndex = await gamePack.getIndex({
      fields: ['name', 'type', 'folder'].concat(Object.keys(matchedProperties))
    });

    const match = packIndex.find((item) =>
      item.name === name
      && (!folderId || (folderId && item.folder === folderId))
      && (Object.keys(matchedProperties).length === 0 || utils.matchProperties(item, matchedProperties))
    );

    if (match) {
      return (await gamePack.getDocument(match._id))?.toObject();
    } else {
      if (!ignoreNotFound) {
        ui.notifications.warn(`Item not found in compendium ${key} with name ${name}! Check spelling?`);
        logger.warn(`Item not found in compendium ${key} with name ${name}! Check spelling?`, { key, name, folderId, matchedProperties });
      }
      return undefined;
    }
  }


}
