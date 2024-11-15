/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UseMagicDeviceCharges extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Charges",
      data: {
        roll: {
          prompt: false,
          visible: true,
          formula: "1d6",
          name: "Roll for expenditure check",
        },
      },
    };
  }

}
