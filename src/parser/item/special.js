// import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";

/**
 * Some items we need to fix up or massage because they are modified
 * in interesting ways
 * @param {*} ddb
 * @param {*} items
 */
export function fixItems(items) {
  return;
  // eslint-disable-next-line complexity
  items.forEach((item) => {
    const name = item.flags.ddbimporter?.originalName ?? item.name;
    switch (name) {
      case "Iron Bands of Binding":
        item.system.activation = { type: "action", cost: 1, condition: "" };
        // item.system.uses = { value: 1, max: "1", per: "day" };
        item.system.uses = {
          spent: 0,
          max: 1,
          recovery: [{
            period: "day",
            type: "recoverAll",
          }],
          autoDestroy: true,
          autoUse: true,
        };
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
        // item.system.uses = { value: 1, max: "1", per: "" };
        item.system.uses = {
          spent: 0,
          max: 1,
          // TODO: check this is correct
          recovery: [],
          autoDestroy: true,
          autoUse: true,
        };
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
      case "Canaith Mandolin": {
        foundry.utils.setProperty(item, "flags.magicitems.charges", "1");
        foundry.utils.setProperty(item, "flags.magicitems.chargeType", "c2");
        foundry.utils.setProperty(item, "flags.magicitems.recharge", "1");
        foundry.utils.setProperty(item, "flags.magicitems.rechargeType", "t1");
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
        // item.system.uses = { value: 10, max: "10", per: "charge" };
        item.system.uses = {
          spent: 0,
          max: 10,
          // TODO: check this is correct
          recovery: [],
          autoDestroy: true,
          autoUse: true,
        };
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
          item.system.uses = {
            spent: 0,
            max: 7,
            // TODO: check this is correct
            recovery: [{
              period: "lr",
              type: "formula",
              formula: "1d6 + 1",
            }],
          };
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
        item.system.uses.max = 7;
        break;
      }
      // no default
    }
  });
}
