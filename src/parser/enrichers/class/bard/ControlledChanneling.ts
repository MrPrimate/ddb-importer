import DDBEnricherData from "../../data/DDBEnricherData";

export default class ControlledChanneling extends DDBEnricherData {

  // without this the action data auto-detects as a save/damage activity;
  // the Bardic Inspiration consumption comes from the description parse
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

}
