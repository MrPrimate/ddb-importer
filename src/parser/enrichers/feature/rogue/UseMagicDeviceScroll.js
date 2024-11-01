/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class UseMagicDeviceScroll extends DDBEnricherMixin {

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
