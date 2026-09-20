import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Quarterstaff of the Acrobat: the once-per-short-rest reaction to deflect an attack.
 */
export default class QuarterstaffOfTheAcrobat extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack Deflection",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          generateConsumption: true,
          activationOverride: { type: "reaction", value: null, condition: "When you are hit by an attack roll while holding the staff, gain +5 AC against it" },
          targetOverride: {
            affects: { count: "", type: "self", choice: false, special: "" },
          },
        },
        overrides: {
          rangeSelf: true,
          noTemplate: true,
          addItemConsume: true,
        },
      },
    ];
  }

}
