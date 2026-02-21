import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackPoisonEnvenom extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use Poison Option of Cunning Strike",
    };
  }

}
