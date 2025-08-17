/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AccelerateDecelerate extends DDBEnricherData {

  get activity() {
    return {
      allowCritical: true,
    };
  }

}
