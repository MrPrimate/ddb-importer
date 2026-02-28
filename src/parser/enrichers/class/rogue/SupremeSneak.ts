import DDBEnricherData from "../../data/DDBEnricherData";

export default class SupremeSneak extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities() {
    return [
      { action: { name: "Sneak Attack: Supreme Sneak (Cost: 1d6)", type: "class" } },
    ];
  }

}
