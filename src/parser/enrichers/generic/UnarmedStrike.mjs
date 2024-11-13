/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class UnarmedStrike extends DDBEnricherMixin {

  get type() {
    return "attack";
  }

  get additionalActivities() {
    const martialArtist = this.hasClassFeature({ featureName: "Martial Arts", className: "Monk" });

    const results = martialArtist
      ? [{ duplicate: true, overrides: { name: "Attack (Bonus Action)", activationType: "bonus" } }]
      : [];
    results.push(
      {
        constructor: {
          name: "Grapple",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
        },
        overrides: {
          data: {
            save: {
              ability: ["str", "dex"],
              dc: {
                calculation: "str",
                formula: "",
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Shove",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
        },
        overrides: {
          data: {
            save: {
              ability: ["str", "dex"],
              dc: {
                calculation: "str",
                formula: "",
              },
            },
          },
        },
      },
    );
    return results;
  }

  get effects() {
    return [
      {
        name: "Grappled",
        statuses: ["Grappled"],
        activityMatch: "Grapple",
      },
      {
        name: "Prone",
        statuses: ["Prone"],
        activityMatch: "Shove",
      },
    ];
  }

}
