import DDBEnricherData from "../../data/DDBEnricherData";

export default class TouchOfDeath extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
