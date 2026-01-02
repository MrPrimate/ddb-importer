/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

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
        constructor: {
          name: "Place Additional Familiar",
          type: "forward",
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
