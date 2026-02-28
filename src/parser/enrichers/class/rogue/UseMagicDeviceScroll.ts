import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDeviceScroll extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  get activity() {
    return {
      name: "Scroll",
      data: {
        check: {
          associated: ["arc"],
          ability: "int",
          dc: {
            calculation: "",
            formula: "",
          },
        },
      },
    };
  }

}
