import DDBEnricherData from "../../data/DDBEnricherData";

export default class StalkersFlurry extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      { action: { name: "Dreadful Strike: Sudden Strike", type: "class" } },
      { action: { name: "Dreadful Strike: Mass Fear", type: "class" } },
    ];

  }

}
