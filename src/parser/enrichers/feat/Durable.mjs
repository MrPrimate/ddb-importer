/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Durable extends DDBEnricherData {

  get additionalActivities() {
    return [
      { action: { name: "Speedy Recovery", type: "feat" } },
    ];
  }

}
