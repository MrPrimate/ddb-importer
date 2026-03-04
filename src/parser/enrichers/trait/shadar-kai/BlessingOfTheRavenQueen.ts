import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessingOfTheRavenQueen extends DDBEnricherData {

  get activity() {
    return {
      name: "Teleport",
      targetSelf: true,
      data: {
        range: {
          value: 60,
          long: null,
          units: "ft",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blessing of the Raven Queen: Resistance",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.dr.all"),
        ],
        durationSeconds: 6,
        daeSpecialDurations: ["turnStartSource" as const],
      },
    ];
  }

}
