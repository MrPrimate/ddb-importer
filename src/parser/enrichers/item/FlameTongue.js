/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class FlameTongue extends DDBEnricherMixin {

  get activity() {
    return {
      additionalDamageIncludeBase: true,
    };
  }

}
