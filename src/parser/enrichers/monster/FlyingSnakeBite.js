/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class FlyingSnakeBite extends DDBEnricherMixin {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      data: {
        damage: {
          parts: this._buildDamagePartsWithBase(),
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "system.damage.base": {
          number: null,
          denomination: null,
          types: [],
          bonus: "",
        },
      },
    };
  }

}
