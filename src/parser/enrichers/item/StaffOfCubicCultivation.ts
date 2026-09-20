import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Each charge spent raises one 5-foot cube of gelatinous material for 1 minute, so the template
 * count follows the charges. The cubes are objects that can be climbed and walked on, and their
 * sticky surfaces are difficult terrain.
 */
export default class StaffOfCubicCultivation extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Create Cubes", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
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
            condition: "Each cube is an object with AC 10, 20 Hit Points and Resistance to Acid damage; its surfaces are difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "cube", size: "5", count: "@scaling" },
          },
          rangeOverride: { override: true, value: "5", units: "ft" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          addItemConsume: true,
          addScalingMode: "amount",
          addConsumptionScalingMax: "@item.uses.value",
          noeffect: true,
        },
      },
    ];
  }

}
