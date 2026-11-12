import DDBEnricherData from "../../data/DDBEnricherData";

export default class UseMagicDevice extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    // the charge and scroll actions are 2024; the 2014 feature has none
    if (this.is2014) return [];
    return [
      { action: { name: "Use Magic Device: Charges", type: "class" } },
      { action: { name: "Use Magic Device: Scroll", type: "class" } },
    ];
  }

}
