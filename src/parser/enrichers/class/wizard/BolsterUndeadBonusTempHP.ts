import DDBEnricherData from "../../data/DDBEnricherData";

export default class BolsterUndeadBonusTempHP extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bolster Undead",
      targetType: "ally",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.wizard.levels",
          types: ["temphp"],
        }),
        range: { value: "60", units: "ft" },
      },
    };
  }

}
