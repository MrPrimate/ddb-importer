/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class SneakAttackPoisonEnvenom extends DDBEnricherMixin {

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
