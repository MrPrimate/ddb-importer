/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GhostWalk extends DDBEnricherData {

  get activity() {
    return {
      name: "Activate",
    };
  }

  get effects() {
    return [
      {
        name: "Spectral Form",
        activityMatch: "Activate",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 2, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 2, "system.attributes.movement.hover"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
      },
    ];
  }

  get additionalActivities() {
    if (this.isAction) return [];
    return [
      {
        constructor: {
          name: "Spend Soul Trinket to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
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
              {
                type: "itemUses",
                value: "1",
                target: "Tokens of the Departed",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  // get useDefaultAdditionalActivities() {
  //   return true;
  // }

  // get addToDefaultAdditionalActivities() {
  //   return true;
  // }

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

}
