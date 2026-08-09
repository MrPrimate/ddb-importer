import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnvenomWeapons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }


  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Sneak Attack: Poison (Envenom)", type: "class" } },
    ];
  }

}
