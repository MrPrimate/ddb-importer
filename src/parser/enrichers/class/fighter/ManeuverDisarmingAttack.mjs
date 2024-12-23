/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";
export default class ManeuverDisarmingAttack extends Maneuver {

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Save vs Disarmed",
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
              ability: ["str"],
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

  get ignoredConsumptionActivities() {
    return ["Save vs Disarmed"];
  }

}
