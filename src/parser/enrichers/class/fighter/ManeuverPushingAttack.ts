import Maneuver from "./Maneuver";

export default class ManeuverPushingAttack extends Maneuver {

  get additionalActivities() {
    return [
      {
        init: {
          name: "Save vs Pushed",
          type: Maneuver.ACTIVITY_TYPES.SAVE,
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
    return ["Save vs Pushed"];
  }

}
