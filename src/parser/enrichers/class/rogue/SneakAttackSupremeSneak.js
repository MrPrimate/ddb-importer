/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class SneakAttackSupremeSneak extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

}
