/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpellfireBurstRadiantFireFire extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      noConsumeTargets: true,
      targetType: "creature",
      noeffect: true,
      activationType: "bonus",
      activationCondition: "Bonus action or when spending Sorcery Points in a Magic Action",
      data: {
        name: "Radiant Fire",
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `@scale.spellfire.spellfire-burst-damage-dice`,
              types: ["radiant", "fire"],
            }),
          ],
        },
      },
    };
  }

}
