import DDBEnricherData from "../data/DDBEnricherData";

export default class SunBlade extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      additionalDamageIncludeBase: true,
    };
  }

}
