import DDBEnricherData from "../data/DDBEnricherData";

export default class OttosIrresistableDance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
