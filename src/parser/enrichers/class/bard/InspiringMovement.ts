import DDBEnricherData from "../../data/DDBEnricherData";

export default class InspiringMovement extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
    };
  }

}
