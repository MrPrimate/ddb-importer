/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SoulOfVengeance extends DDBEnricherData {

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
