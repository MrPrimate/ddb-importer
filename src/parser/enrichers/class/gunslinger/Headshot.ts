import DDBEnricherData from "../../data/DDBEnricherData";

export default class Headshot extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Headshot Damage",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You score a Critical Hit with a Ranged weapon (target with less than 100 HP dies instead)",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 10,
              denomination: 10,
              types: ["bludgeoning", "piercing", "slashing"],
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
          name: "Regain Use (3 Risk Dice)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "No action required",
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Risk",
          itemConsumeValue: "3",
          additionalConsumptionTargets: [
            {
              type: "itemUses",
              target: "",
              value: "-1",
              scaling: { mode: "", formula: "" },
            },
          ],
        },
      },
    ];
  }

}
