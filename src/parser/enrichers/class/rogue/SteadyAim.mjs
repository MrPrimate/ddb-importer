/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SteadyAim extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return false;
  }

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
        daeOnly: true,
        name: "Steady Aim Speed Reduction",
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("0", 100, "system.attributes.movement.all"),
        ],
        daeSpecialDurations: ["turnStartSource"],
        daeStackable: "noneName",
        options: {
          durationSeconds: 12,
          durationRounds: 2,
        },
      },
      {
        daeNever: true,
        name: "Steady Aim Speed Reduction",
        changes: [
          DDBEnricherData.ChangeHelper.customChange("0", 100, "system.attributes.movement.all"),
        ],
        options: {
          durationSeconds: 12,
          durationRounds: 2,
        },
      },
    ];
  }

}
