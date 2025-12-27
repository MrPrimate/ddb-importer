/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class EncourageAlly extends DDBEnricherData {
  get type() {
    return "heal";
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

  get effects() {
    return [];
  }
}
