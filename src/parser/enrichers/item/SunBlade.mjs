/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class SunBlade extends DDBEnricherData {

  get activity() {
    return {
      additionalDamageIncludeBase: true,
    };
  }

}
