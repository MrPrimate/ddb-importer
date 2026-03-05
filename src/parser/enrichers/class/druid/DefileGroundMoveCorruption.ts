import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefileGroundMoveCorruption extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Move Corruption",
    };
  }

}
