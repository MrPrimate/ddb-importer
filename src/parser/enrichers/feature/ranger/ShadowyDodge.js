/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class ShadowyDodge extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      activationType: "reaction",
      targetType: "self",
    };
  }


}
