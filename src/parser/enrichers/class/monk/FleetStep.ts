import DDBEnricherData from "../../data/DDBEnricherData";

export default class FleetStep extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Step of the Wind: Fleet Step", type: "class" } },
    ];
  }

}
