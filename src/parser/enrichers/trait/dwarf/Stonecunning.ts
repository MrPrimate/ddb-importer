import DDBEnricherData from "../../data/DDBEnricherData";

export default class Stonecunning extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stonecunning: Tremorsense",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.tremorsense"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.range", CONST.ACTIVE_EFFECT_MODES.ADD, 60, 5),
          DDBEnricherData.ChangeHelper.atlChange("ATL.sight.visionMode", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "tremorsense", 5),
        ],
      },
    ];
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  get override(): IDDBOverrideData {
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
