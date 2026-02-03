/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WardingManeuver extends DDBEnricherData {

  get activity() {
    return {
      name: "Warding Maneuver",
      activationType: "reaction",
      addItemConsume: true,
      data: {
        roll: {
          formula: "1d8",
          name: "AC Bonus Roll",
        },
      },

    };
  }

}
