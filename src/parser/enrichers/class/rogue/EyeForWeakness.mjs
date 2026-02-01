/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EyeForWeakness extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Bonus Damage",
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 6,
              damageType: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
