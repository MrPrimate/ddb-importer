import DDBEnricherData from "../../data/DDBEnricherData";

export default class DisciplinedSurvivor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
