import DDBEnricherData from "../data/DDBEnricherData";

export default class Durable extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Speedy Recovery", type: "feat" } },
    ];
  }

}
