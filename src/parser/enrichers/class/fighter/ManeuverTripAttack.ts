import Maneuver from "./Maneuver";

export default class ManeuverTripAttack extends Maneuver {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Trip",
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Tripped",
        activityMatch: "Save vs Trip",
        statuses: ["Prone"],
      },
    ];
  }

  get ignoredConsumptionActivities() {
    return ["Save vs Trip"];
  }

}
