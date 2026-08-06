import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefendThePack extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "creature",
      activationCondition: "A creature attacks an ally within 30 feet of you",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
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
        name: "Prone",
        options: {
          description: "The target has the Prone condition.",
        },
        statuses: ["Prone"],
      },
    ];
  }

}
