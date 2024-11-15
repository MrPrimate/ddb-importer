/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UseMagicDeviceScroll extends DDBEnricherData {

  get type() {
    return "check";
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
