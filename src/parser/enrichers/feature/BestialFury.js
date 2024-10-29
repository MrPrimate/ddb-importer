/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class BestialFury extends DDBEnricherMixin {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        damage: {
          parts: DDBEnricherMixin.basicDamagePart({ number: 1, denomination: 6, types: ["force"] }),
        },
      },
    };
  }

}
