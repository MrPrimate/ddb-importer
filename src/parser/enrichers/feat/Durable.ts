import DDBEnricherData from "../data/DDBEnricherData";

export default class Durable extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Speedy Recovery", type: "feat" } },
    ];
  }

}
