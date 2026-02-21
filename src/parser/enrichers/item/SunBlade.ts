import DDBEnricherData from "../data/DDBEnricherData";

export default class SunBlade extends DDBEnricherData {

  get activity() {
    return {
      additionalDamageIncludeBase: true,
    };
  }

}
