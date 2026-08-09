import DDBEnricherData from "../../data/DDBEnricherData";

export default class Maneuvers extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
