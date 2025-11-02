/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DragonAncestor extends DDBEnricherData {

  get chosenType() {
    if (this.ddbParser.isMuncher) return null;
    const activeType = this.ddbParser._chosen?.find((a) =>
      utils.nameString(a.label).endsWith("Dragon"),
    )?.label.split("Dragon")[0].trim();

    return activeType;
  }


  get override() {
    const activeType = this.chosenType;
    const flags = {
      ddbimporter: {
        originalName: "Dragon Ancestor",
      },
    };
    const result = activeType
      ? { data: { name: `Dragon Ancestor (${utils.capitalize(activeType)})`, flags } }
      : { data: { name: "Dragon Ancestor", flags } };

    return result;
  }

}
