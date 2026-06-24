import DDBEnricherData from "../../data/DDBEnricherData";

export default class JoltToLifeHealing extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
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
