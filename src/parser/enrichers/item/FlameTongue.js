/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class FlameTongue extends DDBEnricherMixin {

  get activity() {
    return {
      additionalDamageIncludeBase: true,
    };
  }

}
