import DDBEnricherData from "../../data/DDBEnricherData";

export default class ThrillOfTheHunt extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Damage bonus",
      noeffect: true,
      activationType: "special",
      activationCondition: "1/turn. Damage someone with your bite attack",
      damageParts: [
        DDBEnricherData.basicDamagePart({
          bonus: "@scale.the-predator.thrill-of-the-hunt",
          types: ["necrotic"],
        }),
      ],
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "sr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
    };
  }

}
