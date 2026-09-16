import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Know Your Enemy. The 2024 printing is a bonus action with one use per long rest that can be
 * recharged by expending a Superiority Die. The 2014 printing is a one-minute study with no uses, so the DDB action (if any)
 * is left as the default activity there.
 */
export default class KnowYourEnemy extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return this.is2014;
  }

  override get type(): IDDBActivityType | null {
    return this.is2024 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : null;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2024) return null;
    return {
      name: "Discern Strengths and Weaknesses",
      activationType: "bonus",
      targetType: "creature",
      targetCount: 1,
      rangeType: "ft",
      rangeValue: 30,
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.is2024) return [];
    return [
      {
        init: {
          name: "Recharge with Superiority Die",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Expend one Superiority Die to regain the expended use",
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
          addItemConsume: true,
          itemConsumeTargetName: "Combat Superiority",
          itemConsumeValue: 1,
          additionalConsumptionTargets: [
            { type: "itemUses", target: "", value: "-1" },
          ],
        },
      },
    ];
  }

}
