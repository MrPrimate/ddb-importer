/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArcanePropulsionArmorGauntlet extends DDBEnricherData {

  get type() {
    return null;
  }

  get activity() {
    return null;
  }

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      data: {
        "system.properties": utils.addToProperties(this.data.system.properties, "mgc"),
      },
    };
  }


}
