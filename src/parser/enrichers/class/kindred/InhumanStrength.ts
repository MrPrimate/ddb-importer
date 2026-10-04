import DDBEnricherData from "../../data/DDBEnricherData";

/** Kindred (Inhuman Strength): a bonus action and 3 Blood Points add 1d10 force to melee weapon and Unarmed Strike hits for a minute. */
export default class InhumanStrength extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Powerful Blows",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: "3",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Powerful Blows",
        activityMatch: "Powerful Blows",
        options: { durationSeconds: 60, description: "Melee weapon and Unarmed Strike hits deal an extra 1d10 Force damage." },
        changes: [DDBEnricherData.ChangeHelper.unsignedAddChange("1d10[force]", 20, "system.rolls.damage.mwak.bonus")],
      },
    ];
  }

}
