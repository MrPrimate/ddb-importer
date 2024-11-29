/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FleetStep extends DDBEnricherData {

  get additionalActivities() {
    return [
      { action: { name: "Step of the Wind: Fleet Step", type: "class" } },
    ];
  }

}
