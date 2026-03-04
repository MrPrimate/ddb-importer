import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnvenomWeapons extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }


  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Sneak Attack: Poison (Envenom)", type: "class" } },
    ];
  }

}
