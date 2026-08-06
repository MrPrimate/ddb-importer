import DDBEnricherData from "../../data/DDBEnricherData";

export default class BoxingLessons extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You take the Attack action; make two Unarmed Strikes",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        range: {
          value: 5,
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.road.travelers-tricks + @mod",
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

}
