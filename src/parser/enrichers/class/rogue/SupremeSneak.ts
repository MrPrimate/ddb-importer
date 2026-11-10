import DDBEnricherData from "../../data/DDBEnricherData";

export default class SupremeSneak extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    // the 2014 feature has no Sneak Attack cost action
    if (this.is2014) return [];
    return [
      { action: { name: "Sneak Attack: Supreme Sneak (Cost: 1d6)", type: "class" } },
    ];
  }

}
