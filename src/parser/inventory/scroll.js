import utils from "../../utils.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";


export default function parseScroll(data) {
  let scroll = {
    name: data.definition.name,
    type: "consumable",
    data: JSON.parse(utils.getTemplate("consumable")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  scroll.system.consumableType = "scroll";
  scroll.system.uses = getConsumableUses(data);
  scroll.system.description = getDescription(data);
  scroll.system.source = utils.parseSource(data.definition);
  scroll.system.quantity = getQuantity(data);
  scroll.system.weight = getSingleItemWeight(data);
  scroll.system.equipped = getEquipped(data);
  scroll.system.rarity = getItemRarity(data);
  scroll.system.identified = true;
  scroll.system.activation = { type: "action", cost: 1, condition: "" };
  scroll.system.actionType = "other";

  return scroll;
}
