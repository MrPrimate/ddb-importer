/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class AcidArrow extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        "damage.parts": [
          DDBEnricherMixin.basicDamagePart({ number: 4, denomination: 4, type: "acid" }),
        ],
      },
    };
  }

}
