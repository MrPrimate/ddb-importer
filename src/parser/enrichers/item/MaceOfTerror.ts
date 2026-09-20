import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Mace of Terror: Wave of Terror, a DC 15 Wisdom save in a 30-foot radius that frightens for 1 minute, drawn from the 3 charges.
 */
export default class MaceOfTerror extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Wave of Terror",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "", formula: "15" } },
          activationOverride: { type: "action", value: null, condition: "Spend 1 charge" },
          targetOverride: {
            template: { type: "radius", size: "30", width: "", units: "ft", count: "" },
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          addItemConsume: true,
        },
      },
    ];
  }

}
