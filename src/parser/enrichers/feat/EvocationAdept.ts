import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Fueled Evocation rolls up to two unexpended Hit Dice and adds
 * them to one damage roll of an Evocation spell. One activity per hit die size, the way the
 * official data does it: the scaling prompt (1 or 2) is both the dice count and the number of
 * hit dice spent, and the damage type is picked from the full list when rolled.
 */
export default class EvocationAdept extends DDBEnricherData {

  static ACTIVATION_CONDITION = "Once per turn when you cast an Evocation spell and deal damage: add the roll to one of its damage rolls";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  static hitDiceConsumption(size: "smallest" | "largest"): I5eConsumptionTarget[] {
    return [{ type: "hitDice", target: size, value: "1", scaling: { mode: "amount", formula: "" } }];
  }

  static hitDiceDamage(size: "smallest" | "largest"): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      customFormula: `(@scaling)d(@attributes.hd.${size}Face)`,
      types: DDBEnricherData.allDamageTypes(),
      scalingMode: "none",
    });
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fueled Evocation (Smallest Hit Die)",
      targetType: "creature",
      activationType: "special",
      activationCondition: EvocationAdept.ACTIVATION_CONDITION,
      noConsumeTargets: true,
      additionalConsumptionTargets: EvocationAdept.hitDiceConsumption("smallest"),
      addConsumptionScalingMax: "2",
      noTemplate: true,
      removeDamageParts: true,
      damageParts: [EvocationAdept.hitDiceDamage("smallest")],
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Fueled Evocation (Largest Hit Die)",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: EvocationAdept.ACTIVATION_CONDITION },
          damageParts: [EvocationAdept.hitDiceDamage("largest")],
          consumptionOverride: {
            scaling: { allowed: true, max: "2" },
            targets: EvocationAdept.hitDiceConsumption("largest"),
          },
        },
        overrides: {
          targetType: "creature",
          noTemplate: true,
        },
      },
    ];
  }

}
