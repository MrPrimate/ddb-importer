import DDBEnricherData from "../../data/DDBEnricherData";

export default class EldritchInvocations extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

}
