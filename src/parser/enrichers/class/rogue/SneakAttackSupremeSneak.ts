import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackSupremeSneak extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "self",
      activationType: "special",
    };
  }

}
