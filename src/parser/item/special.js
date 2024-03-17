// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";

function prepItem(item) {
  if (item.name.startsWith("Potion of")) {
    if (!item.system.duration) item.system.duration = { units: "", value: null };
    if (!item.system.target) item.system.target = { value: null, width: null, units: "", type: "creature" };
    if (!item.system.range) item.system.range = { value: null, long: null, units: "", type: "touch" };
  } else if (item.name.startsWith("Vicious")) {
    foundry.utils.setProperty(item, "system.critical", { damage: "+ 7", threshold: null });
  }
}

/**
 * Some items we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} items
 */
export function fixItems(items) {
  // eslint-disable-next-line complexity
  items.forEach((item) => {
    prepItem(item);
    const name = item.flags.ddbimporter?.originalName ?? item.name;
    switch (name) {
      case "Waterskin":
        item.system.activation.type = "special";
        item.system.uses = { value: 4, max: 4, per: "charges", autoDestroy: false, autoUse: true };
        break;
      case "Potion of Healing":
        item.system.damage = { parts: [["2d4 + 2", "healing"]], versatile: "", value: "" };
        item.system.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.system["duration"]["value"] = 0;
        item.system.actionType = "heal";
        item.system["target"]["type"] = "creature";
        item.system["range"]["type"] = "touch";
        break;
      case "Potion of Healing (Greater)":
      case "Potion of Greater Healing":
        item.system.damage = { parts: [["4d4 + 4", "healing"]], versatile: "", value: "" };
        item.system.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.system["duration"]["value"] = 0;
        item.system.actionType = "heal";
        item.system["target"]["type"] = "creature";
        item.system["range"]["type"] = "touch";
        item.flags["ddbimporter"]["dndbeyond"]["alternativeNames"] = ["Potion of Greater Healing"];
        break;
      case "Potion of Healing (Superior)":
      case "Potion of Superior Healing":
        item.system.damage = { parts: [["8d4 + 8", "healing"]], versatile: "", value: "" };
        item.system.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.system["duration"]["value"] = 0;
        item.system.actionType = "heal";
        item.system["target"]["type"] = "creature";
        item.system["range"]["type"] = "touch";
        item.flags["ddbimporter"]["dndbeyond"]["alternativeNames"] = [
          "Potion of Superior Healing",
          "potion of superior healing",
        ];
        break;
      case "Potion of Healing (Supreme)":
      case "Potion of Supreme Healing":
        item.system.damage = { parts: [["10d4 + 20", "healing"]], versatile: "", value: "" };
        item.system.uses = { value: 1, max: 1, per: "charges", autoDestroy: true, autoUse: true };
        item.system["duration"]["value"] = 0;
        item.system.actionType = "heal";
        item.system["target"]["type"] = "creature";
        item.system["range"]["type"] = "touch";
        item.flags["ddbimporter"]["dndbeyond"]["alternativeNames"] = ["Potion of Supreme Healing"];
        break;
      case "Iron Bands of Binding":
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.uses = { value: 1, max: "1", per: "day" };
        item.system.range = { value: 60, long: null, units: "ft" };
        item.system.ability = "dex";
        item.system.actionType = "rwak";
        item.system.save = { ability: "str", dc: 20, scaling: "flat" };
        item.system.target = { value: 1, width: null, units: "any", type: "creature" };
        break;
      case "Far Realm Shard": {
        item.system.activation.type = "special";
        item.system.actionType = "save";
        item.system.damage = { parts: [["3d6[psychic]", "psychic"]], versatile: "", value: "" };
        item.system.save = {
          ability: "cha",
          dc: null,
          scaling: "spell",
        };
        break;
      }
      case "Acid (vial)": {
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.target = { value: 1, width: null, units: "any", type: "creature" };
        item.system.range = { value: 20, long: null, units: "ft" };
        item.system.ability = "dex";
        item.system.actionType = "rwak";
        item.system.chatFlavor = "improvised weapon";
        item.system.damage = { parts: [["2d6[acid]", "acid"]], versatile: "", value: "" };
        break;
      }
      case "Bead of Force": {
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.target = { value: 10, width: null, units: "ft", type: "radius" };
        item.system.range = { value: 60, long: null, units: "ft" };
        item.system.ability = "dex";
        item.system.duration = { units: "minute", value: 1 };
        item.system.uses = { value: 1, max: "1", per: "" };
        item.system.actionType = "rwak";
        item.system.chatFlavor = "improvised weapon";
        item.system.damage = { parts: [["5d4[force]", "force"]], versatile: "", value: "" };
        item.system.save = {
          ability: "dex",
          dc: 15,
          scaling: "flat",
        };
        break;
      }
      case "Alchemist's Fire (flask)":
      case "Alchemist's Fire": {
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.target = { value: 1, width: null, units: "any", type: "creature" };
        item.system.range = { value: 20, long: null, units: "ft" };
        item.system.ability = "dex";
        item.system.actionType = "rwak";
        item.system.chatFlavor = "improvised weapon";
        item.system.damage = { parts: [["1d4[fire]", "fire"]], versatile: "", value: "" };
        item.system.save = {
          ability: "dex",
          dc: 10,
          scaling: "flat",
        };
        break;
      }
      case "Bomb": {
        item.type = "consumable";
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.target = { value: 5, width: null, units: "ft", type: "radius" };
        item.system.range = { value: 60, long: null, units: "ft" };
        item.system.ability = "dex";
        item.system.actionType = "rwak";
        item.system.chatFlavor = "improvised weapon";
        item.system.damage = { parts: [["3d6[fire]", "fire"]], versatile: "", value: "" };
        item.system.save = {
          ability: "dex",
          dc: 12,
          scaling: "flat",
        };
        break;
      }
      case "Grenade, Fragmentation": {
        item.type = "consumable";
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.target = { value: 20, width: null, units: "ft", type: "radius" };
        item.system.range = { value: 60, long: null, units: "ft" };
        item.system.ability = "dex";
        item.system.actionType = "rwak";
        item.system.chatFlavor = "improvised weapon";
        item.system.damage = { parts: [["5d6[piercing]", "piercing"]], versatile: "", value: "" };
        item.system.save = {
          ability: "dex",
          dc: 15,
          scaling: "flat",
        };
        break;
      }
      case "Healer's Kit": {
        item.system.activation = { type: "action", cost: 1, condition: "" };
        item.system.target = { value: 1, width: null, units: "any", type: "creature" };
        item.system.range = { value: 20, long: null, units: "ft" };
        item.system.uses = { value: 10, max: "10", per: "charge" };
        foundry.utils.setProperty(item, "flags.ddbimporter.retainResourceConsumption", true);
        break;
      }
      case "Wand of Fireballs": {
        if (!game.modules.get("magicitems")?.active
          && !game.modules.get("magic-items-2")?.active
          && !game.modules.get("items-with-spells-5e")?.active
        ) {
          item.system.damage = { parts: [["8d6", "fire"]], versatile: "1d6", value: "" };
          item.system.save = {
            ability: "dex",
            dc: 15,
            scaling: "flat",
          };
          item.system.range = { value: 150, long: null, units: "ft" };
          item.system.target = { value: 20, width: null, units: "ft", type: "sphere" };
          item.system.uses.per = "charges";
        }
        break;
      }
      case "Wand of Magic Missiles": {
        if (!game.modules.get("magicitems")?.active
          && !game.modules.get("magic-items-2")?.active
          && !game.modules.get("items-with-spells-5e")?.active
        ) {
          item.system.damage = { parts: [["3d4 + 3", "force"]], versatile: "1d4 + 1", value: "" };
          item.system.range = { value: 120, long: null, units: "ft" };
        }
        break;
      }
      // no default
    }
  });
}
