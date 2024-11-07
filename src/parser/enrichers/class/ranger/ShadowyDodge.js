/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

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
