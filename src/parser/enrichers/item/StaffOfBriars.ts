import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A charge covers a 20-foot square in briars. They are ordinary plants once grown, so the area is
 * permanent difficult terrain until someone clears it.
 */
export default class StaffOfBriars extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Sprout Briars", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "The briars are difficult terrain until cleared",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "square", size: "20" },
          },
          rangeOverride: { override: true, value: "5", units: "ft" },
          durationOverride: { override: true, units: "perm" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
        },
      },
    ];
  }

}
