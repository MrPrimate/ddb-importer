import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Only one of the cantrip's three uses changes the map: turning a 5-foot cube of ground into
 * difficult terrain for 1 hour. It gets its own activity so the other two place no region.
 */
export default class MoldEarth extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Difficult Terrain", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          noSpellslot: true,
          durationOverride: { override: true, value: "1", units: "hour" },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { count: "1", contiguous: false, type: "cube", size: "5", units: "ft" },
          },
        },
        overrides: {
          data: {
            behaviors: [
              DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["rocks"] }),
            ],
          },
        },
      },
    ];
  }

}
