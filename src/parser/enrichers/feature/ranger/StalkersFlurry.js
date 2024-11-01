/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class StalkersFlurry extends DDBEnricherMixin {

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
