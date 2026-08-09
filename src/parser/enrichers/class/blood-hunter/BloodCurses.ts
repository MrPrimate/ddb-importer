import DDBEnricherData from "../../data/DDBEnricherData";

export default class BloodCurses extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }
}
