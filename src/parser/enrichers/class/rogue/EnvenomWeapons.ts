import DDBEnricherData from "../../data/DDBEnricherData";

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
