import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Arcana Unleashed general feat. Prescient Intervention is a once-per-long-rest reaction whose use
 * comes back when a Divination spell is cast with a slot; the buy-back is its own activity.
 */
export default class DivinationAdept extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Prescient Intervention",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "When a creature you can see within 60 feet makes a D20 Test: give it Advantage or Disadvantage",
      addItemConsume: true,
      noTemplate: true,
      data: {
        range: { value: "60", units: "ft" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "After casting a Divination spell using a spell slot" },
        },
        overrides: {
          targetType: "self",
          addItemConsume: true,
          itemConsumeValue: "-1",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Prescient Intervention",
        max: "1",
        period: "lr",
      }),
    };
  }

}
