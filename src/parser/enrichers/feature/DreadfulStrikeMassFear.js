/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class DreadfulStrikeMassFear extends DDBEnricherMixin {

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use the Dreadful Strike effect",
    };
  }

  get effect() {
    return {
      name: "Dreadful Strike: Fear",
      options: {
        durationSeconds: 6,
      },
      statuses: ["Frightened"],
    };
  }

}
