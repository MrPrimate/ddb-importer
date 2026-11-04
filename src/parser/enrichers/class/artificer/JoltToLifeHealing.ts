import DDBEnricherData from "../../data/DDBEnricherData";

export default class JoltToLifeHealing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `@classes.${this.classIdentifier("Artificer")}.levels`,
          types: ["healing"],
        }),
      },
    };
  }

}
