import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: this._buildDamagePartsWithBase(),
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
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
