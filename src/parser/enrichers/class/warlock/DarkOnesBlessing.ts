import DDBEnricherData from "../../data/DDBEnricherData";

export default class DarkOnesBlessing extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationCondition: "Reduce an enemy to 0 HP",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@abilities.cha.mod + @classes.warlock.levels",
          types: ["temphp"],
        }),
      },
    };
  }

}
