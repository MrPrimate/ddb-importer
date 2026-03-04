import DDBEnricherData from "../data/DDBEnricherData";

export default class EncourageAlly extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
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

  get effects(): IDDBEffectHint[] {
    return [];
  }
}
