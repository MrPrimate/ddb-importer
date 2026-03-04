import DDBEnricherData from "../data/DDBEnricherData";

export default class UnarmedStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const martialArtist = this.hasClassFeature({ featureName: "Martial Arts", className: "Monk" });

    const results: IDDBAdditionalActivity[] = martialArtist
      ? [{ duplicate: true, overrides: { name: "Attack (Bonus Action)", activationType: "bonus" } }]
      : [];
    results.push(
      {
        init: {
          name: "Grapple",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
        init: {
          name: "Shove",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  get effects(): IDDBEffectHint[] {
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

  get override(): IDDBOverrideData {
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
