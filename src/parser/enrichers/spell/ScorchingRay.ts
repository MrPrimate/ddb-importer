import DDBEnricherData from "../data/DDBEnricherData";

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
