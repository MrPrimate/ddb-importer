import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Grave Domain. 2014: an action that makes the target vulnerable to the next damage it takes.
 * 2024: a bonus action curse giving Disadvantage on attack rolls and saves until the start of
 * your next turn. Both spend a Channel Divinity use.
 */
export default class ChannelDivinityPathToTheGrave extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Path to the Grave",
      activationType: this.is2014 ? "action" : "bonus",
      targetType: "creature",
      rangeType: "ft",
      rangeValue: 30,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return this.is2014 ? [
      {
        name: "Cursed",
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["isDamaged"],
        changes: DDBEnricherData.allDamageTypes().map((damageType) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(damageType, 200, "system.traits.dv.value"),
        ),
      },
    ] : [
      {
        name: "Cursed",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls and saving throws until the start of the cleric's next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("attack"),
          DDBEnricherData.ChangeHelper.ruleDisadvantageChange("save"),
        ],
      },
    ];
  }

}
