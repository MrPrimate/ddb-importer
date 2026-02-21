import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefileGroundMoveCorruption extends DDBEnricherData {

  get activity() {
    return {
      name: "Move Corruption",
    };
  }

}
