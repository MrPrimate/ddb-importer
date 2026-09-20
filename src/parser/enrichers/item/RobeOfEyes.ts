import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Robe of Eyes: darkvision and truesight to 120 feet while worn, and the Constitution saves against light and daylight spells.
 */
export default class RobeOfEyes extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Light Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "11" } },
          activationOverride: { type: "action", value: null, condition: "A Light spell cast within 5 feet" },
          targetOverride: {
            affects: { count: "", type: "self", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Daylight Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          activationOverride: { type: "action", value: null, condition: "A Daylight spell cast within 5 feet" },
          targetOverride: {
            affects: { count: "", type: "self", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

}
