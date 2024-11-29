/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UnbreakableMajesty extends DDBEnricherData {

  get type() {
    return "utility";
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
        data: {
          "flags.ddbimporter.activityMatch": "Assume Unbreakable Majesty",
        },
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save",
          type: "save",
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
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "class",
          name: "Assume Unbreakable Majesty",
          max: "1",
          period: "sr",
        }),
      },
    };
  }

}
