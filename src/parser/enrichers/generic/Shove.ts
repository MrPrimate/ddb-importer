import DDBEnricherData from "../data/DDBEnricherData";

export default class Shove extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
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

  get effects() {
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
      },
    ];
  }

}
