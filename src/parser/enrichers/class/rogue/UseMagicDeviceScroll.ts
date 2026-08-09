import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDeviceScroll extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Scroll",
      data: {
        check: {
          associated: ["arc"],
          ability: ["int"],
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

}
