import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellfireBurstBolsteringFlames extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
