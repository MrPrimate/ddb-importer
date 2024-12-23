/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";

export default class ManeuverGoadingAttack extends Maneuver {

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Goading",
          type: "save",
        },
        build: {
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          data: {
            damage: {
              onSave: "none",
            },
            save: {
              ability: ["wis"],
              dc: {
                calculation: "",
                formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
              },
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Goaded",
        activityMatch: "Save vs Goading",
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

  get ignoredConsumptionActivities() {
    return ["Save vs Goading"];
  }

}
