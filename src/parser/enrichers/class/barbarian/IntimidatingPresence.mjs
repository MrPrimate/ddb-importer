/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class IntimidatingPresence extends DDBEnricherData {

  get activity() {
    return {
      // type: "save",
      targetType: "creature",
      data: {
        name: "Save",
        save: {
          ability: ["wis"],
          dc: {
            calculation: "str",
            formula: "",
          },
        },
        target: {
          affects: {
            type: "enemy",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "30",
            width: "",
            height: "",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Restore With Rage Use",
          type: "utility",
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter": {
          ignoredConsumptionActivities: ["Save"],
          retainOriginalConsumption: true,
          retainChildUses: true,
        },
      },
    };
  }

}
