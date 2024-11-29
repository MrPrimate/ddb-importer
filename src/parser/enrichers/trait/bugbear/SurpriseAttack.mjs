/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SurpriseAttack extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      noTemplate: true,
      data: {
        "range.units": "spec",
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6 })],
        },
      },
    };
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return null;
  }

}
