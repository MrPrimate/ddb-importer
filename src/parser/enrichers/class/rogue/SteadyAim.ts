import DDBEnricherData from "../../data/DDBEnricherData";

export default class SteadyAim extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
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
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 100),
        ],
        daeStackable: "noneName",
        options: {
          // "your Speed is 0 until the end of the current turn"
          expiry: "sourceEnd",
        },
      },
      {
        daeNever: true,
        name: "Steady Aim Speed Reduction",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 100),
        ],
        options: {
          durationSeconds: 12,
          durationRounds: 2,
        },
      },
    ];
  }

}
