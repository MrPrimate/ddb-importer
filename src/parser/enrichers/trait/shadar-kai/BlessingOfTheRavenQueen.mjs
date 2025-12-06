/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

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

  get effects() {
    return [
      {
        name: "Blessing of the Raven Queen: Resistance",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "system.traits.dr.all"),
        ],
        durationSeconds: 6,
        daeSpecialDurations: ["turnStartSource"],
      },
    ];
  }

}
