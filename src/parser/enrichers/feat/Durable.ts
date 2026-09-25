import DDBEnricherData from "../data/DDBEnricherData";

export default class Durable extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    return [
      { action: { name: "Speedy Recovery", type: "feat" } },
    ];
  }

}
