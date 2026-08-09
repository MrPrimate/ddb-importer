import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodCurses extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get clearAutoEffects() {
    return true;
  }
}
