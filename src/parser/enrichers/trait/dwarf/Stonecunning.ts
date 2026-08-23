import DDBEnricherData from "../../data/DDBEnricherData";

export default class Stonecunning extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Tremorsense",
      targetType: "self",
      addItemConsume: true,
      data: {
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stonecunning: Tremorsense",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.ranges.tremorsense"),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "race",
        name: "Stonecunning (Tremorsense)",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
