import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Life Manipulation rolls up to two unexpended Hit Dice when a
 * Necromancy spell is cast with a slot and heals the caster for the total plus the slot level.
 * One activity per hit die size: the scaling prompt (1 or 2) is both the dice count and the hit
 * dice spent. The slot level is not known here and is left to the player
 */
export default class NecromancyAdept extends DDBEnricherData {

  static ACTIVATION_CONDITION = "When you cast a Necromancy spell using a spell slot; add the slot level to the total";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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

  static hitDiceHealing(size: "smallest" | "largest"): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      customFormula: `(@scaling)d(@attributes.hd.${size}Face)`,
      types: ["healing"],
      scalingMode: "none",
    });
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Life Manipulation (Smallest Hit Die)",
      targetType: "self",
      activationType: "special",
      activationCondition: NecromancyAdept.ACTIVATION_CONDITION,
      noConsumeTargets: true,
      additionalConsumptionTargets: NecromancyAdept.hitDiceConsumption("smallest"),
      addConsumptionScalingMax: "2",
      noTemplate: true,
      data: {
        healing: NecromancyAdept.hitDiceHealing("smallest"),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Life Manipulation (Largest Hit Die)",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: NecromancyAdept.ACTIVATION_CONDITION },
          healingPart: NecromancyAdept.hitDiceHealing("largest"),
          consumptionOverride: {
            scaling: { allowed: true, max: "2" },
            targets: NecromancyAdept.hitDiceConsumption("largest"),
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
