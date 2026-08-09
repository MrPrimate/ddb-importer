import DDBEnricherData from "../data/DDBEnricherData";

export default class AccelerateDecelerate extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      allowCritical: true,
    };
  }

}
