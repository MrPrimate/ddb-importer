import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * 2014: a 1 minute entreaty regains all Pact Magic slots, once per Long Rest. 2024: the feature
 * only improves Magical Cunning, whose level 20 activity regains all the slots, so it has no
 * activity of its own (one here would regain them without spending a use).
 */
export default class EldritchMaster extends DDBEnricherData {

  get type(): IDDBActivityType | null {
    return this.is2014
      ? DDBEnricherData.ACTIVITY_TYPES.UTILITY
      : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Regain Pact Slots",
      targetType: "self",
      activationType: "minute",
      additionalConsumptionTargets: [
        {
          type: "attribute",
          value: "-@spells.pact.max",
          target: "spells.pact.value",
        },
      ],
    };
  }

}
