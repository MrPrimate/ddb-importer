import utils from "../../utils.js";
import { getItemRarity, getEquipped, getSingleItemWeight, getQuantity } from "./common.js";

export default function parseCustomItem(data) {
  let customItem = {
    name: data.definition.name,
    type: "loot",
    system: JSON.parse(utils.getTemplate("loot")),
    flags: {
      ddbimporter: {
        id: data.id,
        custom: true,
        dndbeyond: {
          type: "Custom Item",
        },
      },
    },
  };

  let description = data.definition.description && data.definition.description !== "null"
    ? data.definition.description
    : "";
  description = data.definition.notes
    ? description + `<p><blockquote>${data.definition.notes}</blockquote></p>`
    : description;

  const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
  customItem.system.description = {
    value: description,
    chat: chatAdd ? description : "",
    unidentified: description,
  };

  customItem.system.source = "Custom item";
  customItem.system.quantity = getQuantity(data);
  customItem.system.weight = getSingleItemWeight(data);
  customItem.system.price = data.definition.cost ? data.definition.cost : 0;
  customItem.system.equipped = getEquipped(data);
  customItem.system.identified = true;
  customItem.system.rarity = getItemRarity(data);

  return customItem;
}
