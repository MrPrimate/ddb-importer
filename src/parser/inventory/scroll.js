import utils from "../../utils.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity } from "./common.js";


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

  scroll.data.consumableType = "scroll";
  scroll.data.uses = getConsumableUses(data);
  scroll.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };

  scroll.data.source = utils.parseSource(data.definition);
  scroll.data.quantity = getQuantity(data);
  scroll.data.weight = getSingleItemWeight(data);
  scroll.data.equipped = getEquipped(data);
  scroll.data.rarity = getItemRarity(data);
  scroll.data.identified = true;
  scroll.data.activation = { type: "action", cost: 1, condition: "" };
  scroll.data.actionType = "other";

  return scroll;
}
