/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class TelekineticMovement extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Telekinetic Movement",
      targetType: "creature",
      addItemConsume: true,
      addSingleFreeUse: true,
      addSingleFreeRecoveryPeriod: "sr",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

}
