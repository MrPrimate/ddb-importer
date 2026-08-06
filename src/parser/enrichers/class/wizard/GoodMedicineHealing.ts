import DDBEnricherData from "../../data/DDBEnricherData";

export default class GoodMedicineHealing extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Good Medicine restores Hit Points to a creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 2,
          denomination: 8,
          types: ["healing"],
        }),
      },
    };
  }

}
