import DDBEnricherData from "../../data/DDBEnricherData";

export default class HeightenedFocus extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Patient Defense Healing",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "2@scale.monk.die.die",
          types: ["temphp"],
        }),
      },
    };
  }

  override get clearAutoEffects(): boolean {
    return true;
  }
}
