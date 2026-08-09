import Maneuver from "./Maneuver";

export default class ManeuverMenacingAttack extends Maneuver {
  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Menaced",
        statuses: ["Frightened"],
        activityMatch: "Save vs Frightened",
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

  override get ignoredConsumptionActivities(): string[] {
    return ["Save vs Frightened"];
  }

}
