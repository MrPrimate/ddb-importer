import DDBEnricherData from "../../data/DDBEnricherData";

export default class WarGodsBlessing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

}
