import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Quick Retreat (Elysium Diplomat, D&D Beyond Drops November 2026): a Reaction when an enemy ends
 * its turn within 5 feet, moving up to half your Speed without provoking Opportunity Attacks. DDB
 * sends the action with no range, which imports as a bare "ft".
 */
export default class QuickRetreat extends DDBEnricherData {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "reaction",
      activationCondition: "An enemy ends its turn within 5 feet of you",
      targetType: "self",
      data: {
        range: {
          override: true,
          value: null,
          units: "self",
        },
      },
    };
  }

}
