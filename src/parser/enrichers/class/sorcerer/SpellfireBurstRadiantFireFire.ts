import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellfireBurstRadiantFireFire extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
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
