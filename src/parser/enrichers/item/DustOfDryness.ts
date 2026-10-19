import DDBEnricherData from "../data/DDBEnricherData";
import { itemUses } from "./_ItemActivities";

/**
 * Dust of Dryness: a pinch absorbs a 15-foot cube of water; on a water elemental it forces a DC 13
 * Constitution save against 10d6 necrotic damage. The bag holds 1d6 + 4 pinches: as the official
 * data models it, 10 uses and a one-off roll that spends 1d6 - 1 of them.
 */
export default class DustOfDryness extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      ...itemUses(this, "10"),
      // the one-off pinch roll keeps its own spent use
      retainActivityUseSpent: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Determine Number of Pinches", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          activationOverride: { type: "special", value: null, condition: "Once, when the bag is found" },
          generateUses: true,
          usesOverride: { spent: 0, max: "1", recovery: [] },
          generateConsumption: true,
          consumptionOverride: {
            targets: [
              { type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } },
              { type: "itemUses", target: "", value: "1d6 - 1", scaling: { mode: "", formula: "" } },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
        overrides: { noTemplate: true, targetType: "self" },
      },
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
