import DDBEnricherData from "../../data/DDBEnricherData";

export default class DefyDeath extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      activationType: "special",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 8,
          bonus: "max(1, @abilities.con.mod)",
          types: ["healing"],
        }),
      },
    };
  }

}
