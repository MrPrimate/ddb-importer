/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DefileGroundMoveCorruption extends DDBEnricherData {

  get activity() {
    return {
      name: "Move Corruption",
    };
  }

}
