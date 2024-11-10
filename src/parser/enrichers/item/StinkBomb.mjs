/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class StinkBomb extends DDBEnricherMixin {

  get activity() {
    return {
      targetType: "creature",
    };
  }

}
