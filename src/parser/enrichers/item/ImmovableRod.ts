import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Immovable Rod: the DC 30 Strength (Athletics) check to move the fixed rod.
 */
export default class ImmovableRod extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attempt to Move",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          checkOverride: { ability: "", associated: ["ath"], dc: { calculation: "", formula: "30" } },
          activationOverride: { type: "action", value: null, condition: "Against the fixed rod" },
        },
        overrides: {
          rangeSelf: true,
        },
      },
    ];
  }

}
