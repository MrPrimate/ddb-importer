import DDBEnricherData from "../../data/DDBEnricherData";

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
