import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Obojima druid: dropping to 0 hit points instead restores half your hit points (once per long
 * rest), and DDB's Concussive Wave action carries the follow-up reaction.
 */
export default class WindsOfRevival extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData | null {
    if (this.isAction) return null;
    return {
      name: "Revive",
      targetType: "self",
      activationType: "special",
      activationCondition: "You are reduced to 0 hit points",
      addItemConsume: true,
      noTemplate: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "floor(@attributes.hp.max / 2)", types: ["healing"] }),
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  // DDB's plain "Winds of Revival" action duplicates the revival this enricher builds
  override get builtFeaturesFromActionFilters(): string[] {
    return ["Winds of Revival: Concussive Wave"];
  }

  // the wave follows the revival, so it spends nothing of its own; the use came from the filtered action
  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Winds of Revival: Concussive Wave"],
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Winds of Revival",
        max: "1",
        period: "lr",
      }),
    };
  }

}
