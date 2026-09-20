import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Slamming the maul down turns a circle into swamp for 1 minute: 5 feet of radius for the first
 * charge and 5 more for each extra charge, so the template size follows the charges spent. The
 * swamp is difficult terrain for everyone but the wielder, which is left to the table.
 */
export default class QuagmireMaul extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Slam: Create Swamp", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
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
            condition: "The swamp is difficult terrain; the wielder crosses it as normal terrain while holding the maul",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "circle", size: "5 * @scaling" },
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
