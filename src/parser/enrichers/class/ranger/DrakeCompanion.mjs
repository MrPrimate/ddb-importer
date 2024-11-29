/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DrakeCompanion extends DDBEnricherData {

  get override() {
    return {
      data: {
        "system.uses.max": "",
        "system.uses.recovery": [],
      },
    };
  }

}
