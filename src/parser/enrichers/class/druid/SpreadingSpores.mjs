/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpreadingSpores extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Cast",
      data: {
        target: {
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "cube",
            size: "10",
            units: "ft",
          },
          prompt: false,
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        action: {
          name: "Halo of Spores",
          type: "class",
          rename: ["Save vs Spore Damage"],
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "special",
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Within Spreading Spores",
      },
    ];
  }
}
