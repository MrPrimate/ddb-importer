import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedChosen extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "enemy",
      activationCondition: "An enemy within 30 ft attacks one of your allies",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Blessed Chosen: Disadvantage",
        options: {
          expiry: "turnEnd",
          description: "Disadvantage on the triggering attack roll. Without AC5e the effect lasts for every attack until the end of the turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
        ],
        // AC5e's once ends the effect after the one attack; the native expiry is the ceiling
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
        ],
      },
    ];
  }

}
