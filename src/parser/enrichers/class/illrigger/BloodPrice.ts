import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodPrice extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Blood Price",
      activationType: "special",
      activationCondition: "When you fail a saving throw; add the roll to the save",
      targetType: "self",
      rangeSelf: true,
      data: {
        roll: {
          name: "Hit Die",
          formula: "1d10",
          prompt: false,
          visible: true,
        },
      },
    };
  }

}
