import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteadyAim extends DDBEnricherData {

  override get useDefaultAdditionalActivities() {
    return true;
  }

  override get addToDefaultAdditionalActivities() {
    return false;
  }

  override get addAutoAdditionalActivities() {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        midiOnly: true,
        name: "Steady Aim Bonus",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.advantage.attack.all"),
        ],
        daeSpecialDurations: ["1Attack" as const],
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
