import DDBEnricherData from "../../data/DDBEnricherData";

export default class InvigoratingFeast extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      targetType: "creature",
      targetCount: "7",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2d6 + 10",
          types: ["temphp"],
        }),
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

}
