/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EnvenomWeapons extends DDBEnricherData {

  get type() {
    return "none";
  }


  get additionalActivities() {
    return [
      { action: { name: "Sneak Attack: Poison (Envenom)", type: "class" } },
    ];
  }

}
