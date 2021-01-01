// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";

/**
 * Some items we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} items
 */
export function fixItems(items) {
  items.forEach((item) => {
    switch (item.name) {
      case "Potion of Healing":
        item.data.damage = { parts: [["2d4 + 2", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data['duration']['value'] = 0;
        item.data.actionType = "heal";
        item.data['target']['type'] = "creature";
        item.data['range']['type'] = "touch";
        break;
      case "Potion of Healing (Greater)":
      case "Potion of Greater Healing":
        item.data.damage = { parts: [["4d4 + 4", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data['duration']['value'] = 0;
        item.data.actionType = "heal";
        item.data['target']['type'] = "creature";
        item.data['range']['type'] = "touch";
        item.flags['ddbimporter']['dndbeyond']['alternativeNames'] = ['Potion of Greater Healing'];
        break;
      case "Potion of Healing (Superior)":
      case "Potion of Superior Healing":
        item.data.damage = { parts: [["8d4 + 8", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data['duration']['value'] = 0;
        item.data.actionType = "heal";
        item.data['target']['type'] = "creature";
        item.data['range']['type'] = "touch";
        item.flags['ddbimporter']['dndbeyond']['alternativeNames'] = ['Potion of Superior Healing', 'potion of superior healing'];
        break;
      case "Potion of Healing (Supreme)":
      case "Potion of Supreme Healing":
        item.data.damage = { parts: [["10d4 + 20", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data['duration']['value'] = 0;
        item.data.actionType = "heal";
        item.data['target']['type'] = "creature";
        item.data['range']['type'] = "touch";
        item.flags['ddbimporter']['dndbeyond']['alternativeNames'] = ['Potion of Supreme Healing'];
        break;
      // no default
    }
  });
}
