import DDBEnricherData from "../../data/DDBEnricherData";

export default class FleetStep extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Step of the Wind: Fleet Step", type: "class" } },
    ];
  }

}
