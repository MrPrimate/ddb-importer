import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackSupremeSneak extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

}
