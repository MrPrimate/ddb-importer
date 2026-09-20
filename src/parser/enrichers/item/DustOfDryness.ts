import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dust of Dryness: a pinch absorbs a 15-foot cube of water; on a water elemental it forces a DC 13 Constitution save against 10d6 necrotic damage.
 */
export default class DustOfDryness extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Sprinkle over Water",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          generateConsumption: true,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: {
            template: { type: "cube", size: "15", width: "", units: "ft", count: "" },
            affects: { count: "", type: "object", choice: false, special: "" },
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
