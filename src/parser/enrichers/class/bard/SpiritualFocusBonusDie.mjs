/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpiritualFocusBonusDie extends DDBEnricherData {

  get type() {
    return "damage";
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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Healing",
          type: "heal",
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
