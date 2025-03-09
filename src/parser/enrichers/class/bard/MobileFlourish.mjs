/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MobileFlourish extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Mobile Flourish: Damage Bonus",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.bardic-inspiration",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
