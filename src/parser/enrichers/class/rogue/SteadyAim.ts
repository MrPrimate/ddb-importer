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
        name: "Steady Aim Bonus",
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
        // DAE and AC5e each end the effect after the one attack; the native expiry is the ceiling
        daeSpecialDurations: ["1Attack"],
        daeStackable: "noneName",
        options: {
          // "Advantage on your next attack roll on the current turn"
          expiry: "turnEnd",
          description: "Advantage on your next attack roll this turn. Without DAE or AC5e the effect lasts for every attack until the end of the turn.",
        },
      },
      {
        name: "Steady Aim Speed Reduction",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 100),
        ],
        daeStackable: "noneName",
        options: {
          // "your Speed is 0 until the end of the current turn"
          expiry: "turnEnd",
        },
      },
    ];
  }

}
