import DDBEnricherData from "../../data/DDBEnricherData";

/** Harvest Domain Bountiful Harvest, Reaping: before the end of your next turn, each target's first damage to a creature adds your proficiency bonus as Necrotic. */
export default class ReapingBountifulHarvest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 6,
      targetChoice: true,
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "channel-divinity",
      data: {
        range: { override: true, value: "60", units: "ft" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Reaping Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["necrotic"] })],
          activationOverride: {
            type: "special",
            value: 1,
            condition: "A Reaping target first damages a creature before the end of your next turn",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bountiful Harvest: Reaping",
        activityMatch: "Reaping Bountiful Harvest",
        options: { durationSeconds: 12, description: "The first time the target damages a creature before the end of the cleric's next turn, it deals extra Necrotic damage equal to the cleric's Proficiency Bonus." },
      },
    ];
  }

}
