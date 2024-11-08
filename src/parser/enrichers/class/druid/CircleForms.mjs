/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class CircleForms extends DDBEnricherMixin {

  get effects() {
    return [
      {
        name: "Circle Form AC",
        options: {
          description: "You gain a minimum AC of 13 + your Wisdom modifier.",
        },
        changes: [
          DDBEnricherMixin.generateUpgradeChange("13 + @abilities.wis.mod", 20, "system.attributes.ac.min"),
        ],
      },
    ];
  }

}


