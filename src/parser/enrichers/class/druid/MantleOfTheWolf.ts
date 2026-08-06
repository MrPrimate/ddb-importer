import DDBEnricherData from "../../data/DDBEnricherData";

export default class MantleOfTheWolf extends DDBEnricherData {

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
      name: "Manifest Mantle",
      targetType: "self",
      activationType: "action",
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
        name: "Mantle of the Wolf",
        activityMatch: "Manifest Mantle",
        options: {
          durationSeconds: 600,
          description: "You add your Wisdom modifier to Strength (Athletics) checks and Strength saving throws, and can replace one melee attack with a spectral bite attack.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(1, @abilities.wis.mod)", 20, "system.abilities.str.bonuses.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("max(1, @abilities.wis.mod)", 20, "system.skills.ath.bonuses.check"),
        ],
      },
    ];
  }

}
