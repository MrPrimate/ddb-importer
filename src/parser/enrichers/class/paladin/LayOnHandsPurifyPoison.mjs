/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class LayOnHandsPurifyPoison extends DDBEnricherMixin {

  get activity() {
    return {
      type: "utility",
      addItemConsume: true,
      itemConsumeValue: "5",
    };
  }

}
