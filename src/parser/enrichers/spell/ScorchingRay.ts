import DDBEnricherData from "../data/DDBEnricherData";

export default class ScorchingRay extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      parent: [{
        lookupName: "Circlet of Blasting",
        flatAttack: "5",
      }],
    };
  }

}
