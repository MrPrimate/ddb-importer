import DDBEnricherData from "../data/DDBEnricherData";

export default class FlockOfFamiliars extends DDBEnricherData {

  get activity() {
    return {
      name: "Cast",
      id: "flockOfFamiliar1",
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Place Additional Familiar",
          type: DDBEnricherData.ACTIVITY_TYPES.FORWARD,
        },
        build: {
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
