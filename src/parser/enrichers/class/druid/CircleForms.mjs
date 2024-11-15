/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CircleForms extends DDBEnricherData {

  get effects() {
    return [
      {
        name: "Circle Form AC",
        options: {
          description: "You gain a minimum AC of 13 + your Wisdom modifier.",
        },
        changes: [
          DDBEnricherData.generateUpgradeChange("13 + @abilities.wis.mod", 20, "system.attributes.ac.min"),
        ],
      },
    ];
  }

}


