import utils from "../../utils.js";
import { getItemRarity, getAttuned, getEquipped, getConsumableUses } from "./common.js";


export default function parseScroll(data) {
  let consumable = {
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

  consumable.data.consumableType = "scroll";
  consumable.data.uses = getConsumableUses(data);
  consumable.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };

  consumable.data.source = utils.parseSource(data.definition);
  consumable.data.quantity = data.quantity ? data.quantity : 1;

  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  consumable.data.weight = totalWeight / bundleSize;
  consumable.data.equipped = getEquipped(data);
  consumable.data.rarity = getItemRarity(data);
  consumable.data.identified = true;
  consumable.data.activation = { type: "action", cost: 1, condition: "" };
  consumable.data.actionType = "other";

  return consumable;
}
