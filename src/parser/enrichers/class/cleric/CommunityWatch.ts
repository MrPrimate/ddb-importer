import DDBEnricherData from "../../data/DDBEnricherData";

export default class CommunityWatch extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "ally",
      targetCount: "max(1, @abilities.wis.mod)",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Community Watch: Boon",
        options: {
          durationSeconds: 60,
          description: "Once per round, add 1d6 to a D20 Test while an ally is visible.",
        },
      },
    ];
  }

}
