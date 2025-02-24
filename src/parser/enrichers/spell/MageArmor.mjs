/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MageArmor extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("mage", 5, "system.attributes.ac.calc"),
        ],
        data: {
          img: "icons/equipment/chest/breastplate-helmet-metal.webp",
        },
      },
    ];
  }

}
