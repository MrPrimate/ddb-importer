/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class Bite extends DDBEnricherMixin {

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
