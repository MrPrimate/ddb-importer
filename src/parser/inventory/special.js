// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";

function prepItem(item) {
  if (item.name.startsWith("Potion of")) {
    if (!item.data.duration) item.data.duration = { units: "", value: null };
    if (!item.data.target) item.data.target = { value: null, width: null, units: "", type: "creature" };
    if (!item.data.range) item.data.range = { value: null, long: null, units: "", type: "touch" };
  }
}

/**
 * Some items we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} items
 */
export function fixItems(items) {
  items.forEach((item) => {
    prepItem(item);
    switch (item.name) {
      case "Potion of Healing":
        item.data.damage = { parts: [["2d4 + 2", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data["duration"]["value"] = 0;
        item.data.actionType = "heal";
        item.data["target"]["type"] = "creature";
        item.data["range"]["type"] = "touch";
        break;
      case "Potion of Healing (Greater)":
      case "Potion of Greater Healing":
        item.data.damage = { parts: [["4d4 + 4", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data["duration"]["value"] = 0;
        item.data.actionType = "heal";
        item.data["target"]["type"] = "creature";
        item.data["range"]["type"] = "touch";
        item.flags["ddbimporter"]["dndbeyond"]["alternativeNames"] = ["Potion of Greater Healing"];
        break;
      case "Potion of Healing (Superior)":
      case "Potion of Superior Healing":
        item.data.damage = { parts: [["8d4 + 8", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data["duration"]["value"] = 0;
        item.data.actionType = "heal";
        item.data["target"]["type"] = "creature";
        item.data["range"]["type"] = "touch";
        item.flags["ddbimporter"]["dndbeyond"]["alternativeNames"] = [
          "Potion of Superior Healing",
          "potion of superior healing",
        ];
        break;
      case "Potion of Healing (Supreme)":
      case "Potion of Supreme Healing":
        item.data.damage = { parts: [["10d4 + 20", "healing"]], versatile: "", value: "" };
        item.data.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.data["duration"]["value"] = 0;
        item.data.actionType = "heal";
        item.data["target"]["type"] = "creature";
        item.data["range"]["type"] = "touch";
        item.flags["ddbimporter"]["dndbeyond"]["alternativeNames"] = ["Potion of Supreme Healing"];
        break;
      case "Iron Bands of Binding":
        item.data.activation = { type: "action", cost: 1, condition: "" };
        item.data.uses = { value: 1, max: "1", per: "day" };
        item.data.range = { value: 60, long: null, units: "ft" };
        item.data.ability = "dex";
        item.data.actionType = "rwak";
        item.data.save = { ability: "str", dc: 20, scaling: "flat" };
        item.data.target = { value: 1, width: null, units: "any", type: "creature" };
        break;
      case "Far Realm Shard": {
        item.data.activation.type = "special";
        item.data.actionType = "save";
        item.data.damage = { parts: [["3d6[psychic]", "psychic"]], versatile: "", value: "" };
        item.data.save = {
          ability: "cha",
          dc: null,
          scaling: "spell",
        };
        break;
      }
      case "Acid (vial)": {
        item.data.activation = { type: "action", cost: 1, condition: "" };
        item.data.target = { value: 1, width: null, units: "any", type: "creature" };
        item.data.range = { value: 20, long: null, units: "ft" };
        item.data.ability = "dex";
        item.data.actionType = "rwak";
        item.data.chatFlavor = "improvised weapon";
        item.data.damage = { parts: [["2d6[acid]", "acid"]], versatile: "", value: "" };
        break;
      }
      case "Bead of Force": {
        item.data.activation = { type: "action", cost: 1, condition: "" };
        item.data.target = { value: 10, width: null, units: "ft", type: "radius" };
        item.data.range = { value: 60, long: null, units: "ft" };
        item.data.ability = "dex";
        item.data.duration = { units: "minute", value: 1 };
        item.data.uses = { value: 1, max: "1", per: "" };
        item.data.actionType = "rwak";
        item.data.chatFlavor = "improvised weapon";
        item.data.damage = { parts: [["5d4[force]", "force"]], versatile: "", value: "" };
        item.data.save = {
          ability: "dex",
          dc: 15,
          scaling: "flat",
        };
        break;
      }
      case "Alchemist's Fire (flask)":
      case "Alchemist's Fire": {
        item.data.activation = { type: "action", cost: 1, condition: "" };
        item.data.target = { value: 1, width: null, units: "any", type: "creature" };
        item.data.range = { value: 20, long: null, units: "ft" };
        item.data.ability = "dex";
        item.data.actionType = "rwak";
        item.data.chatFlavor = "improvised weapon";
        item.data.damage = { parts: [["1d4[fire]", "fire"]], versatile: "", value: "" };
        item.data.save = {
          ability: "dex",
          dc: 10,
          scaling: "flat",
        };
        break;
      }
      case "Bomb": {
        item.type = "consumable";
        item.data.activation = { type: "action", cost: 1, condition: "" };
        item.data.target = { value: 5, width: null, units: "ft", type: "radius" };
        item.data.range = { value: 60, long: null, units: "ft" };
        item.data.ability = "dex";
        item.data.actionType = "rwak";
        item.data.chatFlavor = "improvised weapon";
        item.data.damage = { parts: [["3d6[fire]", "fire"]], versatile: "", value: "" };
        item.data.save = {
          ability: "dex",
          dc: 12,
          scaling: "flat",
        };
        break;
      }
      case "Grenade, Fragmentation": {
        item.type = "consumable";
        item.data.activation = { type: "action", cost: 1, condition: "" };
        item.data.target = { value: 20, width: null, units: "ft", type: "radius" };
        item.data.range = { value: 60, long: null, units: "ft" };
        item.data.ability = "dex";
        item.data.actionType = "rwak";
        item.data.chatFlavor = "improvised weapon";
        item.data.damage = { parts: [["5d6[piercing]", "piercing"]], versatile: "", value: "" };
        item.data.save = {
          ability: "dex",
          dc: 15,
          scaling: "flat",
        };
        break;
      }
      // no default
    }
  });
}
