import DDBEnricherData from "../../data/DDBEnricherData";

export default class TouchOfDeath extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "min(@abilities.wis.mod + @classes.monk.levels, 1)",
          types: ["temphp"],
        }),
      },
    };
  }

}
