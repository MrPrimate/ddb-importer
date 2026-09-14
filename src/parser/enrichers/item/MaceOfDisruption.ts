import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Mace of Disruption: fiends and undead hit by the mace are Frightened until the end of your next turn on a failed DC 15 Wisdom save.
 */
export default class MaceOfDisruption extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Frighten",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "15" } },
          activationOverride: { type: "action", value: null, condition: "When you hit a Fiend or Undead" },
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frightened",
        activityMatch: "Frighten",
        statuses: ["Frightened"],
        data: {
          duration: {
            value: 6,
            expiry: "turnEnd",
            expired: null,
          },
        },
      },
    ];
  }

}
