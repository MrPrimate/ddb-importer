/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class HurlThroughHell extends DDBEnricherMixin {

  get activity() {
    return {
      activationType: "special",
      activationCondition: "1/turn. You hit a creature with an attack roll.",
      data: {
        range: {
          units: "special",
        },
      },
    };
  }

  get effects() {
    return [{
      name: "Hurl Through Hell: Incapacitated",
      options: {
        durationSeconds: 12,
      },
      statuses: ["Incapacitated"],
    }];
  }

}
