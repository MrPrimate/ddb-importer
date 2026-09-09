import DDBEnricherData from "../data/DDBEnricherData";

export default class UnarmedStrike extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
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

  override get override(): IDDBOverrideData {
    const damageTypes = ["bludgeoning"];
    if (this.hasSpeciesTrait({ traitName: "Feral Pounce" })) {
      damageTypes.push("slashing");
    }
    const baseData: Record<string, any> = {
      system: {
        type: {
          value: "natural",
        },
      },
    };
    const base: IDDBOverrideData = {
      data: baseData,
    };
    if (this.ddbParser.isMartialArtist?.()) return base;

    const dazzlingFootwork = this.hasClassFeature({ featureName: "Dazzling Footwork", className: "Bard" });

    const formula = dazzlingFootwork
      ? "@scale.dance.dazzling-footwork + @abilities.dex.mod"
      : "1 + @abilities.str.mod";

    baseData.system.damage = {
      base: DDBEnricherData.basicDamagePart({
        customFormula: formula,
        types: damageTypes,
      }),
    };

    return base;
  }

}
