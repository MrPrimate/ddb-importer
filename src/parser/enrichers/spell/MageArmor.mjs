/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class MageArmor extends DDBEnricherData {

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.generateOverrideChange("mage", 5, "system.attributes.ac.calc"),
        ],
      },
    ];
  }

}
