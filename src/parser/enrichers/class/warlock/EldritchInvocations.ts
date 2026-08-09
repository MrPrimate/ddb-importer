import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchInvocations extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
