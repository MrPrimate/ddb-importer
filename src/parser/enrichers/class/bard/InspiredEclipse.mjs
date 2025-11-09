/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InspiredEclipse extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Give someone Bardic Inspiration",
    };
  }

  get effects() {
    return [
      {
        statuses: ["Invisible"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnStart", "1Attack", "1Spell"],
      },
    ];
  }

}
