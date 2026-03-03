import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnbreakableMajesty extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      data: {
        name: "Assume Unbreakable Majesty",
      },
    };
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Assume Unbreakable Majesty",
      },
    ];
  }

  get additionalActivities() {
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
              value: "1",
              type: "creatures",
            },
            template: {
              contiguous: false,
              type: "",
              size: "",
              width: "",
              height: "",
              units: "",
            },
          },
        },
      },
    ];
  }

  get override() {
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
