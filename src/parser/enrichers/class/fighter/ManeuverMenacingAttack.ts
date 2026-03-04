import Maneuver from "./Maneuver";

export default class ManeuverMenacingAttack extends Maneuver {
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Frightened",
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
              onSave: "full",
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
        name: "Menaced",
        statuses: ["Frightened"],
        activityMatch: "Save vs Frightened",
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

  get ignoredConsumptionActivities() {
    return ["Save vs Frightened"];
  }

}
