import DDBEnricherData from "../../data/DDBEnricherData";

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

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Steady Aim Bonus",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
        // DAE and AC5e each end the effect after the one attack; the counted turn is the ceiling
        daeSpecialDurations: ["1Attack" as const],
        daeStackable: "noneName",
        options: {
          // "Advantage on your next attack roll on the current turn"
          durationTurns: 1,
          expiry: "turnEnd",
          description: "Advantage on your next attack roll this turn, applied by Midi-QOL or AC5e. Without DAE or AC5e the effect lasts for every attack until the end of the turn.",
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
