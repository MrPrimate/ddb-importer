import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Last Stand spends the feat's once-per-Long-Rest use. Recover Vitality is a separate pool of ten
 * d10s, so it is the activity's own uses, spent one die per scaling step.
 */
export default class BoonOfRecovery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Last Stand",
      activationType: "special",
      activationCondition: "You would be reduced to 0 Hit Points; you drop to 1 Hit Point instead",
      targetType: "self",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "1 + floor(@attributes.hp.max / 2)", types: ["healing"] }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Recover Vitality", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          activationOverride: { type: "bonus", value: null, condition: "" },
          generateConsumption: true,
          consumptionOverride: {
            targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "amount", formula: "1" } }],
            scaling: { allowed: true, max: "@activity.uses.value" },
          },
          generateUses: true,
          usesOverride: { spent: 0, max: "10", recovery: [{ period: "lr", type: "recoverAll", formula: "" }] },
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["healing"], scalingMode: "whole", scalingFormula: "1" }),
          generateTarget: true,
          targetOverride: { affects: { type: "self" } },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "feat", name: "Last Stand", max: "1", period: "lr" }),
    };
  }

}
