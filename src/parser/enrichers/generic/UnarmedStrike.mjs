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
          generateDamage: false,
          damageParts: [],
        },
        overrides: {
          data: {
            save: {
              ability: ["str", "dex"],
              dc: {
                calculation: martialArtist ? "" : "str",
                formula: martialArtist ? "8 + max(@abilities.dex.mod, @abilities.str.mod) + @prof" : "",
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
          generateDamage: false,
          damageParts: [],
        },
        overrides: {
          data: {
            save: {
              ability: ["str", "dex"],
              dc: {
                calculation: martialArtist ? "" : "str",
                formula: martialArtist ? "8 + max(@abilities.dex.mod, @abilities.str.mod) + @prof" : "",
              },
            },
          },
        },
      },
    );
    return results;
  }

  get clearAutoEffects() {
    return true;
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
    if (this.ddbParser.isMartialArtist()) return null;

    const dazzlingFootwork = this.hasClassFeature({ featureName: "Dazzling Footwork", className: "Bard" });

    const formula = dazzlingFootwork
      ? "@scale.dance.dazzling-footwork + @abilities.dex.mod"
      : "1 + @abilities.str.mod";

    return {
      data: {
        system: {
          damage: {
            base: DDBEnricherData.basicDamagePart({
              customFormula: formula,
              type: "bludgeoning",
            }),
          },
        },
      },
    };
  }

}
