import DDBEnricherData from "../data/DDBEnricherData";

export default class StinkBomb extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
    };
  }

}
