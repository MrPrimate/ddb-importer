import DDBEnricherData from "../data/DDBEnricherData";

export default class ScorchingRay extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      parent: [{
        lookupName: "Circlet of Blasting",
        flatAttack: "5",
      }],
    };
  }

}
