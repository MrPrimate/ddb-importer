import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraspingTentacles extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `@classes.${this.classIdentifier("Warlock")}.levels`,
          types: ["temphp"],
        }),
      },
    };
  }

}
