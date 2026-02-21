import DDBEnricherData from "../data/DDBEnricherData";

export default class AccelerateDecelerate extends DDBEnricherData {

  get activity() {
    return {
      allowCritical: true,
    };
  }

}
