import DDBEnricherData from "../data/DDBEnricherData";

export default class Grapple extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    const martialArtist = this.hasClassFeature({ featureName: "Martial Arts", className: "Monk" });

    return {
      removeDamageParts: true,
      damageParts: [],
      data: {
        save: {
          ability: ["str", "dex"],
          dc: {
            calculation: martialArtist ? "" : "str",
            formula: martialArtist ? "8 + max(@abilities.dex.mod, @abilities.str.mod) + @prof" : "",
          },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappled",
        statuses: ["Grappled"],
      },
    ];
  }

}
