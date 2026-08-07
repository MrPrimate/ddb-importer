import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodCurses extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get clearAutoEffects() {
    return true;
  }
}
