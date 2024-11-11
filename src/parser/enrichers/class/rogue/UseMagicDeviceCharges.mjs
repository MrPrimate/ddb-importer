/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class UseMagicDeviceCharges extends DDBEnricherMixin {

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
