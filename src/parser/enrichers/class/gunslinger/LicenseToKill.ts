import DDBEnricherData from "../../data/DDBEnricherData";

export default class LicenseToKill extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You deal damage with a Ranged weapon (Risk Dice explode on their highest number)",
      addItemConsume: true,
      itemConsumeTargetName: "Risk",
      addScalingMode: "amount",
      addConsumptionScalingMax: "2",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "1@scale.gunslinger.risk.die",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

}
