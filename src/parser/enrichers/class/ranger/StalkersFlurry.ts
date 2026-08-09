import DDBEnricherData from "../../data/DDBEnricherData";

export default class StalkersFlurry extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Dreadful Strike: Sudden Strike", type: "class" } },
      { action: { name: "Dreadful Strike: Mass Fear", type: "class" } },
    ];

  }

}
