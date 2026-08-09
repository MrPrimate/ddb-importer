import DDBEnricherData from "../../data/DDBEnricherData";

export default class Maneuvers extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
