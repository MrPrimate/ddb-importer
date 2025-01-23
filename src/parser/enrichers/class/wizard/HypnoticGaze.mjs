/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class HypnoticGaze extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.uses": {
          spent: null,
          max: "",
          recovery: [],
        },
      },
    };
  }

}
