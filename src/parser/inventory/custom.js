import utils from "../../utils.js";
import { getItemRarity, getEquipped } from "./common.js";

export default function parseCustomItem(data) {
  let customItem = {
    name: data.definition.name,
    type: "loot",
    data: JSON.parse(utils.getTemplate("loot")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: "Custom Item",
        },
      },
    },
  };

  let description = data.definition.description ? data.definition.description : "";
  description = data.definition.notes
    ? description + `<p><blockquote>${data.definition.notes}</blockquote></p>`
    : description;

  customItem.data.description = {
    value: description,
    chat: description,
    unidentified: description,
  };

  customItem.data.source = "Custom item";

  customItem.data.quantity = data.definition.quantity ? data.definition.quantity : 1;

  let bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  let totalWeight = data.definition.weight ? data.definition.weight : 0;
  customItem.data.weight = totalWeight / bundleSize; // ;* (loot.data.quantity / bundleSize);
  customItem.data.price = data.definition.cost ? data.definition.cost : 0;
  customItem.data.equipped = getEquipped(data);
  customItem.data.identified = true;
  customItem.data.rarity = getItemRarity(data);

  return customItem;
}
