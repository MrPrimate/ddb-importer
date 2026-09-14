import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Plant Growth: the overgrowth option covers a 100-foot radius; the enrichment option is an 8-hour casting with no area.
 */
export default class PlantGrowth extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Overgrowth",
      data: {
        target: {
          template: { type: "sphere", size: "100", units: "ft", count: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Enrichment",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "hour",
            value: null,
            condition: "Cast over 8 hours to enrich the land within half a mile for a year",
          },
        },
        overrides: {
          noTemplate: true,
        },
      },
    ];
  }

}
