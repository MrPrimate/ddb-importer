import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";


export default function parseScroll(data) {
  let scroll = {
    _id: foundry.utils.randomID(),
    name: data.definition.name,
    type: "consumable",
    system: utils.getTemplate("consumable"),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  scroll.system.type.value = "scroll";
  scroll.system.uses = getConsumableUses(data);
  scroll.system.description = getDescription(data);
  scroll.system.source = DDBHelper.parseSource(data.definition);
  scroll.system.quantity = getQuantity(data);
  scroll.system.weight = getSingleItemWeight(data);
  scroll.system.equipped = getEquipped(data);
  scroll.system.rarity = getItemRarity(data);
  scroll.system.identified = true;
  scroll.system.activation = { type: "action", cost: 1, condition: "" };
  scroll.system.actionType = "other";

  return scroll;
}
