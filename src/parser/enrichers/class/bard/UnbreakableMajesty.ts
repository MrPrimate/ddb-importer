import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnbreakableMajesty extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        name: "Assume Unbreakable Majesty",
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Assume Unbreakable Majesty",
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "spec",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
            template: {
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "ft",
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Assume Unbreakable Majesty",
        max: "1",
        period: "sr",
      }),
    };
  }

}
