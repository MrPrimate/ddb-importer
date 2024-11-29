/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Charger extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "enemy",
      data: {
        name: "Charge Damage",
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: DDBEnricherData.allDamageTypes() })],
        },
      },
    };
  }

}
