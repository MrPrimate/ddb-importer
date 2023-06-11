import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";
import { getDuration, getActionType, getDamage } from "./consumable.js";

export default function parsePotion(data, itemType) {
  let potion = {
    name: data.definition.name,
    type: "consumable",
    system: JSON.parse(utils.getTemplate("consumable")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  potion.system.consumableType = "potion";
  potion.system.uses = getConsumableUses(data);
  potion.system.description = getDescription(data);
  potion.system.source = DDBHelper.parseSource(data.definition);
  potion.system.quantity = getQuantity(data);
  potion.system.weight = getSingleItemWeight(data);
  potion.system.equipped = getEquipped(data);
  potion.system.rarity = getItemRarity(data);
  potion.system.identified = true;
  potion.system.activation = { type: "action", cost: 1, condition: "" };
  potion.system.duration = getDuration(data);
  potion.system.actionType = getActionType(data);
  potion.system.damage = getDamage(data, getActionType(data));

  return potion;
}
