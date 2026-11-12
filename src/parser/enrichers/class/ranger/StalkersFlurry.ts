import DDBEnricherData from "../../data/DDBEnricherData";

export default class StalkersFlurry extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    // the Dreadful Strike actions are 2024; the 2014 feature has none
    if (this.is2014) return [];
    return [
      { action: { name: "Dreadful Strike: Sudden Strike", type: "class" } },
      { action: { name: "Dreadful Strike: Mass Fear", type: "class" } },
    ];

  }

}
