/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SteadyAim extends DDBEnricherData {

  get addAutoAdditionalActivities() {
    return true;
  }

  get effects() {
    if (!this.isAction) return [];
    return [
      {
        midiOnly: true,
        name: "Steady Aim Bonus",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        daeSpecialDurations: ["1Attack"],
        daeStackable: "noneName",
        options: {
          durationTurns: 1,
        },
      },
      {
        midiOnly: true,
        name: "Steady Aim Speed Reduction",
        midiChanges: [
          DDBEnricherData.ChangeHelper.downgradeChange("0", 100, "data.attributes.movement.all"),
        ],
        daeSpecialDurations: ["turnStartSource"],
        daeStackable: "noneName",
        options: {
          durationSeconds: 12,
          durationRounds: 2,
        },
      },
    ];
  }

}
