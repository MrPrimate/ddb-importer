import DDBEnricherData from "../../data/DDBEnricherData";

export default class WardingManeuver extends DDBEnricherData {

  get activity(): IDDBActivityData {
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
