import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarChatter extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    // the same-named DDB action also loads this enricher and its effect is
    // cloned onto the trait with the activity - skip the trait-side copy
    if (!this.isAction) return [];
    return [
      {
        name: "War Chatter",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls until the start of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
        ],
      },
    ];
  }

}
