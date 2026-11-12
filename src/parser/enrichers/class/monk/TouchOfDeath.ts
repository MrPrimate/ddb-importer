import DDBEnricherData from "../../data/DDBEnricherData";

export default class TouchOfDeath extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `max(@abilities.wis.mod + @classes.${this.classIdentifier("Monk")}.levels, 1)`,
          types: ["temphp"],
        }),
      },
    };
  }

}
