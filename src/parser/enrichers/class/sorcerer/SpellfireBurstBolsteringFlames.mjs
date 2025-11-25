/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpellfireBurstBolsteringFlames extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      noConsumeTargets: true,
      noeffect: true,
      activationType: "bonus",
      activationCondition: "Bonus action or when spending Sorcery Points in a Magic Action",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 4,
          bonus: "@abilities.cha.mod + @scale.spellfire.spellfire-burst",
          types: ["temphp"],
        }),
      },
    };
  }

}
