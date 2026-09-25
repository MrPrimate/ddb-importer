import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024 (with a DMAU reprint). After a failed concentration save, roll up to two unexpended Hit
 * Dice and add the total to the save. One activity per hit die size: the scaling prompt (1 or 2)
 * is both the dice count and the hit dice spent.
 */
export default class RingOfDedicatedFocus extends DDBEnricherData {

  static ACTIVATION_CONDITION = "After you fail a Constitution saving throw to maintain Concentration: add the roll to the save";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  static hitDiceConsumption(size: "smallest" | "largest"): I5eConsumptionTarget[] {
    return [{ type: "hitDice", target: size, value: "1", scaling: { mode: "amount", formula: "" } }];
  }

  static saveBonusRoll(size: "smallest" | "largest"): I5eActivityRoll {
    return { name: "Save Bonus", formula: `(@scaling)d(@attributes.hd.${size}Face)`, prompt: false, visible: true };
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dedicated Focus (Smallest Hit Die)",
      targetType: "self",
      activationType: "special",
      activationCondition: RingOfDedicatedFocus.ACTIVATION_CONDITION,
      noConsumeTargets: true,
      additionalConsumptionTargets: RingOfDedicatedFocus.hitDiceConsumption("smallest"),
      addConsumptionScalingMax: "2",
      noTemplate: true,
      data: {
        roll: RingOfDedicatedFocus.saveBonusRoll("smallest"),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Dedicated Focus (Largest Hit Die)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          generateRoll: true,
          activationOverride: { type: "special", value: null, condition: RingOfDedicatedFocus.ACTIVATION_CONDITION },
          rollOverride: RingOfDedicatedFocus.saveBonusRoll("largest"),
          consumptionOverride: {
            scaling: { allowed: true, max: "2" },
            targets: RingOfDedicatedFocus.hitDiceConsumption("largest"),
          },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
        },
      },
    ];
  }

}
