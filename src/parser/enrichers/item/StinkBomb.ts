import DDBEnricherData from "../data/DDBEnricherData";

export default class StinkBomb extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
    };
  }

}
