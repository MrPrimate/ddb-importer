import DDBEnricherData from "../data/DDBEnricherData";

export default class FlockOfFamiliars extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "flockOfFamiliar1",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Place Additional Familiar",
          type: DDBEnricherData.ACTIVITY_TYPES.FORWARD,
        },
        build: {
          noSpellslot: true,
        },
        overrides: {
          activationType: "special",
          data: {
            activity: {
              id: "flockOfFamiliar1",
            },
            uses: { spent: null, max: "" },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },
    ];
  }

}
