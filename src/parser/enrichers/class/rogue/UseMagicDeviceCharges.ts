import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDeviceCharges extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
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
