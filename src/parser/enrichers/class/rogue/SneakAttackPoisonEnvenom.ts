import DDBEnricherData from "../../data/DDBEnricherData";

export default class SneakAttackPoisonEnvenom extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Use Poison Option of Cunning Strike",
    };
  }

}
