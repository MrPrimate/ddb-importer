import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedWardingFlare extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
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
