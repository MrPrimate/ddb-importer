import DDBEnricherData from "../../data/DDBEnricherData";

export default class SupremeSneak extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    // the 2014 feature has no Sneak Attack cost action
    if (this.is2014) return [];
    return [
      { action: { name: "Sneak Attack: Supreme Sneak (Cost: 1d6)", type: "class" } },
    ];
  }

}
