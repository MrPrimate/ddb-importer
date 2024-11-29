/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ImprovedWardingFlare extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 6,
          bonus: "@abilities.wis.mod",
          types: ["temphp"],
        }),
        range: {
          value: "60",
          units: "ft",
        },
      },
    };
  }
}
