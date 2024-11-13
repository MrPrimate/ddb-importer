/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ArcaneEye extends DDBEnricherMixin {

  get type() {
    return "summon";
  }

  get activity() {
    return {
      noTemplate: true,
      profileKeys: ["ArcaneEye"],
    };
  }

}
