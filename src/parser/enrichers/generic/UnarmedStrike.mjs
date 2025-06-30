/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class UnarmedStrike extends DDBEnricherData {

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

  get override() {
    return this.ddbParser.isMartialArtist()
      ? null
      : {
        data: {
          system: {
            damage: {
              base: DDBEnricherData.basicDamagePart({
                customFormula: "1 + @abilities.str.mod",
                type: "bludgeoning",
              }),
            },
          },
        },
      };
  }

}
