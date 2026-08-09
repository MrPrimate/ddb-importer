import DDBEnricherData from "../../data/DDBEnricherData";

export default class JoltToLifeHealing extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.artificer.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
