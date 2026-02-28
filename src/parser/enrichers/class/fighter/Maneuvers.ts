import DDBEnricherData from "../../data/DDBEnricherData";

export default class Maneuvers extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
