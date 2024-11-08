/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class DefileGroundMoveCorruption extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Move Corruption",
    };
  }

}
