import DDBEnricherData from "../../data/DDBEnricherData";

export default class ClubbedTail extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Replace one of your attacks",
      data: {
        attack: {
          ability: "str",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          includeBase: false,
          parts: [
            DDBEnricherData.basicDamagePart({
              // +proficiency bonus from level 10
              customFormula: "1d6 + @mod + (@details.level >= 10 ? @prof : 0)",
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

}
