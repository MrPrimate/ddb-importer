import DDBEnricherData from "../../data/DDBEnricherData";

export default class CursedInvocation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Divine Power: Cursed Invocation",
      targetType: "creature",
      activationType: "bonus",
      data: { range: { value: "30", units: "ft" } },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed by Vestige",
        activityMatch: "Divine Power: Cursed Invocation",
        changes: [
          // the rule cannot single out the warlock and the vestige as targets
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
        ],
        options: {
          durationSeconds: 60,
          description: "Disadvantage on attack rolls against the warlock and the vestige.",
        },
      },
    ];
  }

}
