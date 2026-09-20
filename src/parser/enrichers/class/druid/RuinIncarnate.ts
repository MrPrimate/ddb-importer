import DDBEnricherData from "../../data/DDBEnricherData";

export default class RuinIncarnate extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    if (this.isAction) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.isAction) return null;
    return {
      name: "Activate",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
      data: {
        range: {
          units: "self",
        },
        duration: {
          value: "10",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Ruin Incarnate",
        activityMatch: "Activate",
        options: {
          durationSeconds: 600,
          description: "You have Advantage on attack rolls against Bloodied creatures, you can attack twice when you take the Attack action, and your base AC becomes 17 plus your Wisdom modifier (applied as a minimum AC).",
        },
        changes: [
          // a minimum, so an AC that is already higher is kept
          DDBEnricherData.ChangeHelper.upgradeChange("17 + max(1, @abilities.wis.mod)", 20, "system.attributes.ac.min"),
        ],
        // "against Bloodied creatures" is about the target; core roll data has no target, AC5e does
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("opponentActor.statuses.bloodied", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
