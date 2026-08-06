import DDBEnricherData from "../../data/DDBEnricherData";

export default class RuinIncarnate extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get type() {
    if (this.isAction) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData | null {
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

  get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Ruin Incarnate",
        activityMatch: "Activate",
        options: {
          durationSeconds: 600,
          description: "You have Advantage on attack rolls against Bloodied creatures, you can attack twice when you take the Attack action, and your base AC becomes 17 plus your Wisdom modifier (disable this effect if your AC is already higher).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("custom", 10, "system.attributes.ac.calc"),
          DDBEnricherData.ChangeHelper.overrideChange("17 + max(1, @abilities.wis.mod)", 15, "system.attributes.ac.formula"),
        ],
      },
    ];
  }

}
