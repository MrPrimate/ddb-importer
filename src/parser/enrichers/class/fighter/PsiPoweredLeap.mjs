/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsiPoweredLeap extends DDBEnricherData {

  get activity() {
    return {
      name: "Psi-Powered Leap",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
    };
  }

}
