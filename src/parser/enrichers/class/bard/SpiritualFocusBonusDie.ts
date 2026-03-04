import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritualFocusBonusDie extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Bonus Damage",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Healing",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: false,
          generateHealing: true,
        },
        overrides: {
          noTemplate: true,
          activationType: "special",
          noConsumeTargets: true,
          data: {
            healing: DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              types: ["healing"],
            }),
          },
        },
      },
    ];
  }

}
