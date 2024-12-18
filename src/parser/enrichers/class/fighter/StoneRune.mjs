/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StoneRune extends DDBEnricherData {

  get additionalActivities() {
    if (this.isAction) return [];
    return [
      {
        action: {
          name: "Stone Rune",
          type: "class",
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Stone Rune: Passive Bonuses",
        options: {
          transfer: true,
          description: "You have advantage on Wisdom (Insight) checks",
        },

      },
    ];
  }


  // get clearAutoEffects() {
  //   return true;
  // }

}
