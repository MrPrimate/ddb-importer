import DDBEnricherData from "../data/DDBEnricherData";

export default class AccelerateDecelerate extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      allowCritical: true,
    };
  }

}
