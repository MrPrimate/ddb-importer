/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SorceryPoints extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Font of Magic", type: "class" } },
    ];

  }

  get override() {
    return {
      data: {
        system: {
          uses: {
            max: "@scale.sorcerer.points",
          },
        },
      },
    };
  }

}
