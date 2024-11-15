/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DreadfulStrikeMassFear extends DDBEnricherData {

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use the Dreadful Strike effect",
    };
  }

  get effects() {
    return [{
      name: "Dreadful Strike: Fear",
      options: {
        durationSeconds: 6,
      },
      statuses: ["Frightened"],
    }];
  }

}
