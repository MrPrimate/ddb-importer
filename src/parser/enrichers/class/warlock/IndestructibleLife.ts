import DDBEnricherData from "../../data/DDBEnricherData";

export default class IndestructibleLife extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "bonus",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          bonus: "@classes.warlock.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
