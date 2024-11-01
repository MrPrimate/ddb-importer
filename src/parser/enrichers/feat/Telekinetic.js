/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Telekinetic extends DDBEnricherMixin {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {
    return [
      { action: { name: "Telekinetic Shove", type: "feat", rename: ["Shove"] } },
    ];
  }

}
