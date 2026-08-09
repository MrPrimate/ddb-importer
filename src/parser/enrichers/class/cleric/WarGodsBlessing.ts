import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarGodsBlessing extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

}
