/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TelekineticThrust extends DDBEnricherData {

  get activity() {
    return {
      name: "Telekinetic Thrust",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        name: "Telekinetic Thrust: Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
