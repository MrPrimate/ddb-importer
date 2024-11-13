/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ScorchingRay extends DDBEnricherMixin {

  get activity() {
    return {
      parent: [{
        lookupName: "Circlet of Blasting",
        flatAttack: "5",
      }],
    };
  }

}
