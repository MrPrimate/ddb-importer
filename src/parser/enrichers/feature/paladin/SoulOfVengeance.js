/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class SoulOfVengeance extends DDBEnricherMixin {

  get activity() {
    return {
      name: "Vengeance Attack",
      type: "utility",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature under your Vow of Enmity hits or misses with an attack roll",
    };
  }

}
