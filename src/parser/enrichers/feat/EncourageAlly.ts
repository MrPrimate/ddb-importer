import DDBEnricherData from "../data/DDBEnricherData";

export default class EncourageAlly extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "ally",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 6,
          bonus: "@mod",
          types: ["temphp"],
        }),
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [];
  }
}
