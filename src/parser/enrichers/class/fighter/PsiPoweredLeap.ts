import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsiPoweredLeap extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Psi-Powered Leap",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
    };
  }

}
