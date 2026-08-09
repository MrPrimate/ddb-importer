import Maneuver from "./Maneuver";

export default class ManeuverGoadingAttack extends Maneuver {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Save vs Goading",
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
        name: "Goaded",
        activityMatch: "Save vs Goading",
        daeSpecialDurations: ["turnEndSource" as const],
      },
    ];
  }

  override get ignoredConsumptionActivities(): string[] {
    return ["Save vs Goading"];
  }

}
