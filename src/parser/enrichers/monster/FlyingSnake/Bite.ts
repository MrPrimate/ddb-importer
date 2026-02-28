import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bite extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
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
