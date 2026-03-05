import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackPoisonEnvenom extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use Poison Option of Cunning Strike",
    };
  }

}
