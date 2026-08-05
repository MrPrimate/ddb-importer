import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodPotencyHungerSated extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "You fail a D20 Test affected by your Beast feature",
    };
  }

}
