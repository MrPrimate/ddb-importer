/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class ScorchingRay extends DDBEnricherData {

  get activity() {
    return {
      parent: [{
        lookupName: "Circlet of Blasting",
        flatAttack: "5",
      }],
    };
  }

}
