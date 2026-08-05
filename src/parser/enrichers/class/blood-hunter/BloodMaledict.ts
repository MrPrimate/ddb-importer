import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blood Maledict is the Blood Hunter's curse pool; the known Blood Curse
 * items are linked to it via CONSUMPTION_LINKS post-import. Uses come from
 * the matching DDB action's limitedUse (amount scales with level).
 */
export default class BloodMaledict extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

}
